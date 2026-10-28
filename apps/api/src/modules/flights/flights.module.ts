import { Module } from '@nestjs/common';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';
import { EmailAdapter, ConsoleAndDbEmailAdapter } from '../../common/adapters/email.adapter';
import { CacheAdapter, InMemoryCacheAdapter } from '../../common/adapters/cache.adapter';

@Module({
  controllers: [FlightsController],
  providers: [
    FlightsService,
    {
      provide: EmailAdapter,
      useClass: ConsoleAndDbEmailAdapter,
    },
    {
      provide: CacheAdapter,
      useClass: InMemoryCacheAdapter,
    },
  ],
  exports: [FlightsService],
})
export class FlightsModule {}
