import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PermissionsGuard } from './permissions.guard';
import { TenantContextGuard } from './tenant-context.guard';
import { TenancyController } from './tenancy.controller';
import { TenancyService } from './tenancy.service';

@Module({
  imports: [AuthModule],
  controllers: [TenancyController],
  providers: [TenancyService, TenantContextGuard, PermissionsGuard],
  exports: [TenancyService, TenantContextGuard, PermissionsGuard],
})
export class TenancyModule {}
