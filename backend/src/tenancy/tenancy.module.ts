import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PermissionsGuard } from './permissions.guard';
import { TenantContextGuard } from './tenant-context.guard';
import { TenancyController } from './tenancy.controller';
import { TenancyService } from './tenancy.service';
import { AuditController } from '../audit/audit.controller';
import { AuditService } from '../audit/audit.service';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { RolesController } from './roles.controller';

@Module({
  imports: [AuthModule],
  controllers: [TenancyController, MembersController, RolesController, AuditController],
  providers: [TenancyService, MembersService, AuditService, TenantContextGuard, PermissionsGuard],
  exports: [TenancyService, MembersService, AuditService, TenantContextGuard, PermissionsGuard],
})
export class TenancyModule {}
