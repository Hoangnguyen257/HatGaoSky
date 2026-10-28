import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDateString,
  IsIn,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateDiscountDto {
  @ApiProperty({ example: 'VIETSKY2026' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 2500000 })
  @IsNumber()
  bookingAmount: number;

  @ApiProperty({ example: 'SGN-HAN', required: false })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiProperty({ example: 'ECONOMY', required: false })
  @IsOptional()
  @IsString()
  cabinClass?: string;

  @ApiProperty({ example: 'GOLD', required: false })
  @IsOptional()
  @IsString()
  memberTier?: string;
}

export class CreateDiscountDto {
  @ApiProperty({ example: 'AUTUMN2026' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Giảm giá 15% mùa thu' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'PERCENTAGE', enum: ['PERCENTAGE', 'FIXED'] })
  @IsIn(['PERCENTAGE', 'FIXED'])
  discountType: string;

  @ApiProperty({ example: 15 })
  @IsNumber()
  @Min(1)
  value: number;

  @ApiProperty({ example: 1000000, default: 0 })
  @IsOptional()
  @IsNumber()
  minBookingAmount?: number;

  @ApiProperty({ example: 300000, required: false })
  @IsOptional()
  @IsNumber()
  maxDiscountAmount?: number;

  @ApiProperty({ example: '2026-09-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-11-30T23:59:59Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  routeCondition?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cabinCondition?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tierCondition?: string;

  @ApiProperty({ example: 100, default: 100 })
  @IsOptional()
  @IsNumber()
  usageLimit?: number;
}
