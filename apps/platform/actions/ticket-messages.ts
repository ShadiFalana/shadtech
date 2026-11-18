"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import {
  notifyCustomerReply,
  notifyStaffReply,
  revalidateTicketNotificationPaths,
} from "@/lib/notifications";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  ticketId: z.string().min(1),
  body: z.string().trim().min(1).max(8000),
  isInternal: z.boolean().optional(),
});

export async function replyTicket(formData: FormData) {
  const session = await getSession();
  if (!session) return { ok: false as const, errorKey: "errors.unauthorized" };

  const parsed = schema.safeParse({
    ticketId: formData.get("ticketId"),
    body: formData.get("body"),
    isInternal: formData.get("isInternal") === "on",
  });
  if (!parsed.success) return { ok: false as const, errorKey: "forms.validationError" };

  const role = (session.user as { role?: string }).role;
  const isStaff = hasPermission(role, "tickets.manage");
  const requestedInternal = parsed.data.isInternal ?? false;
  if (requestedInternal && !isStaff) {
    return { ok: false as const, errorKey: "errors.forbidden" };
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { id: true, customerId: true, subject: true },
  });
  if (!ticket) return { ok: false as const, errorKey: "errors.notFound" };

  if (!isStaff) {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile || profile.id !== ticket.customerId) {
      return { ok: false as const, errorKey: "errors.forbidden" };
    }
  }

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      authorId: session.user.id,
      body: parsed.data.body,
      isInternal: isStaff ? requestedInternal : false,
    },
  });
  await prisma.ticketActivityLog.create({
    data: { ticketId: ticket.id, actorId: session.user.id, action: "REPLY" },
  });

  // The message row is committed first; notifications are created only afterwards.
  if (isStaff) {
    await notifyStaffReply({
      ticketId: ticket.id,
      customerId: ticket.customerId,
      subject: ticket.subject,
      actorId: session.user.id,
      isInternal: isStaff && requestedInternal,
    });
  } else {
    await notifyCustomerReply({
      ticketId: ticket.id,
      subject: ticket.subject,
      actorId: session.user.id,
    });
  }

  revalidatePath(`/dashboard/tickets/${ticket.id}`);
  revalidatePath(`/admin/tickets/${ticket.id}`);
  revalidatePath(`/support/tickets/${ticket.id}`);
  revalidateTicketNotificationPaths();
  return { ok: true as const };
}
