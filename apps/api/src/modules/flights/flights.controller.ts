import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FlightsService } from './flights.service';
import {
  SearchFlightsDto,
  CreateFlightDto,
  UpdateFlightDto,
  CompareFlightsDto,
} from './dto/flight.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Flights')
@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Get('airports')
  @ApiOperation({ summary: 'List all operational airports' })
  getAirports() {
    return this.flightsService.getAirports();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search and filter flights with price range, time of day, and sorting' })
  search(@Query() query: SearchFlightsDto) {
    return this.flightsService.searchFlights(query);
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare up to 3 flights side-by-side' })
  compare(@Body() dto: CompareFlightsDto) {
    return this.flightsService.compareFlights(dto);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff/Manager/Admin list all flights' })
  getAllFlights() {
    return this.flightsService.getAllFlights();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed information about a single flight' })
  getDetail(@Param('id') id: string) {
    return this.flightsService.getFlightDetail(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff create a new flight with aircraft conflict check' })
  createFlight(@Body() dto: CreateFlightDto) {
    return this.flightsService.createFlight(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff update flight times and status (notifies passengers by email)' })
  updateFlight(@Param('id') id: string, @Body() dto: UpdateFlightDto) {
    return this.flightsService.updateFlight(id, dto);
  }

  @Patch(':id/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff disable flight (cancels and emails affected passengers)' })
  disableFlight(@Param('id') id: string, @Body('reason') reason: string) {
    return this.flightsService.disableFlight(id, reason);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'STAFF_MANAGER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff remove flight (only allowed if no active passenger bookings)' })
  removeFlight(@Param('id') id: string) {
    return this.flightsService.removeFlight(id);
  }
}
