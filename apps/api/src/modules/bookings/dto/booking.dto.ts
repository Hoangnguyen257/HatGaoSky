import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsArray,
  IsOptional,
  ValidateNested,
  IsNumber,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PassengerDto {
  @ApiProperty({ example: 'An' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Nguyen Van' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'ADULT', enum: ['ADULT', 'CHILD', 'INFANT'] })
  @IsIn(['ADULT', 'CHILD', 'INFANT'])
  passengerType: string;

  @ApiProperty({ example: '1990-05-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: '001200012345', required: true, description: 'Số CCCD hoặc Hộ chiếu của hành khách' })
  @IsNotEmpty({ message: 'Vui lòng cung cấp số CCCD hoặc Hộ chiếu của hành khách' })
  @IsString()
  passportNumber: string;

  @ApiProperty({ example: 'VNM', default: 'VNM' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accompanyingAdultIndex?: number;
}

export class ServiceItemDto {
  @ApiProperty({ example: 'BAGGAGE', enum: ['BAGGAGE', 'MEAL', 'PET', 'PRIORITY_BOARDING', 'INSURANCE'] })
  @IsIn(['BAGGAGE', 'MEAL', 'PET', 'PRIORITY_BOARDING', 'INSURANCE'])
  serviceType: string;

  @ApiProperty({ example: 'Hành lý ký gửi 20kg' })
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 320000 })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ required: false, example: '{"weightKg": 20}' })
  @IsOptional()
  @IsString()
  detailsJson?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  passengerIndex?: number;
}

export class PetDeclarationDto {
  @ApiProperty({ example: 'DOG' })
  petType: string; // DOG, CAT

  @ApiProperty({ example: 'Poodle' })
  breed: string;

  @ApiProperty({ example: 6.5 })
  weightKg: number;

  @ApiProperty({ example: true })
  hasHealthCertificate: boolean;
}

export class CreateBookingDto {
  @ApiProperty({ example: 'flight-uuid' })
  @IsString()
  @IsNotEmpty()
  outboundFlightId: string;

  @ApiProperty({ example: 'return-flight-uuid', required: false })
  @IsOptional()
  @IsString()
  returnFlightId?: string;

  @ApiProperty({ example: 'ECONOMY', enum: ['ECONOMY', 'BUSINESS', 'FIRST'] })
  @IsIn(['ECONOMY', 'BUSINESS', 'FIRST'])
  cabinClass: string;

  @ApiProperty({ example: 'session-token-xyz' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: 'customer@vietsky.vn' })
  @IsEmail()
  contactEmail: string;

  @ApiProperty({ example: '0988889999' })
  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @ApiProperty({ example: 'Nguyen Van An' })
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty({ type: [PassengerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers: PassengerDto[];

  @ApiProperty({ example: ['12A'] })
  @IsArray()
  outboundSeats: string[];

  @ApiProperty({ example: [], required: false })
  @IsOptional()
  @IsArray()
  returnSeats?: string[];

  @ApiProperty({ type: [ServiceItemDto], required: false })
  @IsOptional()
  @IsArray()
  services?: ServiceItemDto[];

  @ApiProperty({ type: PetDeclarationDto, required: false })
  @IsOptional()
  petDeclaration?: PetDeclarationDto;

  @ApiProperty({ example: 'VIETSKY2026', required: false })
  @IsOptional()
  @IsString()
  discountCode?: string;
}

export class LookupBookingDto {
  @ApiProperty({ example: 'VSK89A' })
  @IsString()
  @IsNotEmpty()
  pnr: string;

  @ApiProperty({ example: 'customer@vietsky.vn', required: false })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '0988889999', required: false })
  @IsOptional()
  phone?: string;
}

export class CancelBookingDto {
  @ApiProperty({ example: 'Lý do cá nhân thay đổi kế hoạch' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class AddBaggageDto {
  @ApiProperty({ example: 15, description: 'Weight in kg (10, 15, 20, 25, 30)' })
  @IsNumber()
  weightKg: number;

  @ApiProperty({ example: 'passenger-uuid', required: false })
  @IsOptional()
  @IsString()
  passengerId?: string;
}

export class UpgradeCabinDto {
  @ApiProperty({ example: 'BUSINESS', enum: ['BUSINESS', 'FIRST'] })
  @IsIn(['BUSINESS', 'FIRST'])
  targetCabinClass: string;

  @ApiProperty({ example: '2A' })
  @IsString()
  @IsNotEmpty()
  newSeatNumber: string;
}
