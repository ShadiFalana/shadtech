import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { TenantContext } from './tenancy.types';

/** Injects the tenant resolved by `TenantContextGuard`. */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TenantContext => {
    const request = context.switchToHttp().getRequest<Request & { tenant?: TenantContext }>();
    return request.tenant as TenantContext;
  },
);
