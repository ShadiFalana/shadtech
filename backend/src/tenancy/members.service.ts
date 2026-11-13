import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hashPassword } from '../auth/password.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    return this.prisma.membership.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        role: { select: { id: true, key: true, name: true } },
      },
    });
  }

  async add(
    tenantId: string,
    actingUserId: string,
    input: { email: string; fullName: string; password: string; roleKey: string },
  ) {
    const role = await this.prisma.role.findUnique({ where: { key: input.roleKey } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const email = input.email.trim().toLowerCase();
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          fullName: input.fullName.trim(),
          passwordHash: await hashPassword(input.password),
        },
      });
    } else {
      // Reactivate if needed; keep password unchanged unless provided? We set only if provided.
      // (password is required for new users; for existing we ignore it)
    }

    const existing = await this.prisma.membership.findUnique({
      where: { userId_tenantId: { userId: user.id, tenantId } },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this tenant');
    }

    return this.prisma.membership.create({
      data: { userId: user.id, tenantId, roleId: role.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        role: { select: { id: true, key: true, name: true } },
      },
    });
  }

  async updateRole(tenantId: string, actingUserId: string, membershipId: string, roleKey: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, tenantId },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    const role = await this.prisma.role.findUnique({ where: { key: roleKey } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Prevent removing the last owner or changing your own role.
    if (membership.userId === actingUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { roleId: role.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        role: { select: { id: true, key: true, name: true } },
      },
    });
  }

  async remove(tenantId: string, actingUserId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, tenantId },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
    if (membership.userId === actingUserId) {
      throw new ForbiddenException('You cannot remove yourself from the tenant');
    }

    // Prevent removing the last active owner.
    if (membership.roleId) {
      const role = await this.prisma.role.findUnique({ where: { id: membership.roleId } });
      if (role?.key === 'owner') {
        const otherOwners = await this.prisma.membership.count({
          where: {
            tenantId,
            roleId: membership.roleId,
            id: { not: membershipId },
            isActive: true,
          },
        });
        if (otherOwners === 0) {
          throw new ForbiddenException('Cannot remove the last owner of the tenant');
        }
      }
    }

    await this.prisma.membership.delete({ where: { id: membershipId } });
    return { deleted: true };
  }

  async resetPassword(
    tenantId: string,
    actingUserId: string,
    membershipId: string,
    newPassword: string,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, tenantId },
      include: { user: true },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    await this.prisma.user.update({
      where: { id: membership.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    return { reset: true };
  }
}
