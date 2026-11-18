"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normaliseRole, staffRoles } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";

const roleValues = [
  "SUPER_ADMIN",
  "ADMIN",
  "SUPPORT_AGENT",
  "CONTENT_MANAGER",
  "CUSTOMER",
] as const;

const createSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  role: z.enum(roleValues),
  title: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(50).optional(),
});

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(roleValues),
});

function failure(errorKey: string) {
  return { ok: false as const, errorKey };
}

function grantError(actorRole: string | null | undefined, requestedRole: Role) {
  if (requestedRole === "SUPER_ADMIN" && normaliseRole(actorRole) !== "SUPER_ADMIN") {
    return "admin.cannotGrantSuperAdmin";
  }
  return null;
}

export async function createUserByAdmin(formData: FormData) {
  const session = await requirePermission("users.manage", "admin");
  const actorRole = (session.user as { role?: string }).role;

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    title: String(formData.get("title") ?? "").trim() || undefined,
    department: String(formData.get("department") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
  });
  if (!parsed.success) return failure("forms.validationError");

  const denied = grantError(actorRole, parsed.data.role);
  if (denied) return failure(denied);

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) return failure("admin.userExists");

  const id = randomUUID();
  const password = await hashPassword(parsed.data.password);
  const isStaff = staffRoles.includes(parsed.data.role);

  await prisma.user.create({
    data: {
      id,
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          password,
        },
      },
      customerProfile: { create: {} },
      ...(isStaff
        ? {
            employeeProfile: {
              create: {
                title: parsed.data.title,
                department: parsed.data.department,
                phone: parsed.data.phone,
              },
            },
          }
        : {}),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "user.create",
      entity: "user",
      entityId: id,
      details: `${parsed.data.email} -> ${parsed.data.role}`,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/team");
  revalidatePath("/super-admin/users");
  return { ok: true as const, errorKey: "admin.userCreated" };
}

export async function changeUserRole(formData: FormData) {
  const session = await requirePermission("users.manage", "admin");
  const actorRole = (session.user as { role?: string }).role;

  const parsed = roleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return failure("forms.validationError");
  if (parsed.data.userId === session.user.id) return failure("admin.cannotChangeOwnRole");

  const denied = grantError(actorRole, parsed.data.role);
  if (denied) return failure(denied);

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, email: true, role: true },
  });
  if (!target) return failure("errors.notFound");

  if (target.role === "SUPER_ADMIN" && parsed.data.role !== "SUPER_ADMIN") {
    const superAdminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superAdminCount <= 1) return failure("admin.lastSuperAdmin");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: target.id },
      data: { role: parsed.data.role },
    }),
    ...(staffRoles.includes(parsed.data.role)
      ? [
          prisma.employeeProfile.upsert({
            where: { userId: target.id },
            update: {},
            create: { userId: target.id },
          }),
        ]
      : []),
    prisma.session.deleteMany({ where: { userId: target.id } }),
    prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "user.role.change",
        entity: "user",
        entityId: target.id,
        details: `${target.role} -> ${parsed.data.role}`,
      },
    }),
  ]);

  revalidatePath("/admin/users");
  revalidatePath("/admin/team");
  revalidatePath("/super-admin/users");
  revalidatePath("/dashboard");
  return { ok: true as const, errorKey: "admin.roleUpdated" };
}
