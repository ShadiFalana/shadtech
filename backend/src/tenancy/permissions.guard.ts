import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSIONS_METADATA } from './permissions.decorator';
import { WILDCARD_PERMISSION } from './permissions';
import type { TenantContext } from './tenancy.types';

type RequestWithContext = Request & { tenant?: TenantContext };

/**
 * Enforces `@RequirePermissions(...)` using the permissions resolved by
 * `TenantContextGuard`. Must run after the tenant guard.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const granted = new Set(request.tenant?.permissions ?? []);

    if (granted.has(WILDCARD_PERMISSION)) {
      return true;
    }

    const missing = required.filter((permission) => !granted.has(permission));
    if (missing.length > 0) {
      throw new ForbiddenException(`Missing permission: ${missing.join(', ')}`);
    }

    return true;
  }
}
