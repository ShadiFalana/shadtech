import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, search?: string) {
    const where: Prisma.CustomerWhereInput = { tenantId };
    const q = search?.trim();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async get(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async create(
    tenantId: string,
    input: {
      name: string;
      email?: string;
      phone?: string;
      company?: string;
      notes?: string;
    },
  ) {
    return this.prisma.customer.create({
      data: {
        tenantId,
        name: input.name.trim(),
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        company: input.company?.trim() || null,
        notes: input.notes?.trim() || null,
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    input: {
      name?: string;
      email?: string | null;
      phone?: string | null;
      company?: string | null;
      notes?: string | null;
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException('Customer not found');
    }
    const data: Prisma.CustomerUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.email !== undefined) data.email = input.email?.trim() || null;
    if (input.phone !== undefined) data.phone = input.phone?.trim() || null;
    if (input.company !== undefined) data.company = input.company?.trim() || null;
    if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    return this.prisma.customer.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const existing = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException('Customer not found');
    }
    await this.prisma.customer.delete({ where: { id } });
  }
}
