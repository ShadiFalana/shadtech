import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import type { TenantContext } from './tenancy.types';

export const TENANT_HEADER = 'x-tenant-id';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RequestWithContext = Request & {
  user?: AuthenticatedUser;
  tenant?: TenantContext;
};

/**
 * Resolves the active tenant from the `X-Tenant-Id` header and verifies that
 * the authenticated user is an active member of it. The tenant id is never
 * accepted from a request body — it always comes from this validated context.
 */
@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();

    if (!request.user) {
      throw new ForbiddenException('Authentication is required before tenant access');
    }

    const rawHeader = request.headers[TENANT_HEADER];
    const tenantId = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!tenantId) {
      throw new BadRequestException(`Missing ${TENANT_HEADER} header`);
    }
    if (!UUID_PATTERN.test(tenantId)) {
      throw new BadRequestException(`Invalid ${TENANT_HEADER} header`);
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: request.user.id,
          tenantId,
        },
      },
      include: {
        tenant: true,
        user: { select: { isActive: true } },
        role: {
          include: {
            permissions: { select: { permissionKey: true } },
          },
        },
      },
    });

    if (
      !membership ||
      !membership.isActive ||
      !membership.tenant.isActive ||
      !membership.user.isActive
    ) {
      // Deliberately identical for "unknown tenant" and "not a member".
      throw new ForbiddenException('You do not have access to this tenant');
    }

    request.tenant = {
      id: membership.tenant.id,
      slug: membership.tenant.slug,
      name: membership.tenant.name,
      role: {
        key: membership.role.key,
        name: membership.role.name,
      },
      permissions: membership.role.permissions.map((entry) => entry.permissionKey),
    };

    return true;
  }
}
