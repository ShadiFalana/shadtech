import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from './current-tenant.decorator';
import { RequirePermissions } from './permissions.decorator';
import { PermissionsGuard } from './permissions.guard';
import { TenantContextGuard } from './tenant-context.guard';
import type { TenantContext } from './tenancy.types';
import { MembersService } from './members.service';
import { AddMemberDto } from './dto/add-member.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('members.read')
  list(@CurrentTenant() tenant: TenantContext) {
    return this.members.list(tenant.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('members.manage')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  add(
    @Body() dto: AddMemberDto,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.members.add(tenant.id, user.id, {
      email: dto.email,
      fullName: dto.fullName,
      password: dto.password,
      roleKey: dto.roleKey,
    });
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('members.manage')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.members.updateRole(tenant.id, user.id, id, dto.roleKey);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('members.manage')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.members.remove(tenant.id, user.id, id);
  }

  @Post(':id/reset-password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('members.manage')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.members.resetPassword(tenant.id, user.id, id, dto.newPassword);
  }
}
