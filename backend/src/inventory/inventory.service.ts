import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, search?: string) {
    const where: Prisma.ProductWhereInput = { tenantId };
    const q = search?.trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.product.findMany({ where, orderBy: { name: 'asc' } });
  }

  async get(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { movements: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(
    tenantId: string,
    userId: string,
    input: {
      name: string;
      sku?: string;
      category?: string;
      unit?: string;
      price?: number;
      quantity?: number;
      minQuantity?: number;
    },
  ) {
    const created = await this.prisma.product.create({
      data: {
        tenantId,
        name: input.name.trim(),
        sku: input.sku?.trim() || null,
        category: input.category?.trim() || null,
        unit: input.unit?.trim() || null,
        price: input.price ?? 0,
        quantity: input.quantity ?? 0,
        minQuantity: input.minQuantity ?? 0,
      },
    });
    void this.audit.log({
      tenantId,
      userId,
      action: 'product.created',
      resource: 'product',
      resourceId: created.id,
      metadata: { name: created.name },
    });
    return created;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    input: {
      name?: string;
      sku?: string | null;
      category?: string | null;
      unit?: string | null;
      price?: number;
      minQuantity?: number;
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Product not found');
    const data: Prisma.ProductUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.sku !== undefined) data.sku = input.sku?.trim() || null;
    if (input.category !== undefined) data.category = input.category?.trim() || null;
    if (input.unit !== undefined) data.unit = input.unit?.trim() || null;
    if (input.price !== undefined) data.price = input.price;
    if (input.minQuantity !== undefined) data.minQuantity = input.minQuantity;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    const updated = await this.prisma.product.update({ where: { id }, data });
    void this.audit.log({
      tenantId,
      userId,
      action: 'product.updated',
      resource: 'product',
      resourceId: id,
    });
    return updated;
  }

  async remove(tenantId: string, userId: string, id: string): Promise<void> {
    const existing = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Product not found');
    await this.prisma.product.delete({ where: { id } });
    void this.audit.log({
      tenantId,
      userId,
      action: 'product.deleted',
      resource: 'product',
      resourceId: id,
      metadata: { name: existing.name },
    });
  }

  async recordMovement(
    tenantId: string,
    userId: string,
    productId: string,
    input: { type: 'IN' | 'OUT' | 'ADJUST'; quantity: number; reason?: string },
  ) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) throw new NotFoundException('Product not found');
    const movement = await this.prisma.stockMovement.create({
      data: {
        tenantId,
        productId,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason?.trim() || null,
      },
    });
    // Update product quantity
    let newQty = Number(product.quantity);
    if (input.type === 'IN') newQty += input.quantity;
    else if (input.type === 'OUT') newQty -= input.quantity;
    else newQty = input.quantity;
    await this.prisma.product.update({ where: { id: productId }, data: { quantity: newQty } });
    void this.audit.log({
      tenantId,
      userId,
      action: 'stock.movement',
      resource: 'product',
      resourceId: productId,
      metadata: { type: input.type, quantity: input.quantity },
    });
    return movement;
  }
}
