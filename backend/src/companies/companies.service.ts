import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------- companies ----------

  async listCompanies(tenantId: string) {
    return this.prisma.company.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { branches: true } } },
    });
  }

  async getCompany(tenantId: string, id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, tenantId },
      include: { branches: { orderBy: { name: 'asc' } } },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async createCompany(
    tenantId: string,
    actingUserId: string,
    input: { name: string; code?: string },
  ) {
    try {
      const created = await this.prisma.company.create({
        data: {
          tenantId,
          name: input.name.trim(),
          code: input.code?.trim() || null,
        },
      });
      void this.audit.log({
        tenantId,
        userId: actingUserId,
        action: 'company.created',
        resource: 'company',
        resourceId: created.id,
        metadata: { name: created.name },
      });
      return created;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A company with this name already exists');
      }
      throw error;
    }
  }

  async updateCompany(
    tenantId: string,
    id: string,
    input: { name?: string; code?: string; isActive?: boolean },
  ) {
    const existing = await this.prisma.company.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException('Company not found');
    }

    const data: Prisma.CompanyUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.code !== undefined) data.code = input.code.trim() || null;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    try {
      return await this.prisma.company.update({ where: { id }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A company with this name already exists');
      }
      throw error;
    }
  }

  async deleteCompany(tenantId: string, actingUserId: string, id: string): Promise<void> {
    const existing = await this.prisma.company.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException('Company not found');
    }
    await this.prisma.company.delete({ where: { id } });
    void this.audit.log({
      tenantId,
      userId: actingUserId,
      action: 'company.deleted',
      resource: 'company',
      resourceId: id,
      metadata: { name: existing.name },
    });
  }

  // ---------- branches ----------

  async listBranches(tenantId: string, companyId: string) {
    const company = await this.prisma.company.findFirst({ where: { id: companyId, tenantId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return this.prisma.branch.findMany({
      where: { tenantId, companyId },
      orderBy: { name: 'asc' },
    });
  }

  async createBranch(tenantId: string, companyId: string, input: { name: string; code?: string }) {
    const company = await this.prisma.company.findFirst({ where: { id: companyId, tenantId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    try {
      return await this.prisma.branch.create({
        data: {
          tenantId,
          companyId,
          name: input.name.trim(),
          code: input.code?.trim() || null,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A branch with this name already exists in this company');
      }
      throw error;
    }
  }

  async updateBranch(
    tenantId: string,
    id: string,
    input: { name?: string; code?: string; isActive?: boolean },
  ) {
    const existing = await this.prisma.branch.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException('Branch not found');
    }
    const data: Prisma.BranchUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.code !== undefined) data.code = input.code.trim() || null;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    try {
      return await this.prisma.branch.update({ where: { id }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A branch with this name already exists in this company');
      }
      throw error;
    }
  }

  async deleteBranch(tenantId: string, id: string): Promise<void> {
    const existing = await this.prisma.branch.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException('Branch not found');
    }
    await this.prisma.branch.delete({ where: { id } });
  }
}
