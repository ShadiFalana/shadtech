import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from './current-tenant.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { SetTenantSettingDto } from './dto/set-tenant-setting.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { RequirePermissions } from './permissions.decorator';
import { PermissionsGuard } from './permissions.guard';
import { TenantContextGuard } from './tenant-context.guard';
import { TenancyService } from './tenancy.service';
import type { TenantContext, TenantMembershipSummary } from './tenancy.types';

@Controller('tenants')
export class TenancyController {
  constructor(private readonly tenancy: TenancyService) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: AuthenticatedUser): Promise<TenantMembershipSummary[]> {
    return this.tenancy.listForUser(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(
    @Body() dto: CreateTenantDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TenantMembershipSummary> {
    return this.tenancy.create(user.id, dto);
  }

  @Get('current')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  current(@CurrentTenant() tenant: TenantContext): TenantContext {
    return tenant;
  }

  @Patch('current')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('tenant.manage')
  async update(
    @Body() dto: UpdateTenantDto,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ id: string; slug: string; name: string }> {
    const updated = await this.tenancy.rename(tenant.id, dto.name, user.id);
    return { id: updated.id, slug: updated.slug, name: updated.name };
  }

  @Get('current/settings')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('tenant.settings.read')
  getSettings(@CurrentTenant() tenant: TenantContext): Promise<Record<string, unknown>> {
    return this.tenancy.getSettings(tenant.id);
  }

  @Put('current/settings/:key')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('tenant.settings.write')
  setSetting(
    @Param('key') key: string,
    @Body() dto: SetTenantSettingDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<{ key: string; value: unknown }> {
    return this.tenancy.setSetting(tenant.id, key, dto.value);
  }
}
