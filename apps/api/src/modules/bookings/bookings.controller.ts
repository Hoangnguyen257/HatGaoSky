import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  LookupBookingDto,
  CancelBookingDto,
  AddBaggageDto,
  UpgradeCabinDto,
} from './dto/booking.dto';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Create new booking with passenger validation, seat lock, and PNR generation' })
  createBooking(@Body() dto: CreateBookingDto, @CurrentUser() user?: any) {
    return this.bookingsService.createBooking(dto, user?.id);
  }

  @Post('lookup')
  @ApiOperation({ summary: 'Lookup reservation code by PNR and email or phone' })
  lookupBooking(@Body() dto: LookupBookingDto) {
    return this.bookingsService.lookupBooking(dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Customer view my booking history' })
  getMyBookings(@CurrentUser('id') userId: string) {
    return this.bookingsService.getCustomerBookings(userId);
  }

  @Post(':pnr/cancel')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Cancel booking with fare rule penalty calculation and refund processing' })
  cancelBooking(
    @Param('pnr') pnr: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.bookingsService.cancelBooking(pnr, dto, userId);
  }

  @Post(':pnr/upgrade')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Upgrade cabin class and choose a new seat' })
  upgradeCabin(@Param('pnr') pnr: string, @Body() dto: UpgradeCabinDto) {
    return this.bookingsService.upgradeCabin(pnr, dto);
  }

  @Post(':pnr/add-baggage')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Purchase additional checked baggage with airline max weight limit' })
  addCheckedBaggage(@Param('pnr') pnr: string, @Body() dto: AddBaggageDto) {
    return this.bookingsService.addCheckedBaggage(pnr, dto);
  }

  @Post(':pnr/send-ticket-email')
  @ApiOperation({ summary: 'Send electronic ticket and boarding pass directly to real email' })
  sendTicketEmail(
    @Param('pnr') pnr: string,
    @Body('email') email?: string,
  ) {
    return this.bookingsService.sendTicketEmail(pnr, email);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff list and filter booking requests' })
  getBookingRequests(@Query() query: { status?: string; search?: string }) {
    return this.bookingsService.getBookingRequests(query);
  }

  @Patch('requests/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff update booking status with audit log' })
  updateBookingStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('reason') reason: string,
    @CurrentUser('id') staffId: string,
  ) {
    return this.bookingsService.updateBookingStatus(id, status, reason, staffId);
  }
}
