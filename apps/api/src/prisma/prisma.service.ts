import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  async onModuleInit() {
    await this.$connect();
    try {
      // Configure SQLite for high concurrency (prevent SQLITE_BUSY / database is locked)
      await this.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
      await this.$queryRawUnsafe('PRAGMA busy_timeout = 10000;');
      this.logger.log('SQLite WAL mode and busy_timeout configured for high concurrency.');
    } catch (e) {
      // Ignore if not supported or not SQLite
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
