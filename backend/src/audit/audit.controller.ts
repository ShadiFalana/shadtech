import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentTenant } from '../tenancy/current-tenant.decorator';
import { RequirePermissions } from '../tenancy/permissions.decorator';
import { PermissionsGuard } from '../tenancy/permissions.guard';
import { TenantContextGuard } from '../tenancy/tenant-context.guard';
import type { TenantContext } from '../tenancy/tenancy.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('audit.read')
  list(
    @CurrentTenant() tenant: TenantContext,
    @Query('resource') resource?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.audit.list(tenant.id, {
      resource,
      action,
      userId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }
}
