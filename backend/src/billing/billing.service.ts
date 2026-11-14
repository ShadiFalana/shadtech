import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, status?: string) {
    const where: Prisma.InvoiceWhereInput = { tenantId };
    if (status) where.status = status as any;
    return this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
        _count: { select: { items: true, payments: true } },
      },
    });
  }

  async get(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: true,
        payments: { orderBy: { paidAt: 'desc' } },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(
    tenantId: string,
    userId: string,
    input: {
      customerId?: string;
      number: string;
      status?: string;
      dueDate?: string;
      notes?: string;
    },
  ) {
    const created = await this.prisma.invoice.create({
      data: {
        tenantId,
        customerId: input.customerId || null,
        number: input.number.trim(),
        status: (input.status as any) ?? 'DRAFT',
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        notes: input.notes?.trim() || null,
      },
    });
    void this.audit.log({
      tenantId,
      userId,
      action: 'invoice.created',
      resource: 'invoice',
      resourceId: created.id,
      metadata: { number: created.number },
    });
    return created;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    input: {
      customerId?: string | null;
      status?: string;
      dueDate?: string | null;
      notes?: string | null;
    },
  ) {
    const existing = await this.prisma.invoice.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Invoice not found');
    const data: Prisma.InvoiceUpdateInput = {};
    if (input.customerId !== undefined)
      data.customer = input.customerId
        ? { connect: { id: input.customerId } }
        : { disconnect: true };
    if (input.status !== undefined) data.status = input.status as any;
    if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
    const updated = await this.prisma.invoice.update({
      where: { id },
      data,
      include: { customer: { select: { id: true, name: true } } },
    });
    void this.audit.log({
      tenantId,
      userId,
      action: 'invoice.updated',
      resource: 'invoice',
      resourceId: id,
      metadata: { status: updated.status },
    });
    return updated;
  }

  async remove(tenantId: string, userId: string, id: string): Promise<void> {
    const existing = await this.prisma.invoice.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Invoice not found');
    await this.prisma.invoice.delete({ where: { id } });
    void this.audit.log({
      tenantId,
      userId,
      action: 'invoice.deleted',
      resource: 'invoice',
      resourceId: id,
      metadata: { number: existing.number },
    });
  }

  async addItem(
    tenantId: string,
    invoiceId: string,
    input: { description: string; quantity?: number; unitPrice?: number },
  ) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    const quantity = input.quantity ?? 1;
    const unitPrice = input.unitPrice ?? 0;
    const total = quantity * unitPrice;
    const item = await this.prisma.invoiceItem.create({
      data: {
        tenantId,
        invoiceId,
        description: input.description.trim(),
        quantity,
        unitPrice,
        total,
      },
    });
    await this.recalc(invoiceId);
    return item;
  }

  async removeItem(tenantId: string, invoiceId: string, itemId: string): Promise<void> {
    const item = await this.prisma.invoiceItem.findFirst({
      where: { id: itemId, tenantId, invoiceId },
    });
    if (!item) throw new NotFoundException('Item not found');
    await this.prisma.invoiceItem.delete({ where: { id: itemId } });
    await this.recalc(invoiceId);
  }

  async recordPayment(
    tenantId: string,
    userId: string,
    invoiceId: string,
    input: { amount?: number; method?: string; paidAt?: string; notes?: string },
  ) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    const amount = input.amount ?? 0;
    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        invoiceId,
        amount,
        method: (input.method as any) ?? 'CASH',
        paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
        notes: input.notes?.trim() || null,
      },
    });
    // Auto-mark paid if fully paid
    const inv = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (inv) {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      if (paid >= Number(inv.total) && Number(inv.total) > 0) {
        await this.prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'PAID' } });
      }
    }
    void this.audit.log({
      tenantId,
      userId,
      action: 'payment.recorded',
      resource: 'invoice',
      resourceId: invoiceId,
      metadata: { amount },
    });
    return payment;
  }

  private async recalc(invoiceId: string): Promise<void> {
    const items = await this.prisma.invoiceItem.findMany({ where: { invoiceId } });
    const subtotal = items.reduce((s, i) => s + Number(i.total), 0);
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    const tax = invoice ? Number(invoice.tax) : 0;
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { subtotal, total: subtotal + tax },
    });
  }
}
