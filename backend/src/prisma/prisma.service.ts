import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      // Keep the API running so health checks can report a degraded state.
      this.logger.error(
        `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Round-trip latency of a trivial query, in milliseconds. */
  async ping(): Promise<number> {
    const startedAt = process.hrtime.bigint();
    await this.$queryRaw`SELECT 1`;
    const elapsedNs = process.hrtime.bigint() - startedAt;
    return Math.round(Number(elapsedNs) / 1e4) / 100;
  }
}
