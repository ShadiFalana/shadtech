"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { notifyTicketCreated, revalidateTicketNotificationPaths } from "@/lib/notifications";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  subject: z.string().min(3),
  description: z.string().min(5),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  category: z.string().optional(),
});

export async function createTicket(formData: FormData) {
  const session = await getSession();
  if (!session) return { ok: false as const, errorKey: "errors.unauthorized" as const };
  const profile = await prisma.customerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return { ok: false as const, errorKey: "errors.noProfile" as const };

  const parsed = schema.safeParse({
    subject: formData.get("subject"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    category: formData.get("category") || undefined,
  });
  if (!parsed.success) return { ok: false as const, errorKey: "forms.validationError" as const };

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: `ST-${Date.now().toString(36).toUpperCase()}`,
      customerId: profile.id,
      subject: parsed.data.subject,
      description: parsed.data.description,
      priority: parsed.data.priority as never,
      category: parsed.data.category,
    },
  });
  await prisma.ticketActivityLog.create({
    data: { ticketId: ticket.id, actorId: session.user.id, action: "CREATED" },
  });
  // Only after the ticket row is confirmed in the database do we create notifications.
  await notifyTicketCreated({ ticketId: ticket.id, subject: ticket.subject, actorId: session.user.id });
  revalidatePath("/dashboard/tickets");
  revalidatePath("/support/tickets");
  revalidatePath("/admin/tickets");
  revalidateTicketNotificationPaths();
  return { ok: true, id: ticket.id };
}
