import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditInput {
  tenantId: string;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId ?? null,
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId ?? null,
          metadata: input.metadata === undefined ? undefined : (input.metadata as any),
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
    } catch {
      // Auditing must never break the primary operation.
    }
  }

  async list(
    tenantId: string,
    filters: {
      resource?: string;
      action?: string;
      userId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { tenantId };
    if (filters.resource) where.resource = filters.resource;
    if (filters.action) where.action = filters.action;
    if (filters.userId) where.userId = filters.userId;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(filters.limit ?? 50, 200),
      skip: filters.offset ?? 0,
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });
  }
}
