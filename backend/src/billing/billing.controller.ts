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
import { BillingService } from './billing.service';
import {
  AddInvoiceItemDto,
  CreateInvoiceDto,
  RecordPaymentDto,
  UpdateInvoiceDto,
} from './dto/create-invoice.dto';

@Controller('invoices')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('billing.read')
  list(@Query('status') status: string | undefined, @CurrentTenant() tenant: TenantContext) {
    return this.billing.list(tenant.id, status);
  }

  @Post()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('billing.write')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  create(
    @Body() dto: CreateInvoiceDto,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.billing.create(tenant.id, user.id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('billing.read')
  get(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.billing.get(tenant.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('billing.write')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.billing.update(tenant.id, user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('billing.write')
  async remove(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.billing.remove(tenant.id, user.id, id);
    return { deleted: true };
  }

  @Post(':id/items')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('billing.write')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  addItem(
    @Param('id') id: string,
    @Body() dto: AddInvoiceItemDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.billing.addItem(tenant.id, id, dto);
  }

  @Delete(':id/items/:itemId')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('billing.write')
  async removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentTenant() tenant: TenantContext,
  ) {
    await this.billing.removeItem(tenant.id, id, itemId);
    return { deleted: true };
  }

  @Post(':id/payments')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('billing.write')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.billing.recordPayment(tenant.id, user.id, id, dto);
  }
}
