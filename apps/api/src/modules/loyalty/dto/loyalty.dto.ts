import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BuyMilesDto {
  @ApiProperty({ example: 2000, description: 'Number of miles to buy' })
  @IsNumber()
  @Min(500)
  milesAmount: number;

  @ApiProperty({ example: 'CREDIT_CARD', enum: ['CREDIT_CARD', 'EWALLET', 'BANK_TRANSFER'] })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;
}
