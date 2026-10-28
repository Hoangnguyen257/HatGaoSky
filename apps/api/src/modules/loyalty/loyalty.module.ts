import { Module } from '@nestjs/common';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { EmailAdapter, ConsoleAndDbEmailAdapter } from '../../common/adapters/email.adapter';
import {
  PaymentGatewayAdapter,
  MockPaymentGatewayAdapter,
} from '../../common/adapters/payment-gateway.adapter';

@Module({
  controllers: [LoyaltyController],
  providers: [
    LoyaltyService,
    {
      provide: EmailAdapter,
      useClass: ConsoleAndDbEmailAdapter,
    },
    {
      provide: PaymentGatewayAdapter,
      useClass: MockPaymentGatewayAdapter,
    },
  ],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
