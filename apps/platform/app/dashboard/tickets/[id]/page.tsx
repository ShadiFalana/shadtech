import { TicketReplyForm } from "@/components/portal/ticket-reply-form";
import { Button } from "@/components/ui/button";
import { DetailsGrid, type DetailItem } from "@/components/workspace/details-grid";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";
import Link from "next/link";

type TimelineEntry = {
  id: string;
  at: Date;
  title: string;
  body?: string;
  href?: string;
};

function activityTitle(action: string, t: Awaited<ReturnType<typeof getServerDictionary>>) {
  if (action === "REPLY") return t.support.reply;
  if (action === "UPDATED") return t.common.updatedAt;
  if (action === "CREATED") return t.common.create;
  if (action === "ATTACHMENT_REFERENCE_ADDED") return t.actions.addReference;
  return action;
}

export default async function CustomerTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireCustomerProfile();
  const [locale, t] = await Promise.all([getServerLocale(), getServerDictionary()]);

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, customerId: profile.id },
    include: {
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, email: true } } },
      },
      attachments: { orderBy: { createdAt: "asc" } },
      activityLogs: { orderBy: { createdAt: "asc" } },
      assignedTo: { select: { name: true, email: true } },
    },
  });

  if (!ticket) {
    return (
      <PageHeader titleKey="errors.notFound" descriptionKey="errors.forbidden">
        <Button nativeButton={false} variant="outline" render={<Link href="/dashboard/tickets" />}>
          {t.common.back}
        </Button>
      </PageHeader>
    );
  }

  const detailItems: DetailItem[] = [
    { labelKey: "common.subject", value: ticket.subject },
    { labelKey: "common.number", value: ticket.ticketNumber ?? "—" },
    { labelKey: "common.status", value: <StatusBadge value={ticket.status} /> },
    { labelKey: "common.priority", value: <StatusBadge value={ticket.priority} kind="priority" /> },
    { labelKey: "common.category", value: ticket.category ?? "—" },
    { labelKey: "common.createdAt", value: formatDateTime(ticket.createdAt, locale) },
    {
      labelKey: "common.assignee",
      value: ticket.assignedTo?.name ?? ticket.assignedTo?.email ?? "—",
    },
    { labelKey: "common.resolution", value: formatDateTime(ticket.resolvedAt, locale) },
  ];

  const timeline: TimelineEntry[] = [
    ...ticket.messages.map((message) => ({
      id: `message-${message.id}`,
      at: message.createdAt,
      title: `${message.author.name ?? message.author.email} · ${t.support.reply}`,
      body: message.body,
    })),
    ...ticket.activityLogs
      .filter((log) => log.action !== "REPLY")
      .map((log) => ({
        id: `activity-${log.id}`,
        at: log.createdAt,
        title: activityTitle(log.action, t),
        body: log.details ?? undefined,
      })),
    ...ticket.attachments.map((attachment) => ({
      id: `attachment-${attachment.id}`,
      at: attachment.createdAt,
      title: `${t.common.attachments}: ${attachment.fileName}`,
      href: attachment.fileUrl,
    })),
  ].sort((left, right) => right.at.getTime() - left.at.getTime());

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.tickets">
        <Button nativeButton={false} variant="outline" render={<Link href="/dashboard/tickets" />}>
          {t.common.back}
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard titleKey="common.description">
            <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
          </SectionCard>

          <SectionCard titleKey="common.timeline">
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.common.noData}</p>
            ) : (
              <ol className="space-y-4 border-s border-[#E4E7EC] ps-4 dark:border-white/10">
                {timeline.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -start-[21px] top-1.5 size-2 rounded-full bg-brand-orange"
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{entry.title}</p>
                      <time dateTime={entry.at.toISOString()} className="text-xs text-muted-foreground">
                        {formatDateTime(entry.at, locale)}
                      </time>
                    </div>
                    {entry.body && <p className="mt-1 whitespace-pre-wrap break-words text-sm">{entry.body}</p>}
                    {entry.href && (
                      <a
                        href={entry.href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-sm text-primary hover:underline focus-visible:underline"
                      >
                        {t.actions.open}
                      </a>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>

          <SectionCard titleKey="support.reply">
            <TicketReplyForm ticketId={ticket.id} />
          </SectionCard>
        </div>

        <aside className="space-y-6" aria-label={t.sections.details}>
          <SectionCard titleKey="sections.details">
            <DetailsGrid items={detailItems} />
          </SectionCard>

          {ticket.attachments.length > 0 && (
            <SectionCard titleKey="common.attachments">
              <ul className="space-y-2 text-sm">
                {ticket.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline focus-visible:underline"
                    >
                      {attachment.fileName}
                    </a>
                    {attachment.mimeType && (
                      <span className="ms-2 text-xs text-muted-foreground">{attachment.mimeType}</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">{t.forms.referenceOnly}</p>
            </SectionCard>
          )}
        </aside>
      </div>
    </div>
  );
}
