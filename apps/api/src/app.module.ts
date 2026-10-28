import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { FlightsModule } from './modules/flights/flights.module';
import { SeatsModule } from './modules/seats/seats.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FlightsModule,
    SeatsModule,
    BookingsModule,
    PaymentsModule,
    LoyaltyModule,
    DiscountsModule,
    ReportsModule,
    AdminModule,
  ],
})
export class AppModule {}
