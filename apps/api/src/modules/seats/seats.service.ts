import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HoldSeatsDto, ReleaseSeatsDto } from './dto/seat.dto';

@Injectable()
export class SeatsService {
  private readonly logger = new Logger('SeatsService');

  constructor(private readonly prisma: PrismaService) {}

  async getFlightSeats(flightId: string) {
    try {
      const flight = await this.prisma.flight.findUnique({
        where: { id: flightId },
        include: { aircraft: true },
      });

      if (!flight) {
        throw new NotFoundException('Không tìm thấy thông tin chuyến bay');
      }

      // Fast, zero-lock pure read of all flight seats
      const rawSeats = await this.prisma.seat.findMany({
        where: { flightId },
        orderBy: [{ row: 'asc' }, { col: 'asc' }],
      });

      const now = new Date();
      // Calculate expired holds in-memory so GET requests never require database write locks
      const seats = rawSeats.map((s) => {
        if (s.status === 'HELD' && s.heldUntil && new Date(s.heldUntil) <= now) {
          return {
            ...s,
            status: 'AVAILABLE',
            heldUntil: null,
            heldBySessionId: null,
          };
        }
        return s;
      });

      // Asynchronous background cleanup (non-blocking, never fails the user request)
      this.cleanupExpiredHolds(flightId, now).catch(() => {});

      return {
        flightId,
        flightNumber: flight.flightNumber,
        aircraftModel: flight.aircraft?.model || 'Airbus A321neo',
        totalSeats: seats.length,
        availableSeats: seats.filter((s) => s.status === 'AVAILABLE').length,
        seats,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error in getFlightSeats(${flightId}):`, error);

      // Resilient fallback: attempt minimal raw fetch to prevent 500 crashes
      const fallbackSeats = await this.prisma.seat.findMany({
        where: { flightId },
        orderBy: [{ row: 'asc' }, { col: 'asc' }],
      }).catch(() => []);

      return {
        flightId,
        flightNumber: 'VietSky',
        aircraftModel: 'Standard Aircraft',
        totalSeats: fallbackSeats.length,
        availableSeats: fallbackSeats.filter((s) => s.status === 'AVAILABLE').length,
        seats: fallbackSeats,
      };
    }
  }

  private async cleanupExpiredHolds(flightId: string, now: Date) {
    try {
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
    } catch {
      // Ignored safely in background
    }
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
    try {
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
    } catch (e) {
      this.logger.warn(`Failed to release seats:`, e);
    }

    return {
      success: true,
      message: 'Đã giải phóng ghế đã chọn.',
    };
  }
}
