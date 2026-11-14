import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../tenancy/current-tenant.decorator';
import { RequirePermissions } from '../tenancy/permissions.decorator';
import { PermissionsGuard } from '../tenancy/permissions.guard';
import { TenantContextGuard } from '../tenancy/tenant-context.guard';
import type { TenantContext } from '../tenancy/tenancy.types';
import { InventoryService } from './inventory.service';
import { CreateProductDto, RecordMovementDto, UpdateProductDto } from './dto/create-product.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('products')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('inventory.read')
  list(@Query('q') q: string | undefined, @CurrentTenant() tenant: TenantContext) {
    return this.inventory.list(tenant.id, q);
  }

  @Post('products')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('inventory.write')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  create(
    @Body() dto: CreateProductDto,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventory.create(tenant.id, user.id, dto);
  }

  @Get('products/:id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('inventory.read')
  get(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.inventory.get(tenant.id, id);
  }

  @Patch('products/:id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('inventory.write')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventory.update(tenant.id, user.id, id, dto);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('inventory.write')
  async remove(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.inventory.remove(tenant.id, user.id, id);
    return { deleted: true };
  }

  @Post('products/:id/movements')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('inventory.write')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  movement(
    @Param('id') id: string,
    @Body() dto: RecordMovementDto,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventory.recordMovement(tenant.id, user.id, id, dto);
  }
}
