"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { normaliseRole, staffRoles } from "@/lib/permissions";
import { getSession, requirePermission } from "@/lib/session";

const publicRequestSchema = z.object({
  requestedRole: z.enum(["ADMIN", "SUPPORT_AGENT", "CONTENT_MANAGER"]),
  note: z.string().trim().max(500).optional(),
});

const reviewSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
});

function customerError(key: string) {
  return { ok: false as const, errorKey: key };
}

export async function submitAccountRequest(formData: FormData) {
  const session = await getSession();
  if (!session) return customerError("errors.unauthorized");

  const currentRole = normaliseRole((session.user as { role?: string }).role);
  if (currentRole !== "CUSTOMER") return customerError("admin.alreadyRequested");

  const parsed = publicRequestSchema.safeParse({
    requestedRole: formData.get("requestedRole"),
    note: String(formData.get("note") ?? "").trim() || undefined,
  });
  if (!parsed.success) return customerError("forms.validationError");

  const existing = await prisma.accountRequest.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existing) return customerError("admin.alreadyRequested");

  await prisma.accountRequest.create({
    data: {
      userId: session.user.id,
      requestedRole: parsed.data.requestedRole,
      note: parsed.data.note,
    },
  });

  revalidatePath("/admin/account-requests");
  return { ok: true as const };
}

export async function reviewAccountRequest(formData: FormData) {
  const session = await requirePermission("users.manage", "admin");
  const actorRole = normaliseRole((session.user as { role?: string }).role);

  const parsed = reviewSchema.safeParse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return customerError("forms.validationError");

  const request = await prisma.accountRequest.findUnique({
    where: { id: parsed.data.requestId },
    include: { user: { select: { id: true, email: true, role: true } } },
  });
  if (!request) return customerError("errors.notFound");
  if (request.status !== "PENDING") return customerError("admin.requestNotPending");
  // The public request form cannot ask for SUPER_ADMIN, so that old enum check was dead.
  // Every requestable role is privileged staff; only a Super Admin may grant one.
  if (
    parsed.data.decision === "APPROVED" &&
    staffRoles.includes(request.requestedRole) &&
    actorRole !== "SUPER_ADMIN"
  ) {
    return customerError("admin.cannotGrantSuperAdmin");
  }

  const reviewedAt = new Date();
  if (parsed.data.decision === "APPROVED") {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: request.userId },
        data: { role: request.requestedRole },
      }),
      prisma.accountRequest.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          reviewedById: session.user.id,
          reviewedAt,
        },
      }),
      ...(staffRoles.includes(request.requestedRole)
        ? [
            prisma.employeeProfile.upsert({
              where: { userId: request.userId },
              update: {},
              create: { userId: request.userId },
            }),
          ]
        : []),
      prisma.session.deleteMany({ where: { userId: request.userId } }),
      writeAudit({
        actorId: session.user.id,
        action: "account_request.approve",
        entity: "accountRequest",
        entityId: request.id,
        details: `${request.user.email} -> ${request.requestedRole}`,
      }),
    ]);
  } else {
    await prisma.accountRequest.update({
      where: { id: request.id },
      data: {
        status: "REJECTED",
        reviewedById: session.user.id,
        reviewedAt,
      },
    });
    await writeAudit({
      actorId: session.user.id,
      action: "account_request.reject",
      entity: "accountRequest",
      entityId: request.id,
      details: request.user.email,
    });
  }

  revalidatePath("/admin/account-requests");
  revalidatePath("/admin/users");
  revalidatePath("/super-admin/users");
  revalidatePath("/dashboard");
  return {
    ok: true as const,
    errorKey: parsed.data.decision === "APPROVED" ? "admin.requestApproved" : "admin.requestRejected",
  };
}
