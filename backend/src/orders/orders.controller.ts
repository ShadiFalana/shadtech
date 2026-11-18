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
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('orders.read')
  list(@Query('status') status: string | undefined, @Query('q') q: string | undefined, @CurrentTenant() tenant: TenantContext) {
    return this.orders.list(tenant.id, { status, q });
  }

  @Post()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('orders.write')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  create(@Body() dto: CreateOrderDto, @CurrentTenant() tenant: TenantContext, @CurrentUser() user: AuthenticatedUser) {
    return this.orders.create(tenant.id, user.id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('orders.read')
  get(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.orders.get(tenant.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('orders.write')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto, @CurrentTenant() tenant: TenantContext, @CurrentUser() user: AuthenticatedUser) {
    return this.orders.update(tenant.id, user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('orders.write')
  async remove(@Param('id') id: string, @CurrentTenant() tenant: TenantContext, @CurrentUser() user: AuthenticatedUser) {
    await this.orders.remove(tenant.id, user.id, id);
    return { deleted: true };
  }
}
