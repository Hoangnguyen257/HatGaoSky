import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HoldSeatsDto, ReleaseSeatsDto } from './dto/seat.dto';

@Injectable()
export class SeatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFlightSeats(flightId: string) {
    const flight = await this.prisma.flight.findUnique({
      where: { id: flightId },
      include: { aircraft: true },
    });

    if (!flight) {
      throw new NotFoundException('Không tìm thấy thông tin chuyến bay');
    }

    // Automatically reset any expired holds first
    const now = new Date();
    await this.prisma.seat.updateMany({
      where: {
        flightId,
        status: 'HELD',
        heldUntil: { lte: now },
      },
      data: {
        status: 'AVAILABLE',
        heldUntil: null,
        heldBySessionId: null,
      },
    });

    // Auto-release seats that belong to CANCELLED/EXPIRED bookings or orphaned seats
    const bookedSeats = await this.prisma.seat.findMany({
      where: { flightId, status: 'BOOKED' },
      include: {
        tickets: {
          include: { booking: true },
        },
      },
    });

    const seatIdsToRelease: string[] = [];
    for (const s of bookedSeats) {
      if (s.tickets.length === 0) {
        seatIdsToRelease.push(s.id);
      } else {
        const hasActiveBooking = s.tickets.some(
          (t) => t.booking && t.booking.status !== 'CANCELLED' && t.booking.status !== 'EXPIRED',
        );
        if (!hasActiveBooking) {
          seatIdsToRelease.push(s.id);
        }
      }
    }

    if (seatIdsToRelease.length > 0) {
      await this.prisma.seat.updateMany({
        where: { id: { in: seatIdsToRelease } },
        data: {
          status: 'AVAILABLE',
          heldUntil: null,
          heldBySessionId: null,
        },
      });
    }

    const seats = await this.prisma.seat.findMany({
      where: { flightId },
      orderBy: [{ row: 'asc' }, { col: 'asc' }],
    });

    return {
      flightId,
      flightNumber: flight.flightNumber,
      aircraftModel: flight.aircraft.model,
      totalSeats: seats.length,
      availableSeats: seats.filter((s) => s.status === 'AVAILABLE').length,
      seats,
    };
  }

  async holdSeats(dto: HoldSeatsDto) {
    const now = new Date();
    const ttlMinutes = parseInt(process.env.SEAT_HOLD_TTL_MINUTES || '15', 10);
    const heldUntil = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      // 1. First reset any expired holds on these seats
      await tx.seat.updateMany({
        where: {
          flightId: dto.flightId,
          seatNumber: { in: dto.seatNumbers },
          status: 'HELD',
          heldUntil: { lte: now },
        },
        data: {
          status: 'AVAILABLE',
          heldUntil: null,
          heldBySessionId: null,
        },
      });

      // 2. Fetch current state of requested seats
      const currentSeats = await tx.seat.findMany({
        where: {
          flightId: dto.flightId,
          seatNumber: { in: dto.seatNumbers },
        },
      });

      if (currentSeats.length !== dto.seatNumbers.length) {
        throw new NotFoundException('Một hoặc nhiều ghế bạn chọn không tồn tại trên chuyến bay');
      }

      for (const seat of currentSeats) {
        if (seat.status === 'BOOKED') {
          throw new ConflictException(
            `Ghế ${seat.seatNumber} đã được bán. Quý khách vui lòng chọn ghế khác.`,
          );
        }

        if (
          seat.status === 'HELD' &&
          seat.heldUntil &&
          seat.heldUntil > now &&
          seat.heldBySessionId !== dto.sessionId
        ) {
          throw new ConflictException(
            `Ghế ${seat.seatNumber} đang được giữ chỗ bởi khách hàng khác. Vui lòng chọn ghế khác.`,
          );
        }
      }

      // 3. Atomically lock the seats to this session
      await tx.seat.updateMany({
        where: {
          flightId: dto.flightId,
          seatNumber: { in: dto.seatNumbers },
        },
        data: {
          status: 'HELD',
          heldUntil,
          heldBySessionId: dto.sessionId,
        },
      });

      return {
        success: true,
        message: `Đã giữ chỗ thành công ${dto.seatNumbers.length} ghế trong 15 phút.`,
        heldSeats: dto.seatNumbers,
        heldUntil: heldUntil.toISOString(),
        ttlSeconds: ttlMinutes * 60,
      };
    });
  }

  async releaseSeats(dto: ReleaseSeatsDto) {
    await this.prisma.seat.updateMany({
      where: {
        flightId: dto.flightId,
        seatNumber: { in: dto.seatNumbers },
        heldBySessionId: dto.sessionId,
        status: 'HELD',
      },
      data: {
        status: 'AVAILABLE',
        heldUntil: null,
        heldBySessionId: null,
      },
    });

    return {
      success: true,
      message: 'Đã giải phóng ghế đã chọn.',
    };
  }
}
