import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CheckoutDto, WebhookCallbackDto } from './dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Process booking checkout: Full payment, Prepayment (min 30%), or Pay Later hold' })
  checkout(@Body() dto: CheckoutDto) {
    return this.paymentsService.checkout(dto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Idempotent mock payment gateway webhook callback' })
  handleWebhook(@Body() dto: WebhookCallbackDto) {
    return this.paymentsService.handleWebhook(dto);
  }
}
