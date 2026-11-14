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
import { TicketsService } from './tickets.service';
import { CreateCommentDto, CreateTicketDto, UpdateTicketDto } from './dto/create-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('tickets.read')
  list(
    @Query('status') status: string | undefined,
    @Query('priority') priority: string | undefined,
    @Query('assigneeId') assigneeId: string | undefined,
    @Query('q') q: string | undefined,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.tickets.list(tenant.id, { status: status as any, priority, assigneeId, search: q });
  }

  @Post()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('tickets.write')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  create(
    @Body() dto: CreateTicketDto,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tickets.create(tenant.id, user.id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('tickets.read')
  get(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.tickets.get(tenant.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('tickets.write')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tickets.update(tenant.id, user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('tickets.write')
  async remove(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.tickets.remove(tenant.id, user.id, id);
    return { deleted: true };
  }

  @Get(':id/comments')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('tickets.read')
  comments(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.tickets.listComments(tenant.id, id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('tickets.write')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tickets.addComment(tenant.id, user.id, id, dto);
  }
}
