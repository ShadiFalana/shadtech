import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../tenancy/current-tenant.decorator';
import { RequirePermissions } from '../tenancy/permissions.decorator';
import { PermissionsGuard } from '../tenancy/permissions.guard';
import { TenantContextGuard } from '../tenancy/tenant-context.guard';
import type { TenantContext } from '../tenancy/tenancy.types';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('services.read')
  list(
    @Query('q') q: string | undefined,
    @Query('category') category: string | undefined,
    @Query('active') active: string | undefined,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.services.list(tenant.id, { q, category, active: active === undefined ? undefined : active === 'true' });
  }

  @Post()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('services.write')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  create(@Body() dto: CreateServiceDto, @CurrentTenant() tenant: TenantContext, @CurrentUser() user: AuthenticatedUser) {
    return this.services.create(tenant.id, user.id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('services.read')
  get(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.services.get(tenant.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('services.write')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto, @CurrentTenant() tenant: TenantContext, @CurrentUser() user: AuthenticatedUser) {
    return this.services.update(tenant.id, user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('services.write')
  async remove(@Param('id') id: string, @CurrentTenant() tenant: TenantContext, @CurrentUser() user: AuthenticatedUser) {
    await this.services.remove(tenant.id, user.id, id);
    return { deleted: true };
  }
}
