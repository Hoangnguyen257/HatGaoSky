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
import { CheckoutDto, WebhookCallbackDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailAdapter: EmailAdapter,
    private readonly paymentGateway: PaymentGatewayAdapter,
  ) {}

  async checkout(dto: CheckoutDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { pnr: dto.pnr.toUpperCase().trim() },
      include: {
        tickets: {
          include: {
            flight: { include: { originAirport: true, destinationAirport: true } },
            seat: true,
          },
        },
        user: { include: { loyaltyAccount: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy thông tin đặt vé');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
      throw new BadRequestException(`Không thể thanh toán cho đơn hàng đã ${booking.status}`);
    }

    if (booking.balanceDue <= 0 && booking.status === 'CONFIRMED') {
      throw new BadRequestException('Đơn hàng này đã được thanh toán toàn bộ');
    }

    // 1. Pay Later Option
    if (dto.paymentType === 'PAY_LATER') {
      const payLaterDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          holdDeadline: payLaterDeadline,
        },
      });

      await this.emailAdapter.sendEmail({
        to: booking.customerEmail,
        subject: `Xác nhận giữ chỗ (Thanh toán sau) - Mã PNR: ${booking.pnr}`,
        template: 'PAY_LATER_NOTICE',
        htmlContent: `
          <h2>VietSky Airlines đã tiếp nhận yêu cầu giữ chỗ của quý khách</h2>
          <p>Mã đặt chỗ: <strong>${booking.pnr}</strong></p>
          <p>Hạn chót thanh toán: <strong>${payLaterDeadline.toLocaleString('vi-VN')}</strong></p>
          <p>Số tiền còn lại cần thanh toán: <strong>${booking.balanceDue.toLocaleString('vi-VN')} VND</strong></p>
          <p>Sau thời hạn này, nếu chưa thanh toán, vé sẽ tự động hết hạn.</p>
        `,
      });

      return {
        success: true,
        pnr: booking.pnr,
        bookingStatus: booking.status,
        paymentType: 'PAY_LATER',
        holdDeadline: payLaterDeadline,
        balanceDue: booking.balanceDue,
        message: 'Yêu cầu giữ chỗ thành công. Quý khách vui lòng thanh toán trước thời hạn.',
      };
    }

    // Determine amount to charge
    let amountToCharge = booking.balanceDue;
    if (dto.paymentType === 'PREPAY') {
      const minThreshold = Math.round(booking.totalAmount * 0.3); // Min 30%
      if (!dto.amount || dto.amount < minThreshold) {
        throw new BadRequestException(
          `Số tiền trả trước tối thiểu là 30% giá trị đơn hàng (${minThreshold.toLocaleString('vi-VN')} VND).`,
        );
      }
      if (dto.amount > booking.balanceDue) {
        throw new BadRequestException('Số tiền thanh toán vượt quá số dư còn lại');
      }
      amountToCharge = dto.amount;
    }

    // 2. Process via Mock Payment Gateway
    const gatewayResult = await this.paymentGateway.processPayment({
      bookingId: booking.id,
      amount: amountToCharge,
      method: dto.method as any,
      cardDetails: dto.cardDetails,
      ewalletProvider: dto.ewalletProvider,
    });

    if (!gatewayResult.success) {
      throw new BadRequestException(gatewayResult.errorMessage || 'Giao dịch thanh toán thất bại');
    }

    // 3. Atomically update DB, mark seats BOOKED, and calculate miles
    const result = await this.prisma.$transaction(async (tx) => {
      // Check idempotency if key provided
      if (dto.idempotencyKey) {
        const existingTxn = await tx.payment.findUnique({
          where: { idempKey: dto.idempotencyKey },
        });
        if (existingTxn) {
          return {
            success: true,
            pnr: booking.pnr,
            transactionCode: existingTxn.transactionCode,
            message: 'Giao dịch đã được ghi nhận trước đó',
          };
        }
      }

      // Record Payment
      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          transactionCode: gatewayResult.transactionCode,
          method: dto.method,
          amount: amountToCharge,
          status: 'SUCCESS',
          gatewayRef: gatewayResult.gatewayRef,
          cardLastFour: gatewayResult.cardLastFour || null,
          idempKey: dto.idempotencyKey || null,
          paidAt: new Date(),
        },
      });

      const newPaidAmount = booking.paidAmount + amountToCharge;
      const newBalanceDue = Math.max(0, booking.totalAmount - newPaidAmount);
      const newStatus = newBalanceDue === 0 ? 'CONFIRMED' : 'PARTIALLY_PAID';

      // Update Booking
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: newStatus,
        },
      });

      // If full payment or confirmed, turn held seats into BOOKED
      if (newStatus === 'CONFIRMED') {
        const seatIds = booking.tickets.map((t) => t.seatId);
        await tx.seat.updateMany({
          where: { id: { in: seatIds } },
          data: {
            status: 'BOOKED',
            heldUntil: null,
            heldBySessionId: null,
          },
        });

        // Accrue loyalty miles if customer is logged in (1 mile per 20,000 VND)
        if (booking.userId && booking.user?.loyaltyAccount) {
          const earnedMiles = Math.floor(booking.totalAmount / 20000);
          if (earnedMiles > 0) {
            const acc = booking.user.loyaltyAccount;
            const updatedAvailable = acc.availableMiles + earnedMiles;
            const updatedTotal = acc.totalMilesEarned + earnedMiles;

            // Tier evaluation (Standard < 5,000, Silver 5,000+, Gold 15,000+, Platinum 30,000+)
            let newTier = acc.tier;
            if (updatedTotal >= 30000) newTier = 'PLATINUM';
            else if (updatedTotal >= 15000) newTier = 'GOLD';
            else if (updatedTotal >= 5000) newTier = 'SILVER';

            await tx.loyaltyAccount.update({
              where: { id: acc.id },
              data: {
                availableMiles: updatedAvailable,
                totalMilesEarned: updatedTotal,
                tier: newTier,
              },
            });

            await tx.mileTransaction.create({
              data: {
                loyaltyAccountId: acc.id,
                type: 'EARN',
                amount: earnedMiles,
                balanceAfter: updatedAvailable,
                description: `Tích lũy dặm chuyến bay mã đặt chỗ ${booking.pnr}`,
                referenceId: booking.id,
              },
            });
          }
        }
      }

      return {
        success: true,
        transactionCode: payment.transactionCode,
        pnr: booking.pnr,
        customerEmail: booking.customerEmail,
        bookingStatus: newStatus,
        amountPaid: amountToCharge,
        balanceDue: newBalanceDue,
        firstFlightNumber: booking.tickets[0]?.flight?.flightNumber,
        routeSummary: booking.tickets[0]?.flight ? `${booking.tickets[0].flight.originAirport.city} ➔ ${booking.tickets[0].flight.destinationAirport.city}` : '',
        qrPayload: gatewayResult.qrPayload,
        cardLastFour: gatewayResult.cardLastFour,
        message:
          newStatus === 'CONFIRMED'
            ? 'Thanh toán thành công! Vé máy bay của quý khách đã được xuất.'
            : 'Thanh toán một phần thành công. Quý khách vui lòng thanh toán số dư còn lại trước ngày khởi hành.',
      };
    }, { maxWait: 10000, timeout: 20000 });

    // Asynchronously dispatch payment confirmation email outside transaction
    (async () => {
      try {
        const fullBooking = await this.prisma.booking.findUnique({
          where: { id: booking.id },
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
          },
        });

        const htmlContent = fullBooking
          ? generateTicketEmailHtml(fullBooking)
          : `<h2>Hạt Gạo Sky xác nhận thanh toán thành công</h2><p>Mã đặt chỗ: <strong>${result.pnr}</strong></p><p>Số tiền đã thanh toán: <strong>${result.amountPaid.toLocaleString('vi-VN')} VND</strong></p>`;

        await this.emailAdapter.sendEmail({
          to: result.customerEmail,
          subject: `[Hạt Gạo Sky] Xác nhận thanh toán & Vé máy bay điện tử - PNR: ${result.pnr}`,
          template: 'PAYMENT_SUCCESS',
          htmlContent,
        });
      } catch (e) {
        console.error('Failed to dispatch payment confirmation email:', e);
      }
    })();

    return result;
  }

  async handleWebhook(dto: WebhookCallbackDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { transactionCode: dto.transactionCode },
    });

    if (!payment) {
      throw new NotFoundException('Không tìm thấy giao dịch');
    }

    // Idempotent: if already in target status, return 200 immediately
    if (payment.status === dto.status) {
      return { received: true, status: payment.status };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: dto.status,
        gatewayRef: dto.gatewayRef,
      },
    });

    return { received: true, updatedStatus: dto.status };
  }
}
