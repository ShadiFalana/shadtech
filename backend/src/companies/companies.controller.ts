import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenant } from '../tenancy/current-tenant.decorator';
import { RequirePermissions } from '../tenancy/permissions.decorator';
import { PermissionsGuard } from '../tenancy/permissions.guard';
import { TenantContextGuard } from '../tenancy/tenant-context.guard';
import type { TenantContext } from '../tenancy/tenancy.types';
import { CompaniesService } from './companies.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/create-branch.dto';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/create-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('companies.read')
  list(@CurrentTenant() tenant: TenantContext) {
    return this.companies.listCompanies(tenant.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('companies.write')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  create(
    @Body() dto: CreateCompanyDto,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companies.createCompany(tenant.id, user.id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('companies.read')
  get(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.companies.getCompany(tenant.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('companies.write')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.companies.updateCompany(tenant.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('companies.write')
  async remove(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.companies.deleteCompany(tenant.id, user.id, id);
    return { deleted: true };
  }

  // ---------- branches ----------

  @Get(':companyId/branches')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('branches.read')
  listBranches(@Param('companyId') companyId: string, @CurrentTenant() tenant: TenantContext) {
    return this.companies.listBranches(tenant.id, companyId);
  }

  @Post(':companyId/branches')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('branches.write')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  createBranch(
    @Param('companyId') companyId: string,
    @Body() dto: CreateBranchDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.companies.createBranch(tenant.id, companyId, dto);
  }

  @Patch('branches/:id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('branches.write')
  updateBranch(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.companies.updateBranch(tenant.id, id, dto);
  }

  @Delete('branches/:id')
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @RequirePermissions('branches.write')
  async removeBranch(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    await this.companies.deleteBranch(tenant.id, id);
    return { deleted: true };
  }
}
