import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailAdapter } from '../../common/adapters/email.adapter';
import { PaymentGatewayAdapter } from '../../common/adapters/payment-gateway.adapter';
import { generateTicketEmailHtml } from '../../common/templates/ticket-email.template';
import {
  CreateBookingDto,
  LookupBookingDto,
  CancelBookingDto,
  AddBaggageDto,
  UpgradeCabinDto,
} from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailAdapter: EmailAdapter,
    private readonly paymentGateway: PaymentGatewayAdapter,
  ) {}

  private calculateAge(dob: Date): number {
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  }

  private generatePnr(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pnr = 'VSK';
    for (let i = 0; i < 3; i++) {
      pnr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pnr;
  }

  async createBooking(dto: CreateBookingDto, currentUserId?: string) {
    if (!dto.passengers || dto.passengers.length === 0) {
      throw new BadRequestException('Vui lòng nhập thông tin ít nhất một hành khách');
    }

    // 1. Age & Child/Infant Validation
    let adultCount = 0;
    let childCount = 0;
    let infantCount = 0;

    for (const p of dto.passengers) {
      const dob = new Date(p.dateOfBirth);
      if (isNaN(dob.getTime())) {
        throw new BadRequestException(`Ngày sinh của hành khách ${p.firstName} không hợp lệ`);
      }
      const age = this.calculateAge(dob);

      if (p.passengerType === 'INFANT') {
        if (age >= 2) {
          throw new BadRequestException(
            `Hành khách em bé ${p.firstName} ${p.lastName} phải dưới 2 tuổi (hiện tại ${age} tuổi)`,
          );
        }
        infantCount++;
      } else if (p.passengerType === 'CHILD') {
        if (age < 2 || age >= 12) {
          throw new BadRequestException(
            `Hành khách trẻ em ${p.firstName} ${p.lastName} phải từ 2 đến dưới 12 tuổi (hiện tại ${age} tuổi)`,
          );
        }
        childCount++;
      } else {
        if (age < 12) {
          throw new BadRequestException(
            `Hành khách người lớn ${p.firstName} ${p.lastName} phải từ 12 tuổi trở lên`,
          );
        }
        adultCount++;
      }
    }

    if ((childCount > 0 || infantCount > 0) && adultCount === 0) {
      throw new BadRequestException(
        'Hành khách trẻ em và em bé bắt buộc phải có ít nhất 1 người lớn đi cùng.',
      );
    }
    if (infantCount > adultCount) {
      throw new BadRequestException(
        'Mỗi người lớn chỉ được đi kèm tối đa 1 em bé dưới 2 tuổi ngồi cùng ghế.',
      );
    }

    // 2. Pet Validation
    const petServices: any[] = [];
    if (dto.petDeclaration) {
      if (dto.petDeclaration.weightKg > 32) {
        throw new BadRequestException(
          'VietSky Airlines chỉ tiếp nhận vận chuyển thú cưng có trọng lượng tối đa 32kg.',
        );
      }
      petServices.push({
        serviceType: 'PET',
        serviceName: `Dịch vụ vận chuyển thú cưng (${dto.petDeclaration.breed}, ${dto.petDeclaration.weightKg}kg)`,
        quantity: 1,
        unitPrice: 800000,
        totalPrice: 800000,
        detailsJson: JSON.stringify(dto.petDeclaration),
        status: 'SELECTING',
      });
    }

    // 3. Flight & Fare Details
    const flight = await this.prisma.flight.findUnique({
      where: { id: dto.outboundFlightId },
      include: {
        fares: true,
        originAirport: true,
        destinationAirport: true,
      },
    });

    if (!flight || flight.isDisabled) {
      throw new NotFoundException('Chuyến bay không tồn tại hoặc đã bị hủy');
    }

    const fare = flight.fares.find((f) => f.cabinClass === dto.cabinClass);
    if (!fare) {
      throw new NotFoundException(`Hạng vé ${dto.cabinClass} không có sẵn trên chuyến bay này`);
    }

    // Seat count validation: adults + children need their own seats
    const seatRequiringPaxCount = adultCount + childCount;
    if (dto.outboundSeats.length !== seatRequiringPaxCount) {
      throw new BadRequestException(
        `Số lượng ghế đã chọn (${dto.outboundSeats.length}) phải khớp với số lượng hành khách cần ghế (${seatRequiringPaxCount}).`,
      );
    }

    // Pre-query the requested seats to check existence and dynamically calculate per-passenger fare
    const preSeats = await this.prisma.seat.findMany({
      where: {
        flightId: dto.outboundFlightId,
        seatNumber: { in: dto.outboundSeats },
      },
    });

    if (preSeats.length !== dto.outboundSeats.length) {
      throw new NotFoundException('Một hoặc nhiều ghế đã chọn không tồn tại');
    }

    // 4. Calculate Base Fare & Taxes dynamically based on the seat chosen for each passenger
    let baseFareTotal = 0;
    let seatIdxFare = 0;
    for (const p of dto.passengers) {
      let paxCabin = dto.cabinClass;
      if (p.passengerType !== 'INFANT' && seatIdxFare < dto.outboundSeats.length) {
        const seatNum = dto.outboundSeats[seatIdxFare++];
        const matched = preSeats.find((s) => s.seatNumber === seatNum);
        if (matched?.cabinClass) {
          paxCabin = matched.cabinClass;
        }
      }
      const paxFare = flight.fares.find((f) => f.cabinClass === paxCabin) || fare;
      const base = paxFare.basePrice;
      if (p.passengerType === 'INFANT') {
        baseFareTotal += base * 0.1;
      } else if (p.passengerType === 'CHILD') {
        baseFareTotal += base * 0.75;
      } else {
        baseFareTotal += base;
      }
    }

    const taxesAndFees = Math.round(baseFareTotal * 0.1 + (adultCount + childCount) * 120000);

    // 5. Additional Services Total
    let servicesTotal = 0;
    const combinedServices = [...(dto.services || []), ...petServices];
    for (const s of combinedServices) {
      servicesTotal += s.unitPrice * (s.quantity || 1);
    }

    // 6. Discount application
    let discountAmount = 0;
    let appliedDiscountCode: string | null = null;
    if (dto.discountCode) {
      const discount = await this.prisma.discount.findUnique({
        where: { code: dto.discountCode.toUpperCase().trim() },
      });

      if (
        discount &&
        discount.isActive &&
        new Date() >= discount.startDate &&
        new Date() <= discount.endDate
      ) {
        if (discount.discountType === 'PERCENTAGE') {
          discountAmount = (baseFareTotal * discount.value) / 100;
          if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
            discountAmount = discount.maxDiscountAmount;
          }
        } else {
          discountAmount = discount.value;
        }
        appliedDiscountCode = discount.code;
      }
    }

    const grandTotal = Math.max(0, baseFareTotal + taxesAndFees + servicesTotal - discountAmount);
    const holdDeadline = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes payment hold

    // 7. Atomic DB Transaction to create booking, lock seats, and issue tickets
    const result = await this.prisma.$transaction(async (tx) => {
      // Generate unique PNR
      let pnr = this.generatePnr();
      while (await tx.booking.findUnique({ where: { pnr } })) {
        pnr = this.generatePnr();
      }

      // Check and update seats
      const seats = await tx.seat.findMany({
        where: {
          flightId: dto.outboundFlightId,
          seatNumber: { in: dto.outboundSeats },
        },
      });

      if (seats.length !== dto.outboundSeats.length) {
        throw new NotFoundException('Một hoặc nhiều ghế đã chọn không tồn tại');
      }

      for (const s of seats) {
        if (s.status === 'BOOKED') {
          throw new ConflictException(`Ghế ${s.seatNumber} đã có người đặt`);
        }
      }

      // Mark seats as HELD under this booking
      await tx.seat.updateMany({
        where: {
          flightId: dto.outboundFlightId,
          seatNumber: { in: dto.outboundSeats },
        },
        data: {
          status: 'HELD',
          heldUntil: holdDeadline,
          heldBySessionId: dto.sessionId,
        },
      });

      // Create Booking record
      const booking = await tx.booking.create({
        data: {
          pnr,
          userId: currentUserId || null,
          customerEmail: dto.contactEmail.toLowerCase().trim(),
          customerPhone: dto.contactPhone.trim(),
          customerName: dto.contactName.trim(),
          status: 'PENDING_PAYMENT',
          bookingType: dto.passengers.length > 1 ? 'GROUP' : 'INDIVIDUAL',
          totalAmount: grandTotal,
          paidAmount: 0,
          balanceDue: grandTotal,
          holdDeadline,
          discountCode: appliedDiscountCode,
          discountAmount,
        },
      });

      // Create Passenger and Ticket records
      let seatIdx = 0;
      for (const p of dto.passengers) {
        if (!p.passportNumber?.trim()) {
          throw new BadRequestException(
            `Hành khách ${p.lastName} ${p.firstName}: Bắt buộc phải cung cấp số CCCD hoặc Hộ chiếu`,
          );
        }

        const pax = await tx.passenger.create({
          data: {
            bookingId: booking.id,
            firstName: p.firstName,
            lastName: p.lastName,
            passengerType: p.passengerType,
            dateOfBirth: new Date(p.dateOfBirth),
            passportNumber: p.passportNumber.trim(),
            nationality: p.nationality || 'VNM',
          },
        });

        // Assign seat if not infant
        if (p.passengerType !== 'INFANT' && seatIdx < dto.outboundSeats.length) {
          const seatNumber = dto.outboundSeats[seatIdx++];
          const seat = seats.find((s) => s.seatNumber === seatNumber);
          const paxCabin = seat?.cabinClass || dto.cabinClass;
          const paxFare = flight.fares.find((f) => f.cabinClass === paxCabin) || fare;

          await tx.ticket.create({
            data: {
              bookingId: booking.id,
              passengerId: pax.id,
              flightId: dto.outboundFlightId,
              seatId: seat?.id || seats[0].id,
              cabinClass: paxCabin,
              ticketNumber: `738-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`,
              status: 'ISSUED',
              price: paxFare.basePrice,
            },
          });
        }
      }

      // Atomically mark the assigned seats as BOOKED so they disappear from seat selection for other users immediately
      await tx.seat.updateMany({
        where: {
          flightId: dto.outboundFlightId,
          seatNumber: { in: dto.outboundSeats },
        },
        data: {
          status: 'BOOKED',
          heldUntil: null,
          heldBySessionId: null,
        },
      });

      // Create Additional Services
      for (const s of combinedServices) {
        await tx.bookingService.create({
          data: {
            bookingId: booking.id,
            serviceType: s.serviceType,
            serviceName: s.serviceName,
            quantity: s.quantity || 1,
            unitPrice: s.unitPrice,
            totalPrice: s.unitPrice * (s.quantity || 1),
            detailsJson: s.detailsJson || null,
            status: 'SELECTING',
          },
        });
      }

      return {
        bookingId: booking.id,
        pnr: booking.pnr,
        status: booking.status,
        totalAmount: booking.totalAmount,
        customerEmail: booking.customerEmail,
        customerName: booking.customerName,
        holdDeadline: booking.holdDeadline,
        flightNumber: flight.flightNumber,
        route: `${flight.originAirport.code} ➔ ${flight.destinationAirport.code}`,
        flightRouteName: `${flight.originAirport.city} ➔ ${flight.destinationAirport.city}`,
        passengersCount: dto.passengers.length,
        priceBreakdown: {
          baseFare: baseFareTotal,
          taxesAndFees,
          servicesTotal,
          discountAmount,
          grandTotal,
        },
      };
    }, { maxWait: 10000, timeout: 20000 });

    // Asynchronously dispatch email side effect outside transaction
    this.emailAdapter.sendEmail({
      to: result.customerEmail,
      subject: `Mã đặt chỗ của quý khách: ${result.pnr} - VietSky Airlines`,
      template: 'BOOKING_CREATED',
      htmlContent: `
        <h2>Cảm ơn quý khách ${result.customerName} đã đặt vé cùng VietSky Airlines!</h2>
        <p>Mã đặt chỗ (PNR): <strong style="font-size: 20px; color: #0f2b5c;">${result.pnr}</strong></p>
        <p>Chuyến bay: <strong>${result.flightNumber}</strong> (${result.flightRouteName})</p>
        <p>Tổng thanh toán: <strong>${result.totalAmount.toLocaleString('vi-VN')} VND</strong></p>
        <p>Thời hạn thanh toán giữ chỗ: <strong>${result.holdDeadline.toLocaleString('vi-VN')}</strong></p>
        <p>Quý khách có thể quản lý hoặc thanh toán đặt chỗ bất cứ lúc nào tại trang Quản lý đặt chỗ với mã PNR và email.</p>
      `,
    }).catch(console.error);

    return result;
  }

  async lookupBooking(dto: LookupBookingDto) {
    const contactFilters: any[] = [];
    if (dto.email) {
      contactFilters.push({ customerEmail: dto.email.toLowerCase().trim() });
    }
    if (dto.phone) {
      contactFilters.push({ customerPhone: dto.phone.trim() });
    }

    const whereClause: any = {
      pnr: dto.pnr.toUpperCase().trim(),
    };
    if (contactFilters.length > 0) {
      whereClause.OR = contactFilters;
    }

    const booking = await this.prisma.booking.findFirst({
      where: whereClause,
      include: {
        passengers: true,
        tickets: {
          include: {
            passenger: true,
            flight: {
              include: { originAirport: true, destinationAirport: true, aircraft: true },
            },
            seat: true,
          },
        },
        services: true,
        payments: true,
        refunds: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đặt vé với mã PNR và thông tin đã cung cấp');
    }

    return booking;
  }

  async getCustomerBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        passengers: true,
        tickets: {
          include: {
            passenger: true,
            flight: {
              include: { originAirport: true, destinationAirport: true, aircraft: true },
            },
            seat: true,
          },
        },
        services: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelBooking(pnr: string, dto: CancelBookingDto, actorId?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { pnr: pnr.toUpperCase().trim() },
      include: {
        tickets: { include: { flight: true, seat: true } },
        payments: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy mã đặt chỗ');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Mã đặt chỗ này đã bị hủy trước đó');
    }

    const firstTicket = booking.tickets[0];
    if (firstTicket && new Date() >= firstTicket.flight.departureTime) {
      throw new BadRequestException('Không thể hủy vé của chuyến bay đã khởi hành');
    }

    const cancellationFeePerTicket = 300000;
    const totalPenalty = booking.tickets.length * cancellationFeePerTicket;
    const refundAmount = Math.max(0, booking.paidAmount - totalPenalty);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Release all booked/held seats back to AVAILABLE immediately
      const seatIds = booking.tickets.map((t) => t.seatId);
      if (seatIds.length > 0) {
        await tx.seat.updateMany({
          where: { id: { in: seatIds } },
          data: {
            status: 'AVAILABLE',
            heldUntil: null,
            heldBySessionId: null,
          },
        });
      }

      // Also mark all tickets as CANCELLED
      await tx.ticket.updateMany({
        where: { bookingId: booking.id },
        data: {
          status: 'CANCELLED',
        },
      });

      // 2. Process mock refund if there was any paid amount
      let refundRecord: any = null;
      if (refundAmount > 0 && booking.payments.length > 0) {
        const lastPayment = booking.payments[booking.payments.length - 1];
        await this.paymentGateway.processRefund({
          transactionCode: lastPayment.transactionCode,
          amount: refundAmount,
          reason: dto.reason,
        });

        refundRecord = await tx.refund.create({
          data: {
            bookingId: booking.id,
            paymentId: lastPayment.id,
            amount: refundAmount,
            penaltyFee: totalPenalty,
            reason: dto.reason,
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        });
      }

      // 3. Update Booking status to CANCELLED
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          cancelReason: dto.reason,
        },
      });

      // 4. Log cancellation
      if (actorId) {
        await tx.bookingRequestLog.create({
          data: {
            bookingId: booking.id,
            staffId: actorId,
            action: 'CANCEL',
            previousStatus: booking.status,
            newStatus: 'CANCELLED',
            reason: dto.reason,
          },
        });
      }

      return {
        success: true,
        pnr: booking.pnr,
        customerEmail: booking.customerEmail,
        status: updatedBooking.status,
        penaltyFee: totalPenalty,
        refundAmount,
        message: 'Đặt chỗ đã được hủy thành công. Số tiền hoàn lại đã được xử lý.',
      };
    }, { maxWait: 10000, timeout: 20000 });

    // Asynchronously dispatch refund confirmation email outside transaction
    this.emailAdapter.sendEmail({
      to: result.customerEmail,
      subject: `Xác nhận hủy đặt chỗ & hoàn tiền - PNR: ${result.pnr}`,
      template: 'REFUND_NOTICE',
      htmlContent: `
        <h2>Xác nhận hủy đặt chỗ VietSky Airlines</h2>
        <p>Mã đặt chỗ <strong>${result.pnr}</strong> đã được hủy thành công theo yêu cầu của quý khách.</p>
        <p>Số tiền đã thanh toán: ${booking.paidAmount.toLocaleString('vi-VN')} VND</p>
        <p>Phí hủy vé theo quy định: ${totalPenalty.toLocaleString('vi-VN')} VND</p>
        <p>Số tiền hoàn trả: <strong style="color: #10b981;">${refundAmount.toLocaleString('vi-VN')} VND</strong></p>
        <p>Tiền hoàn sẽ được chuyển về tài khoản ban đầu trong vòng 3-5 ngày làm việc.</p>
      `,
    }).catch(console.error);

    return result;
  }

  async upgradeCabin(pnr: string, dto: UpgradeCabinDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { pnr: pnr.toUpperCase().trim() },
      include: {
        tickets: { include: { flight: { include: { fares: true } } } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy mã đặt chỗ');
    }

    const ticket = booking.tickets[0];
    if (!ticket) {
      throw new BadRequestException('Không tìm thấy vé hợp lệ để nâng hạng');
    }

    const targetFare = ticket.flight.fares.find((f) => f.cabinClass === dto.targetCabinClass);
    const currentFare = ticket.flight.fares.find((f) => f.cabinClass === ticket.cabinClass);

    if (!targetFare) {
      throw new BadRequestException(`Không tìm thấy hạng vé ${dto.targetCabinClass} cho chuyến bay này`);
    }

    const priceDiff = Math.max(0, targetFare.basePrice - (currentFare?.basePrice || 0));

    // Check new seat
    const newSeat = await this.prisma.seat.findFirst({
      where: {
        flightId: ticket.flightId,
        seatNumber: dto.newSeatNumber,
        cabinClass: dto.targetCabinClass,
      },
    });

    if (!newSeat || newSeat.status === 'BOOKED') {
      throw new ConflictException(`Ghế ${dto.newSeatNumber} không có sẵn hoặc đã được bán`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Release old seat
      await tx.seat.update({
        where: { id: ticket.seatId },
        data: { status: 'AVAILABLE', heldUntil: null, heldBySessionId: null },
      });

      // Occupy new seat
      await tx.seat.update({
        where: { id: newSeat.id },
        data: { status: 'BOOKED' },
      });

      // Update ticket
      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          seatId: newSeat.id,
          cabinClass: dto.targetCabinClass,
          price: targetFare.basePrice,
        },
      });

      // Update booking balance
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          totalAmount: booking.totalAmount + priceDiff,
          balanceDue: booking.balanceDue + priceDiff,
        },
      });

      return {
        success: true,
        pnr: booking.pnr,
        newCabinClass: dto.targetCabinClass,
        newSeatNumber: dto.newSeatNumber,
        priceDifference: priceDiff,
        newTotal: updatedBooking.totalAmount,
        balanceDue: updatedBooking.balanceDue,
      };
    });
  }

  async addCheckedBaggage(pnr: string, dto: AddBaggageDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { pnr: pnr.toUpperCase().trim() },
      include: { services: true, passengers: true },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy mã đặt chỗ');
    }

    // Check existing baggage added
    const existingBaggageWeight = booking.services
      .filter((s) => s.serviceType === 'BAGGAGE')
      .reduce((sum, s) => {
        try {
          const data = JSON.parse(s.detailsJson || '{}');
          return sum + (data.weightKg || 0);
        } catch {
          return sum;
        }
      }, 0);

    const airlineMaxLimitKg = 40;
    if (existingBaggageWeight + dto.weightKg > airlineMaxLimitKg) {
      throw new BadRequestException(
        `Vượt quá giới hạn hành lý ký gửi mua thêm của hãng (Tối đa ${airlineMaxLimitKg}kg, quý khách đã mua ${existingBaggageWeight}kg).`,
      );
    }

    // Pricing calculation
    let fee = 180000;
    if (dto.weightKg >= 30) fee = 450000;
    else if (dto.weightKg >= 20) fee = 320000;
    else if (dto.weightKg >= 15) fee = 250000;

    const passengerId = dto.passengerId || booking.passengers[0]?.id;

    const service = await this.prisma.bookingService.create({
      data: {
        bookingId: booking.id,
        passengerId,
        serviceType: 'BAGGAGE',
        serviceName: `Hành lý ký gửi bổ sung ${dto.weightKg}kg`,
        quantity: 1,
        unitPrice: fee,
        totalPrice: fee,
        detailsJson: JSON.stringify({ weightKg: dto.weightKg }),
        status: 'CONFIRMED',
      },
    });

    const updatedBooking = await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        totalAmount: booking.totalAmount + fee,
        balanceDue: booking.balanceDue + fee,
      },
    });

    return {
      success: true,
      service,
      totalBaggageKg: existingBaggageWeight + dto.weightKg,
      addedFee: fee,
      newTotal: updatedBooking.totalAmount,
      balanceDue: updatedBooking.balanceDue,
    };
  }

  // Staff Management
  async getBookingRequests(query?: { status?: string; search?: string }) {
    const where: any = {};
    if (query?.status) {
      where.status = query.status;
    }
    if (query?.search) {
      where.OR = [
        { pnr: { contains: query.search } },
        { customerEmail: { contains: query.search } },
        { customerName: { contains: query.search } },
      ];
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        passengers: true,
        tickets: {
          include: {
            passenger: true,
            flight: { include: { originAirport: true, destinationAirport: true, aircraft: true } },
            seat: true,
          },
        },
        services: true,
        requestLogs: { include: { staff: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async updateBookingStatus(id: string, newStatus: string, reason: string, staffId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { tickets: true },
    });
    if (!booking) {
      throw new NotFoundException('Không tìm thấy yêu cầu đặt vé');
    }

    const previousStatus = booking.status;

    return this.prisma.$transaction(async (tx) => {
      // If booking is cancelled or expired, release all seats back to AVAILABLE immediately
      if (newStatus === 'CANCELLED' || newStatus === 'EXPIRED') {
        const seatIds = booking.tickets.map((t) => t.seatId);
        if (seatIds.length > 0) {
          await tx.seat.updateMany({
            where: { id: { in: seatIds } },
            data: {
              status: 'AVAILABLE',
              heldUntil: null,
              heldBySessionId: null,
            },
          });
        }
        await tx.ticket.updateMany({
          where: { bookingId: booking.id },
          data: { status: 'CANCELLED' },
        });
      }

      const updated = await tx.booking.update({
        where: { id },
        data: { status: newStatus },
      });

      await tx.bookingRequestLog.create({
        data: {
          bookingId: id,
          staffId,
          action: 'UPDATE_STATUS',
          previousStatus,
          newStatus,
          reason: reason || 'Cập nhật bởi nhân viên nghiệp vụ',
        },
      });

      return updated;
    });
  }

  async sendTicketEmail(pnr: string, targetEmail?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { pnr: pnr.toUpperCase().trim() },
      include: {
        passengers: true,
        tickets: {
          include: {
            passenger: true,
            flight: {
              include: { originAirport: true, destinationAirport: true, aircraft: true },
            },
            seat: true,
          },
        },
        payments: true,
        services: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đặt chỗ');
    }

    const emailToSend = (targetEmail || booking.customerEmail).toLowerCase().trim();
    if (!emailToSend || !emailToSend.includes('@')) {
      throw new BadRequestException('Địa chỉ email không hợp lệ');
    }

    const htmlContent = generateTicketEmailHtml(booking);

    const sent = await this.emailAdapter.sendEmail({
      to: emailToSend,
      subject: `[Hạt Gạo Sky] Thẻ lên tàu bay điện tử & Vé máy bay - PNR: ${booking.pnr}`,
      template: 'TICKET_BOARDING_PASS',
      htmlContent,
    });

    return {
      success: true,
      sentViaRealSmtp: sent,
      recipient: emailToSend,
      pnr: booking.pnr,
      message: sent
        ? `Vé điện tử và Thẻ lên tàu bay đã được gửi thành công đến ${emailToSend}!`
        : `Lệnh gửi mail đã hoàn tất. Xem trạng thái gửi thực tế tại /api/bookings/email-diagnostic`,
    };
  }

  getEmailDiagnostic() {
    if ('getLastDiagnostic' in this.emailAdapter) {
      return (this.emailAdapter as any).getLastDiagnostic();
    }
    return { message: 'Diagnostics not available' };
  }

  async sendTestEmail(toEmail?: string) {
    const target = toEmail || process.env.BREVO_SENDER_EMAIL || 'fukk223345@gmail.com';
    const sent = await this.emailAdapter.sendEmail({
      to: target,
      subject: '[VietSky Test] Kiểm tra gửi email hệ thống',
      template: 'test',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #0f172a;">✈️ VietSky Airlines - Email Test</h2>
          <p>Chúc mừng! Hệ thống Brevo đã kết nối thành công với tài khoản của bạn.</p>
          <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
          <p><strong>Người nhận:</strong> ${target}</p>
        </div>
      `,
    });
    return {
      success: sent,
      recipient: target,
      diagnostic: this.getEmailDiagnostic(),
    };
  }
}
