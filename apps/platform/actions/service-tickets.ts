"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getServerDictionary } from "@/lib/server-i18n";
import { getSession } from "@/lib/session";
import { notifyTicketCreated, revalidateTicketNotificationPaths } from "@/lib/notifications";

const schema = z.object({
  serviceId: z.string().min(1),
  note: z.string().trim().max(1000).optional(),
});

export async function requestServiceTicket(formData: FormData) {
  const session = await getSession();
  if (!session) return { ok: false as const, errorKey: "errors.unauthorized" };

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { ok: false as const, errorKey: "errors.noProfile" };

  const parsed = schema.safeParse({
    serviceId: formData.get("serviceId"),
    note: String(formData.get("note") ?? "").trim() || undefined,
  });
  if (!parsed.success) return { ok: false as const, errorKey: "forms.validationError" };

  const service = await prisma.service.findUnique({
    where: { id: parsed.data.serviceId },
    select: { id: true, name: true, slug: true, isActive: true },
  });
  if (!service?.isActive) return { ok: false as const, errorKey: "errors.notFound" };

  const t = await getServerDictionary();
  const subject = t.portal.serviceTicketSubject.replace("{service}", service.name);
  const description = [
    t.portal.serviceTicketDescription.replace("{service}", service.name),
    parsed.data.note,
  ]
    .filter(Boolean)
    .join("\n\n");

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: `ST-${Date.now().toString(36).toUpperCase()}`,
      customerId: profile.id,
      serviceId: service.id,
      subject,
      description,
      category: service.slug,
    },
  });

  await prisma.ticketActivityLog.create({
    data: { ticketId: ticket.id, actorId: session.user.id, action: "CREATED" },
  });
  await notifyTicketCreated({ ticketId: ticket.id, subject: ticket.subject, actorId: session.user.id });

  revalidatePath("/dashboard/service-tickets");
  revalidatePath("/dashboard/tickets");
  revalidatePath("/support/tickets");
  revalidatePath("/admin/tickets");
  revalidateTicketNotificationPaths();
  return { ok: true as const, id: ticket.id, messageKey: "portal.ticketRequested" };
}
