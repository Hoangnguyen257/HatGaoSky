import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailAdapter } from '../../common/adapters/email.adapter';
import { CacheAdapter } from '../../common/adapters/cache.adapter';
import {
  SearchFlightsDto,
  CreateFlightDto,
  UpdateFlightDto,
  CompareFlightsDto,
} from './dto/flight.dto';

@Injectable()
export class FlightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailAdapter: EmailAdapter,
    private readonly cacheAdapter: CacheAdapter,
  ) {}

  async getAirports() {
    return this.prisma.airport.findMany({
      orderBy: { country: 'desc' },
    });
  }

  async searchFlights(dto: SearchFlightsDto) {
    if (dto.origin.toUpperCase() === dto.destination.toUpperCase()) {
      throw new BadRequestException('Điểm khởi hành và điểm đến không được trùng nhau');
    }

    const depDate = new Date(dto.departureDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(depDate.getTime())) {
      throw new BadRequestException('Ngày khởi hành không hợp lệ');
    }

    const cacheKey = `flights:${dto.origin}:${dto.destination}:${dto.departureDate}:${dto.cabinClass || 'ALL'}:${dto.passengers}`;
    const cached = await this.cacheAdapter.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Helper to query flights for a route and date
    const queryOneWay = async (originCode: string, destCode: string, dateStr: string) => {
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);

      const flights = await this.prisma.flight.findMany({
        where: {
          originAirport: { code: originCode.toUpperCase() },
          destinationAirport: { code: destCode.toUpperCase() },
          departureTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
          isDisabled: false,
          status: { notIn: ['CANCELLED'] },
        },
        include: {
          originAirport: true,
          destinationAirport: true,
          aircraft: true,
          fares: true,
        },
        orderBy: { departureTime: 'asc' },
      });

      // In case exact date has no flights in demo, also find any flights on that route to offer flexible options
      let results = flights;
      if (results.length === 0) {
        results = await this.prisma.flight.findMany({
          where: {
            originAirport: { code: originCode.toUpperCase() },
            destinationAirport: { code: destCode.toUpperCase() },
            isDisabled: false,
            status: { notIn: ['CANCELLED'] },
          },
          include: {
            originAirport: true,
            destinationAirport: true,
            aircraft: true,
            fares: true,
          },
          take: 5,
          orderBy: { departureTime: 'asc' },
        });
      }

      // Apply cabinClass filter
      if (dto.cabinClass) {
        results = results.filter((f) =>
          f.fares.some(
            (fare) =>
              fare.cabinClass === dto.cabinClass && fare.availableSeats >= dto.passengers,
          ),
        );
      }

      // Apply timeOfDay filter
      if (dto.timeOfDay) {
        results = results.filter((f) => {
          const hour = new Date(f.departureTime).getHours();
          if (dto.timeOfDay === 'MORNING') return hour < 12;
          if (dto.timeOfDay === 'AFTERNOON') return hour >= 12 && hour < 18;
          if (dto.timeOfDay === 'EVENING') return hour >= 18;
          return true;
        });
      }

      // Apply price range filter
      if (dto.minPrice || dto.maxPrice) {
        results = results.filter((f) => {
          const lowestFare = Math.min(...f.fares.map((fa) => fa.basePrice));
          if (dto.minPrice && lowestFare < dto.minPrice) return false;
          if (dto.maxPrice && lowestFare > dto.maxPrice) return false;
          return true;
        });
      }

      // Apply sorting
      if (dto.sortBy) {
        results.sort((a, b) => {
          const lowestA = Math.min(...a.fares.map((fa) => fa.basePrice));
          const lowestB = Math.min(...b.fares.map((fa) => fa.basePrice));

          if (dto.sortBy === 'PRICE_ASC') return lowestA - lowestB;
          if (dto.sortBy === 'PRICE_DESC') return lowestB - lowestA;
          if (dto.sortBy === 'DURATION_ASC') return a.durationMinutes - b.durationMinutes;
          if (dto.sortBy === 'DEPARTURE_ASC')
            return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
          return 0;
        });
      }

      return results;
    };

    const outboundFlights = await queryOneWay(dto.origin, dto.destination, dto.departureDate);

    let returnFlights: any[] = [];
    if (dto.returnDate) {
      returnFlights = await queryOneWay(dto.destination, dto.origin, dto.returnDate);
    }

    const payload = {
      searchParams: dto,
      isRoundTrip: !!dto.returnDate,
      totalOutbound: outboundFlights.length,
      totalReturn: returnFlights.length,
      outboundFlights,
      returnFlights,
      emptyMessage:
        outboundFlights.length === 0
          ? 'Không tìm thấy chuyến bay phù hợp với tiêu chí tìm kiếm của quý khách. Quý khách vui lòng thử chọn ngày khác hoặc tuyến bay khác.'
          : null,
    };

    // Cache results for 60 seconds
    await this.cacheAdapter.set(cacheKey, payload, 60);

    return payload;
  }

  async getFlightDetail(id: string) {
    const flight = await this.prisma.flight.findUnique({
      where: { id },
      include: {
        originAirport: true,
        destinationAirport: true,
        aircraft: true,
        fares: true,
      },
    });

    if (!flight) {
      throw new NotFoundException('Không tìm thấy chuyến bay yêu cầu');
    }

    return flight;
  }

  async compareFlights(dto: CompareFlightsDto) {
    if (!dto.flightIds || dto.flightIds.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất 1 chuyến bay để so sánh');
    }
    if (dto.flightIds.length > 3) {
      throw new BadRequestException('Chỉ có thể so sánh tối đa 3 chuyến bay cùng lúc');
    }

    const flights = await this.prisma.flight.findMany({
      where: { id: { in: dto.flightIds } },
      include: {
        originAirport: true,
        destinationAirport: true,
        aircraft: true,
        fares: true,
      },
    });

    return {
      comparisonItems: flights.map((f) => ({
        id: f.id,
        flightNumber: f.flightNumber,
        aircraft: f.aircraft.model,
        route: `${f.originAirport.city} (${f.originAirport.code}) ➔ ${f.destinationAirport.city} (${f.destinationAirport.code})`,
        departureTime: f.departureTime,
        arrivalTime: f.arrivalTime,
        durationMinutes: f.durationMinutes,
        status: f.status,
        fares: f.fares.map((fa) => ({
          cabinClass: fa.cabinClass,
          basePrice: fa.basePrice,
          baggageAllowanceKg: fa.baggageAllowanceKg,
          cabinBaggageKg: fa.cabinBaggageKg,
          refundFee: fa.refundFee,
          changeFee: fa.changeFee,
          availableSeats: fa.availableSeats,
        })),
      })),
    };
  }

  // Staff/Admin Methods
  async getAllFlights() {
    return this.prisma.flight.findMany({
      include: {
        originAirport: true,
        destinationAirport: true,
        aircraft: true,
        fares: true,
      },
      orderBy: { departureTime: 'desc' },
      take: 50,
    });
  }

  async createFlight(dto: CreateFlightDto) {
    const dep = new Date(dto.departureTime);
    const arr = new Date(dto.arrivalTime);

    if (dep <= new Date()) {
      throw new BadRequestException('Thời gian khởi hành phải ở tương lai');
    }
    if (arr <= dep) {
      throw new BadRequestException('Thời gian hạ cánh phải sau thời gian cất cánh');
    }
    if (dto.originAirportId === dto.destinationAirportId) {
      throw new BadRequestException('Sân bay khởi hành và sân bay đến không được giống nhau');
    }

    // Aircraft Conflict Check: aircraft must not be double-booked
    const conflict = await this.prisma.flight.findFirst({
      where: {
        aircraftId: dto.aircraftId,
        isDisabled: false,
        status: { notIn: ['CANCELLED'] },
        OR: [
          {
            departureTime: { lte: arr },
            arrivalTime: { gte: dep },
          },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException(
        `Máy bay này đã được xếp lịch cho chuyến bay ${conflict.flightNumber} trong khung giờ này`,
      );
    }

    const aircraft = await this.prisma.aircraft.findUnique({
      where: { id: dto.aircraftId },
    });
    if (!aircraft) {
      throw new NotFoundException('Máy bay không tồn tại');
    }

    const flight = await this.prisma.flight.create({
      data: {
        flightNumber: dto.flightNumber,
        aircraftId: dto.aircraftId,
        originAirportId: dto.originAirportId,
        destinationAirportId: dto.destinationAirportId,
        departureTime: dep,
        arrivalTime: arr,
        durationMinutes: dto.durationMinutes,
        fares: {
          create: dto.fares.map((f) => ({
            cabinClass: f.cabinClass,
            basePrice: f.basePrice,
            availableSeats: f.availableSeats,
            baggageAllowanceKg: f.baggageAllowanceKg || 20,
            cabinBaggageKg: f.cabinBaggageKg || 7,
            refundFee: f.refundFee || 300000,
            changeFee: f.changeFee || 200000,
          })),
        },
      },
      include: { fares: true },
    });

    // Auto-generate seats for this flight
    const seatsToInsert = [];
    for (let r = 1; r <= 3; r++) {
      for (const col of ['A', 'C', 'D', 'G']) {
        seatsToInsert.push({
          aircraftId: dto.aircraftId,
          flightId: flight.id,
          seatNumber: `${r}${col}`,
          cabinClass: 'BUSINESS',
          row: r,
          col,
          status: 'AVAILABLE',
        });
      }
    }
    for (let r = 10; r <= 20; r++) {
      for (const col of ['A', 'B', 'C', 'D', 'E', 'F']) {
        seatsToInsert.push({
          aircraftId: dto.aircraftId,
          flightId: flight.id,
          seatNumber: `${r}${col}`,
          cabinClass: 'ECONOMY',
          row: r,
          col,
          status: 'AVAILABLE',
        });
      }
    }
    await this.prisma.seat.createMany({ data: seatsToInsert });

    return flight;
  }

  async updateFlight(id: string, dto: UpdateFlightDto) {
    const flight = await this.prisma.flight.findUnique({
      where: { id },
      include: {
        tickets: {
          include: { passenger: { include: { booking: true } } },
        },
      },
    });

    if (!flight) {
      throw new NotFoundException('Chuyến bay không tồn tại');
    }

    const updated = await this.prisma.flight.update({
      where: { id },
      data: {
        departureTime: dto.departureTime ? new Date(dto.departureTime) : undefined,
        arrivalTime: dto.arrivalTime ? new Date(dto.arrivalTime) : undefined,
        status: dto.status,
        disableReason: dto.disableReason,
      },
    });

    // Notify passengers if times changed
    if (dto.departureTime || dto.arrivalTime) {
      const emailList = Array.from(
        new Set(flight.tickets.map((t) => t.passenger.booking.customerEmail)),
      );
      for (const email of emailList) {
        await this.emailAdapter.sendEmail({
          to: email,
          subject: `Thông báo thay đổi lịch bay - Chuyến bay ${flight.flightNumber}`,
          template: 'FLIGHT_UPDATE',
          htmlContent: `
            <h2>Kính gửi Quý khách,</h2>
            <p>VietSky Airlines xin thông báo lịch bay chuyến <strong>${flight.flightNumber}</strong> đã được điều chỉnh.</p>
            <p>Giờ khởi hành mới: ${dto.departureTime ? new Date(dto.departureTime).toLocaleString('vi-VN') : flight.departureTime.toLocaleString('vi-VN')}</p>
            <p>Chúng tôi chân thành cáo lỗi vì sự bất tiện này.</p>
          `,
        });
      }
    }

    return updated;
  }

  async disableFlight(id: string, reason: string) {
    const flight = await this.prisma.flight.findUnique({
      where: { id },
      include: {
        tickets: {
          include: { passenger: { include: { booking: true } } },
        },
      },
    });

    if (!flight) {
      throw new NotFoundException('Chuyến bay không tồn tại');
    }

    if (new Date() >= flight.departureTime) {
      throw new BadRequestException('Không thể vô hiệu hóa chuyến bay đã cất cánh');
    }

    const updated = await this.prisma.flight.update({
      where: { id },
      data: {
        isDisabled: true,
        disableReason: reason || 'Kế hoạch khai thác thay đổi',
        status: 'CANCELLED',
      },
    });

    // Notify passengers
    const emailList = Array.from(
      new Set(flight.tickets.map((t) => t.passenger.booking.customerEmail)),
    );
    for (const email of emailList) {
      await this.emailAdapter.sendEmail({
        to: email,
        subject: `[QUAN TRỌNG] Hủy chuyến bay ${flight.flightNumber}`,
        template: 'FLIGHT_CANCELLED',
        htmlContent: `
          <h2>Kính gửi Quý khách,</h2>
          <p>VietSky Airlines rất tiếc phải thông báo chuyến bay <strong>${flight.flightNumber}</strong> đã bị hủy vì lý do: ${reason}.</p>
          <p>Quý khách sẽ được hỗ trợ đổi vé miễn phí hoặc hoàn tiền 100%.</p>
        `,
      });
    }

    return updated;
  }

  async removeFlight(id: string) {
    const flight = await this.prisma.flight.findUnique({
      where: { id },
      include: {
        tickets: {
          where: {
            booking: {
              status: { in: ['CONFIRMED', 'PENDING_PAYMENT', 'PARTIALLY_PAID'] },
            },
          },
        },
      },
    });

    if (!flight) {
      throw new NotFoundException('Chuyến bay không tồn tại');
    }

    if (flight.tickets.length > 0) {
      throw new BadRequestException(
        'Không thể xóa chuyến bay đang có hành khách đặt vé. Vui lòng sử dụng tính năng vô hiệu hóa (disable).',
      );
    }

    await this.prisma.flightFare.deleteMany({ where: { flightId: id } });
    await this.prisma.seat.deleteMany({ where: { flightId: id } });
    return this.prisma.flight.delete({ where: { id } });
  }
}
