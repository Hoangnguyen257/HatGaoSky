import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { EmailAdapter, ConsoleAndDbEmailAdapter } from '../../common/adapters/email.adapter';
import {
  PaymentGatewayAdapter,
  MockPaymentGatewayAdapter,
} from '../../common/adapters/payment-gateway.adapter';

@Module({
  controllers: [BookingsController],
  providers: [
    BookingsService,
    {
      provide: EmailAdapter,
      useClass: ConsoleAndDbEmailAdapter,
    },
    {
      provide: PaymentGatewayAdapter,
      useClass: MockPaymentGatewayAdapter,
    },
  ],
  exports: [BookingsService],
})
export class BookingsModule {}
