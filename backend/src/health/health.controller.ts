import { Controller, Get } from '@nestjs/common';

export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
}

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'shadtech-api',
      version: process.env.npm_package_version ?? '0.1.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}
