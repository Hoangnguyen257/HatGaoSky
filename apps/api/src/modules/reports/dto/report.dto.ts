import { IsNotEmpty, IsString, IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevenueFilterDto {
  @ApiProperty({ example: '2026-01-01', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2026-12-31', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: 'ECONOMY', required: false })
  @IsOptional()
  @IsString()
  cabinClass?: string;

  @ApiProperty({ example: 'SGN-HAN', required: false })
  @IsOptional()
  @IsString()
  route?: string;
}

export class CreateExportJobDto {
  @ApiProperty({ example: 'REVENUE', enum: ['REVENUE', 'BOOKINGS', 'FLIGHTS', 'STAFF_PERFORMANCE'] })
  @IsIn(['REVENUE', 'BOOKINGS', 'FLIGHTS', 'STAFF_PERFORMANCE'])
  reportType: string;

  @ApiProperty({ example: 'EXCEL', enum: ['EXCEL', 'PDF'] })
  @IsIn(['EXCEL', 'PDF'])
  format: string;

  @ApiProperty({ example: '2026-01-01', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2026-12-31', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
