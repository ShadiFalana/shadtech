import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentTenant } from './current-tenant.decorator';
import { RequirePermissions } from './permissions.decorator';
import { PermissionsGuard } from './permissions.guard';
import { TenantContextGuard } from './tenant-context.guard';
import type { TenantContext } from './tenancy.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('members.read')
  async list(@CurrentTenant() _tenant: TenantContext) {
    const roles = await this.prisma.role.findMany({
      orderBy: { key: 'asc' },
      select: { id: true, key: true, name: true, description: true },
    });
    return roles;
  }
}
