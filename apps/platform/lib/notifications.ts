import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getServerDictionary } from "@/lib/server-i18n";

/** Roles that work the ticket queues. Never inferred from the actor's role. */
const TICKET_STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"] as const;

type Draft = {
  userId: string;
  title: string;
  body: string;
  type: string;
  link: string;
};

export function revalidateTicketNotificationPaths() {
  revalidatePath("/dashboard/notifications");
  revalidatePath("/support");
  revalidatePath("/admin/notifications");
}

/** Internal-only link: never expose a staff route to a customer or a customer route to staff. */
function staffLink(role: string, ticketId: string) {
  return role === "SUPPORT_AGENT" ? `/support/tickets/${ticketId}` : `/admin/tickets/${ticketId}`;
}

function customerLink(ticketId: string) {
  return `/dashboard/tickets/${ticketId}`;
}

async function commit(drafts: Draft[]) {
  // One row per user, even when a user matches several audiences.
  const unique = Array.from(new Map(drafts.map((draft) => [draft.userId, draft])).values());
  if (unique.length === 0) return;
  await prisma.notification.createMany({ data: unique });
}

async function staffDrafts({
  ticketId,
  title,
  body,
  actorId,
}: {
  ticketId: string;
  title: string;
  body: string;
  actorId: string;
}): Promise<Draft[]> {
  const members = await prisma.user.findMany({
    where: { role: { in: [...TICKET_STAFF_ROLES] }, id: { not: actorId } },
    select: { id: true, role: true },
  });
  return members.map((member) => ({
    userId: member.id,
    title,
    body,
    type: "TICKET",
    link: staffLink(member.role, ticketId),
  }));
}

async function customerDrafts({
  ticketId,
  customerId,
  title,
  body,
}: {
  ticketId: string;
  customerId: string;
  title: string;
  body: string;
}): Promise<Draft[]> {
  const profile = await prisma.customerProfile.findUnique({
    where: { id: customerId },
    select: { userId: true },
  });
  if (!profile) return [];
  return [
    {
      userId: profile.userId,
      title,
      body,
      type: "TICKET",
      link: customerLink(ticketId),
    },
  ];
}

async function assigneeDraft({
  ticketId,
  assigneeId,
  title,
  body,
  actorId,
}: {
  ticketId: string;
  assigneeId: string;
  title: string;
  body: string;
  actorId: string;
}): Promise<Draft[]> {
  if (assigneeId === actorId) return [];
  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { id: true, role: true },
  });
  if (!assignee || !TICKET_STAFF_ROLES.includes(assignee.role as (typeof TICKET_STAFF_ROLES)[number])) {
    return [];
  }
  return [
    {
      userId: assignee.id,
      title,
      body,
      type: "TICKET",
      link: staffLink(assignee.role, ticketId),
    },
  ];
}

/** Ticket opened by a customer: the customer is the actor, so only staff are notified. */
export async function notifyTicketCreated({
  ticketId,
  subject,
  actorId,
}: {
  ticketId: string;
  subject: string;
  actorId: string;
}) {
  const t = await getServerDictionary();
  await commit(await staffDrafts({ ticketId, title: t.portal.newTicket, body: subject, actorId }));
}

/** Customer reply: notify the support team; a customer never receives their own reply notification. */
export async function notifyCustomerReply({
  ticketId,
  subject,
  actorId,
}: {
  ticketId: string;
  subject: string;
  actorId: string;
}) {
  const t = await getServerDictionary();
  await commit(await staffDrafts({ ticketId, title: t.support.reply, body: subject, actorId }));
}

/**
 * Staff reply: public replies notify the customer; internal notes stay inside staff
 * (the customer must never receive an internal-note notification).
 */
export async function notifyStaffReply({
  ticketId,
  customerId,
  subject,
  actorId,
  isInternal,
}: {
  ticketId: string;
  customerId: string;
  subject: string;
  actorId: string;
  isInternal: boolean;
}) {
  const t = await getServerDictionary();
  if (isInternal) {
    await commit(
      await staffDrafts({ ticketId, title: t.support.internalNote, body: subject, actorId }),
    );
    return;
  }
  await commit(await customerDrafts({ ticketId, customerId, title: t.support.reply, body: subject }));
}

/** Status/priority/assignment changes: notify the customer, plus a newly assigned agent. */
export async function notifyTicketUpdate({
  ticketId,
  customerId,
  actorId,
  title,
  body,
  assigneeId,
}: {
  ticketId: string;
  customerId: string;
  actorId: string;
  title: string;
  body: string;
  assigneeId?: string | null;
}) {
  const drafts: Draft[] = await customerDrafts({ ticketId, customerId, title, body });
  if (assigneeId) {
    drafts.push(...(await assigneeDraft({ ticketId, assigneeId, title, body, actorId })));
  }
  await commit(drafts);
}
