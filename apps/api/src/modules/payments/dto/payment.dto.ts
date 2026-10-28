import { IsNotEmpty, IsString, IsNumber, IsIn, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CardDetailsDto {
  @ApiProperty({ example: '4242 4242 4242 4242' })
  @IsString()
  cardNumber: string;

  @ApiProperty({ example: 'NGUYEN VAN AN' })
  @IsString()
  cardHolder: string;

  @ApiProperty({ example: '12/28' })
  @IsString()
  expiryDate: string;

  @ApiProperty({ example: '123' })
  @IsString()
  cvv: string;
}

export class CheckoutDto {
  @ApiProperty({ example: 'VSK89A' })
  @IsString()
  @IsNotEmpty()
  pnr: string;

  @ApiProperty({ example: 'CREDIT_CARD', enum: ['CREDIT_CARD', 'EWALLET', 'BANK_TRANSFER'] })
  @IsIn(['CREDIT_CARD', 'EWALLET', 'BANK_TRANSFER'])
  method: string;

  @ApiProperty({ example: 'FULL', enum: ['FULL', 'PREPAY', 'PAY_LATER'] })
  @IsIn(['FULL', 'PREPAY', 'PAY_LATER'])
  paymentType: string;

  @ApiProperty({ example: 1850000, required: false })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ type: CardDetailsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CardDetailsDto)
  cardDetails?: CardDetailsDto;

  @ApiProperty({ example: 'MOMO', required: false, enum: ['MOMO', 'ZALOPAY', 'VNPAY'] })
  @IsOptional()
  @IsString()
  ewalletProvider?: 'MOMO' | 'ZALOPAY' | 'VNPAY';

  @ApiProperty({ required: false, example: 'idemp-key-xyz' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class WebhookCallbackDto {
  @ApiProperty({ example: 'TXN-98421099' })
  @IsString()
  @IsNotEmpty()
  transactionCode: string;

  @ApiProperty({ example: 'SUCCESS', enum: ['SUCCESS', 'FAILED'] })
  @IsIn(['SUCCESS', 'FAILED'])
  status: string;

  @ApiProperty({ example: 'GW-89A12B' })
  @IsString()
  gatewayRef: string;
}
