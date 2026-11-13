import { Controller, Get, HttpStatus, Logger, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export interface DatabaseCheck {
  status: 'up' | 'down';
  latencyMs: number | null;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: DatabaseCheck;
  };
}

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth(@Res({ passthrough: true }) res: Response): Promise<HealthResponse> {
    let database: DatabaseCheck;

    try {
      const latencyMs = await this.prisma.ping();
      database = { status: 'up', latencyMs };
    } catch (error) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      database = { status: 'down', latencyMs: null };
      this.logger.warn(
        `Database health check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return {
      status: database.status === 'up' ? 'ok' : 'degraded',
      service: 'shadtech-api',
      version: process.env.npm_package_version ?? '0.1.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      checks: { database },
    };
  }
}
