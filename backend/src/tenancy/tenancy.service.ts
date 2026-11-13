import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Prisma, type Membership, type Role, type Tenant } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_ROLE_KEY } from './permissions';
import { DEFAULT_TENANT_SETTINGS } from './tenant-defaults';
import { AuditService } from '../audit/audit.service';
import type { TenantMembershipSummary } from './tenancy.types';

type MembershipWithRelations = Membership & {
  tenant: Tenant;
  role: Role & { permissions: Array<{ permissionKey: string }> };
};

const SETTING_KEY_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;

@Injectable()
export class TenancyService {
  private readonly logger = new Logger(TenancyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listForUser(userId: string): Promise<TenantMembershipSummary[]> {
    const memberships = await this.prisma.membership.findMany({
      where: {
        userId,
        isActive: true,
        tenant: { isActive: true },
      },
      include: {
        tenant: true,
        role: { include: { permissions: { select: { permissionKey: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((membership) => this.toSummary(membership));
  }

  async create(
    userId: string,
    input: { name: string; slug?: string },
  ): Promise<TenantMembershipSummary> {
    const [user, ownerRole] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } }),
      this.prisma.role.findUnique({ where: { key: DEFAULT_ROLE_KEY } }),
    ]);

    if (!user || !user.isActive) {
      throw new ForbiddenException('Account is not available');
    }
    if (!ownerRole) {
      throw new Error('Roles are not seeded; run `npm run db:seed` first');
    }

    const name = input.name.trim();
    const slug = input.slug ?? `t-${randomBytes(4).toString('hex')}`;

    let tenant: Tenant;
    try {
      tenant = await this.prisma.$transaction(async (tx) => {
        const created = await tx.tenant.create({ data: { name, slug } });

        await tx.membership.create({
          data: { userId, tenantId: created.id, roleId: ownerRole.id },
        });

        await tx.tenantSetting.createMany({
          data: DEFAULT_TENANT_SETTINGS.map((setting) => ({
            tenantId: created.id,
            key: setting.key,
            value: setting.value,
          })),
        });

        return created;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Tenant slug is already in use');
      }
      throw error;
    }

    this.logger.log(`Tenant created: ${tenant.slug} by user ${userId}`);

    const membership = await this.getMembership(userId, tenant.id);
    if (!membership) {
      throw new Error('Membership was not created for the new tenant');
    }
    return this.toSummary(membership);
  }

  async rename(tenantId: string, name: string, actingUserId?: string): Promise<Tenant> {
    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { name: name.trim() },
    });

    if (actingUserId) {
      void this.audit.log({
        tenantId,
        userId: actingUserId,
        action: 'tenant.updated',
        resource: 'tenant',
        resourceId: tenantId,
        metadata: { name },
      });
    }

    return updated;
  }

  async getSettings(tenantId: string): Promise<Record<string, unknown>> {
    const rows = await this.prisma.tenantSetting.findMany({
      where: { tenantId },
      orderBy: { key: 'asc' },
    });

    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }

  async setSetting(
    tenantId: string,
    key: string,
    value: unknown,
  ): Promise<{ key: string; value: unknown }> {
    if (!SETTING_KEY_PATTERN.test(key)) {
      throw new BadRequestException(
        'Invalid setting key: use lowercase letters, numbers, dots, dashes or underscores',
      );
    }

    const row = await this.prisma.tenantSetting.upsert({
      where: { tenantId_key: { tenantId, key } },
      create: { tenantId, key, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });

    return { key: row.key, value: row.value };
  }

  private getMembership(userId: string, tenantId: string): Promise<MembershipWithRelations | null> {
    return this.prisma.membership.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
      include: {
        tenant: true,
        role: { include: { permissions: { select: { permissionKey: true } } } },
      },
    });
  }

  private toSummary(membership: MembershipWithRelations): TenantMembershipSummary {
    return {
      id: membership.tenant.id,
      slug: membership.tenant.slug,
      name: membership.tenant.name,
      isActive: membership.tenant.isActive,
      role: {
        key: membership.role.key,
        name: membership.role.name,
      },
      permissions: membership.role.permissions.map((entry) => entry.permissionKey),
    };
  }
}
