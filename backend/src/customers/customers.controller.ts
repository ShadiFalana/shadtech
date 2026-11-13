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
import { CurrentTenant } from '../tenancy/current-tenant.decorator';
import { RequirePermissions } from '../tenancy/permissions.decorator';
import { PermissionsGuard } from '../tenancy/permissions.guard';
import { TenantContextGuard } from '../tenancy/tenant-context.guard';
import type { TenantContext } from '../tenancy/tenancy.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/create-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('customers.read')
  list(@Query('q') q: string | undefined, @CurrentTenant() tenant: TenantContext) {
    return this.customers.list(tenant.id, q);
  }

  @Post()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('customers.write')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  create(
    @Body() dto: CreateCustomerDto,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.customers.create(tenant.id, user.id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('customers.read')
  get(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.customers.get(tenant.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('customers.write')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.customers.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('customers.write')
  async remove(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.customers.remove(tenant.id, user.id, id);
    return { deleted: true };
  }
}
