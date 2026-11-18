import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, filters: { status?: string; q?: string } = {}) {
    const where: Prisma.OrderWhereInput = { tenantId };
    if (filters.status) where.status = filters.status as any;
    const q = filters.q?.trim();
    if (q) {
      where.OR = [
        { number: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true } }, items: true, _count: { select: { items: true } } },
    });
  }

  async get(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: { customer: { select: { id: true, name: true, email: true } }, items: { include: { product: { select: { id: true, name: true } } } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(tenantId: string, userId: string, input: any) {
    const count = await this.prisma.order.count({ where: { tenantId } });
    const number = `ORD-${String(count + 1).padStart(4, '0')}`;
    const subtotal = (input.items || []).reduce((sum: number, it: any) => sum + Number(it.quantity) * Number(it.unitPrice), 0);
    const tax = input.tax ?? 0;
    const total = subtotal + Number(tax);
    const created = await this.prisma.order.create({
      data: {
        tenantId,
        customerId: input.customerId || null,
        number,
        status: input.status ?? 'PENDING',
        subtotal,
        tax,
        total,
        notes: input.notes?.trim() || null,
        items: {
          create: (input.items || []).map((it: any) => ({
            tenantId,
            productId: it.productId || null,
            description: it.description.trim(),
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: Number(it.quantity) * Number(it.unitPrice),
          })),
        },
      },
      include: { customer: { select: { id: true, name: true } }, items: true },
    });
    void this.audit.log({ tenantId, userId, action: 'order.created', resource: 'order', resourceId: created.id, metadata: { number: created.number, total: created.total } });
    return created;
  }

  async update(tenantId: string, userId: string, id: string, input: any) {
    const existing = await this.prisma.order.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Order not found');
    const data: Prisma.OrderUpdateInput = {};
    if (input.customerId !== undefined) {
      data.customer = input.customerId ? { connect: { id: input.customerId } } : { disconnect: true };
    }
    if (input.status !== undefined) data.status = input.status;
    if (input.tax !== undefined) {
      data.tax = input.tax;
      data.total = Number(existing.subtotal) + Number(input.tax);
    }
    if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
    const updated = await this.prisma.order.update({ where: { id }, data, include: { customer: { select: { id: true, name: true } }, items: true } });
    void this.audit.log({ tenantId, userId, action: 'order.updated', resource: 'order', resourceId: id, metadata: { status: updated.status } });
    return updated;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.prisma.order.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Order not found');
    await this.prisma.order.delete({ where: { id } });
    void this.audit.log({ tenantId, userId, action: 'order.deleted', resource: 'order', resourceId: id, metadata: { number: existing.number } });
  }
}
