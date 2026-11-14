import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(
    tenantId: string,
    filters: { status?: TicketStatus; priority?: string; search?: string; assigneeId?: string },
  ) {
    const where: Prisma.TicketWhereInput = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority as any;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    const q = filters.search?.trim();
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
        _count: { select: { comments: true } },
      },
    });
  }

  async get(tenantId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId },
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, fullName: true, email: true } } },
        },
      },
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async create(
    tenantId: string,
    userId: string,
    input: {
      title: string;
      description?: string;
      status?: TicketStatus;
      priority?: any;
      type?: any;
      assigneeId?: string;
    },
  ) {
    const created = await this.prisma.ticket.create({
      data: {
        tenantId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        status: input.status ?? 'OPEN',
        priority: input.priority ?? 'MEDIUM',
        type: input.type ?? 'INCIDENT',
        assigneeId: input.assigneeId || null,
      },
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
      },
    });
    void this.audit.log({
      tenantId,
      userId,
      action: 'ticket.created',
      resource: 'ticket',
      resourceId: created.id,
      metadata: { title: created.title, priority: created.priority },
    });
    return created;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    input: {
      title?: string;
      description?: string;
      status?: TicketStatus;
      priority?: any;
      type?: any;
      assigneeId?: string | null;
    },
  ) {
    const existing = await this.prisma.ticket.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException('Ticket not found');
    }
    const data: Prisma.TicketUpdateInput = {};
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.type !== undefined) data.type = input.type;
    if (input.assigneeId !== undefined) {
      data.assignee = input.assigneeId
        ? { connect: { id: input.assigneeId } }
        : { disconnect: true };
    }
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === 'RESOLVED' && !existing.resolvedAt) data.resolvedAt = new Date();
      if (input.status === 'CLOSED' && !existing.closedAt) data.closedAt = new Date();
    }
    const updated = await this.prisma.ticket.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
      },
    });
    void this.audit.log({
      tenantId,
      userId,
      action: 'ticket.updated',
      resource: 'ticket',
      resourceId: id,
      metadata: { status: updated.status, priority: updated.priority },
    });
    return updated;
  }

  async remove(tenantId: string, userId: string, id: string): Promise<void> {
    const existing = await this.prisma.ticket.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException('Ticket not found');
    }
    await this.prisma.ticket.delete({ where: { id } });
    void this.audit.log({
      tenantId,
      userId,
      action: 'ticket.deleted',
      resource: 'ticket',
      resourceId: id,
      metadata: { title: existing.title },
    });
  }

  async listComments(tenantId: string, ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, tenantId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return this.prisma.ticketComment.findMany({
      where: { tenantId, ticketId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, fullName: true, email: true } } },
    });
  }

  async addComment(
    tenantId: string,
    userId: string,
    ticketId: string,
    input: { body: string; internal?: boolean },
  ) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, tenantId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return this.prisma.ticketComment.create({
      data: {
        tenantId,
        ticketId,
        authorId: userId,
        body: input.body.trim(),
        internal: input.internal ?? false,
      },
      include: { author: { select: { id: true, fullName: true, email: true } } },
    });
  }
}
