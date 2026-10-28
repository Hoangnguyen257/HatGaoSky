import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EmailAdapter, ConsoleAndDbEmailAdapter } from '../../common/adapters/email.adapter';
import {
  PaymentGatewayAdapter,
  MockPaymentGatewayAdapter,
} from '../../common/adapters/payment-gateway.adapter';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: EmailAdapter,
      useClass: ConsoleAndDbEmailAdapter,
    },
    {
      provide: PaymentGatewayAdapter,
      useClass: MockPaymentGatewayAdapter,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
