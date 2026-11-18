"use server";

import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { notifyTicketUpdate, revalidateTicketNotificationPaths } from "@/lib/notifications";
import { translateKey } from "@/lib/dictionaries";
import { getServerDictionary } from "@/lib/server-i18n";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  ticketId: z.string(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedToId: z.string().optional(),
});

export async function updateTicket(formData: FormData) {
  const session = await requirePermission("tickets.manage", "admin");
  const parsed = schema.safeParse({
    ticketId: formData.get("ticketId"),
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const existing = await prisma.supportTicket.findUnique({
    where: { id: parsed.data.ticketId },
    select: {
      id: true,
      customerId: true,
      subject: true,
      status: true,
      priority: true,
      assignedToId: true,
    },
  });
  if (!existing) return { ok: false, error: "Not found" };

  const data: Record<string, unknown> = {};
  const changes: string[] = [];
  const t = await getServerDictionary();
  let title = t.support.changeStatus;
  let nextAssigneeId: string | null | undefined;

  if (parsed.data.status && parsed.data.status !== existing.status) {
    data.status = parsed.data.status;
    if (parsed.data.status === "RESOLVED") data.resolvedAt = new Date();
    if (parsed.data.status === "CLOSED") data.closedAt = new Date();
    changes.push(
      `${t.forms.status}: ${translateKey(t, `statuses.${parsed.data.status}`) ?? parsed.data.status}`,
    );
  }
  if (parsed.data.priority && parsed.data.priority !== existing.priority) {
    data.priority = parsed.data.priority;
    if (changes.length === 0) title = t.support.changePriority;
    changes.push(
      `${t.forms.priority}: ${translateKey(t, `priorities.${parsed.data.priority}`) ?? parsed.data.priority}`,
    );
  }
  if (parsed.data.assignedToId !== undefined) {
    nextAssigneeId = parsed.data.assignedToId === "none" ? null : parsed.data.assignedToId;
    if (nextAssigneeId !== existing.assignedToId) {
      data.assignedToId = nextAssigneeId;
      if (changes.length === 0) title = t.support.assignTo;
      changes.push(`${t.support.assignTo}: ${nextAssigneeId ?? "—"}`);
    }
  }

  if (Object.keys(data).length === 0) return { ok: true as const };

  await prisma.supportTicket.update({ where: { id: existing.id }, data: data as never });
  await prisma.ticketActivityLog.create({
    data: { ticketId: existing.id, actorId: session.user.id, action: "UPDATED", details: JSON.stringify(data) },
  });
  await writeAudit({
    actorId: session.user.id,
    action: "ticket.update",
    entity: "supportTicket",
    entityId: existing.id,
    details: changes.join("; "),
  });

  // Only after the update is committed do we create notifications; the actor is excluded.
  await notifyTicketUpdate({
    ticketId: existing.id,
    customerId: existing.customerId,
    actorId: session.user.id,
    title,
    body: `${existing.subject} — ${changes.join("; ")}`,
    assigneeId: nextAssigneeId,
  });

  revalidatePath(`/admin/tickets/${existing.id}`);
  revalidatePath(`/support/tickets/${existing.id}`);
  revalidatePath(`/dashboard/tickets/${existing.id}`);
  revalidatePath("/admin/tickets");
  revalidatePath("/support/tickets");
  revalidateTicketNotificationPaths();
  return { ok: true as const };
}
