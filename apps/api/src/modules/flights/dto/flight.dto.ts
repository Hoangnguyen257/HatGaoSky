import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  IsIn,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchFlightsDto {
  @ApiProperty({ example: 'SGN' })
  @IsString()
  @IsNotEmpty()
  origin: string;

  @ApiProperty({ example: 'HAN' })
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty({ example: '2026-10-28' })
  @IsDateString()
  departureDate: string;

  @ApiProperty({ example: '2026-10-31', required: false })
  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @ApiProperty({ example: 1, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  passengers: number = 1;

  @ApiProperty({ example: 'ECONOMY', enum: ['ECONOMY', 'BUSINESS', 'FIRST'], required: false })
  @IsOptional()
  @IsIn(['ECONOMY', 'BUSINESS', 'FIRST'])
  cabinClass?: string;

  // Filters
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @ApiProperty({ enum: ['MORNING', 'AFTERNOON', 'EVENING'], required: false })
  @IsOptional()
  @IsIn(['MORNING', 'AFTERNOON', 'EVENING'])
  timeOfDay?: string;

  @ApiProperty({ enum: ['PRICE_ASC', 'PRICE_DESC', 'DURATION_ASC', 'DEPARTURE_ASC'], required: false })
  @IsOptional()
  @IsIn(['PRICE_ASC', 'PRICE_DESC', 'DURATION_ASC', 'DEPARTURE_ASC'])
  sortBy?: string;
}

export class CreateFlightDto {
  @ApiProperty({ example: 'VSK-106' })
  @IsString()
  @IsNotEmpty()
  flightNumber: string;

  @ApiProperty({ example: 'uuid-of-aircraft' })
  @IsString()
  @IsNotEmpty()
  aircraftId: string;

  @ApiProperty({ example: 'uuid-of-origin-airport' })
  @IsString()
  @IsNotEmpty()
  originAirportId: string;

  @ApiProperty({ example: 'uuid-of-dest-airport' })
  @IsString()
  @IsNotEmpty()
  destinationAirportId: string;

  @ApiProperty({ example: '2026-11-01T08:00:00Z' })
  @IsDateString()
  departureTime: string;

  @ApiProperty({ example: '2026-11-01T10:15:00Z' })
  @IsDateString()
  arrivalTime: string;

  @ApiProperty({ example: 135 })
  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @ApiProperty({
    example: [
      { cabinClass: 'ECONOMY', basePrice: 1500000, availableSeats: 150 },
      { cabinClass: 'BUSINESS', basePrice: 4200000, availableSeats: 20 },
    ],
  })
  fares: Array<{
    cabinClass: string;
    basePrice: number;
    availableSeats: number;
    baggageAllowanceKg?: number;
    cabinBaggageKg?: number;
    refundFee?: number;
    changeFee?: number;
  }>;
}

export class UpdateFlightDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  departureTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  disableReason?: string;
}

export class CompareFlightsDto {
  @ApiProperty({ example: ['flight-id-1', 'flight-id-2'], description: 'Up to 3 flight IDs' })
  @IsArray()
  flightIds: string[];
}
