import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SeatsService } from './seats.service';
import { HoldSeatsDto, ReleaseSeatsDto } from './dto/seat.dto';

@ApiTags('Seats')
@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Get('flight/:flightId')
  @ApiOperation({ summary: 'Get seat map layout and availability for a flight' })
  getFlightSeats(@Param('flightId') flightId: string) {
    return this.seatsService.getFlightSeats(flightId);
  }

  @Post('hold')
  @ApiOperation({ summary: 'Hold selected seats with 15-minute TTL (strongly consistent transaction)' })
  holdSeats(@Body() dto: HoldSeatsDto) {
    return this.seatsService.holdSeats(dto);
  }

  @Post('release')
  @ApiOperation({ summary: 'Release held seats back to AVAILABLE' })
  releaseSeats(@Body() dto: ReleaseSeatsDto) {
    return this.seatsService.releaseSeats(dto);
  }
}
