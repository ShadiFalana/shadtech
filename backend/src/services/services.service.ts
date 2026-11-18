import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, filters: { q?: string; category?: string; active?: boolean } = {}) {
    const where: Prisma.ServiceWhereInput = { tenantId };
    if (filters.category) where.category = filters.category;
    if (filters.active !== undefined) where.isActive = filters.active;
    const q = filters.q?.trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.service.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async get(tenantId: string, id: string) {
    const service = await this.prisma.service.findFirst({ where: { id, tenantId } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(tenantId: string, userId: string, input: any) {
    const created = await this.prisma.service.create({
      data: {
        tenantId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        category: input.category?.trim() || null,
        price: input.price ?? 0,
        durationMin: input.durationMin ?? null,
        isActive: input.isActive ?? true,
      },
    });
    void this.audit.log({ tenantId, userId, action: 'service.created', resource: 'service', resourceId: created.id, metadata: { name: created.name } });
    return created;
  }

  async update(tenantId: string, userId: string, id: string, input: any) {
    const existing = await this.prisma.service.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Service not found');
    const data: Prisma.ServiceUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.category !== undefined) data.category = input.category?.trim() || null;
    if (input.price !== undefined) data.price = input.price;
    if (input.durationMin !== undefined) data.durationMin = input.durationMin;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    const updated = await this.prisma.service.update({ where: { id }, data });
    void this.audit.log({ tenantId, userId, action: 'service.updated', resource: 'service', resourceId: id, metadata: { name: updated.name } });
    return updated;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.prisma.service.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Service not found');
    await this.prisma.service.delete({ where: { id } });
    void this.audit.log({ tenantId, userId, action: 'service.deleted', resource: 'service', resourceId: id, metadata: { name: existing.name } });
  }
}
