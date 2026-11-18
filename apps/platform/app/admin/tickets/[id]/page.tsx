import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import { ManageTicketForm } from "@/components/support/manage-ticket-form";
import { ReplyForm } from "@/components/support/reply-form";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/workspace/data-table";
import { DetailsGrid } from "@/components/workspace/details-grid";
import { SectionCard } from "@/components/workspace/section-card";
import { StatusBadge } from "@/components/workspace/status-badge";
import { formatDateTime } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import Link from "next/link";

type TimelineEntry = {
  id: string;
  at: Date;
  title: string;
  body?: string;
  internal?: boolean;
  href?: string;
};

function activityTitle(action: string, dictionary: Awaited<ReturnType<typeof getServerDictionary>>) {
  if (action === "REPLY") return dictionary.support.reply;
  if (action === "UPDATED") return dictionary.common.updatedAt;
  if (action === "CREATED") return dictionary.common.create;
  if (action === "ATTACHMENT_REFERENCE_ADDED") return dictionary.actions.addReference;
  return action;
}

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("tickets.view", "admin");
  const { id } = await params;
  const [ticket, agents, activeSla, t, locale] = await Promise.all([
    prisma.supportTicket.findUnique({
      where: { id },
      include: {
        customer: { include: { user: true, assets: true } },
        assignedTo: true,
        messages: { include: { author: true }, orderBy: { createdAt: "asc" } },
        activityLogs: { orderBy: { createdAt: "desc" } },
        attachments: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"] } },
      orderBy: { email: "asc" },
    }),
    prisma.sLAPolicy.findFirst({
      where: { isActive: true },
      orderBy: { resolutionMinutes: "asc" },
    }),
    getServerDictionary(),
    getServerLocale(),
  ]);

  if (!ticket) notFound();

  const timeline: TimelineEntry[] = [
    ...ticket.messages.map((message) => ({
      id: `message-${message.id}`,
      at: message.createdAt,
      title: `${message.author.name ?? message.author.email}${message.isInternal ? ` · ${t.support.internalNote}` : ""}`,
      body: message.body,
      internal: message.isInternal,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{ticket.subject}</h1>
          {ticket.ticketNumber && <p className="text-xs text-muted-foreground">{ticket.ticketNumber}</p>}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge value={ticket.status} />
          <Button nativeButton={false} variant="outline" render={<Link href="/admin/tickets" />}>
            {t.common.back}
          </Button>
        </div>
      </div>

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
                  <li
                    key={entry.id}
                    className={`relative rounded-lg border p-3 ${
                      entry.internal
                        ? "border-[#FFB15C]/60 bg-[#FFF3E6] dark:border-[#F79432]/30 dark:bg-[#F79432]/10"
                        : "border-[#E4E7EC] dark:border-white/10"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -start-[21px] top-3 size-2 rounded-full bg-brand-orange"
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                      <span className="font-semibold text-secondary-foreground dark:text-white/80">{entry.title}</span>
                      <time dateTime={entry.at.toISOString()} className="text-muted-foreground">
                        {formatDateTime(entry.at, locale)}
                      </time>
                    </div>
                    {entry.body && (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm">{entry.body}</p>
                    )}
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

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard titleKey="support.reply">
              <ReplyForm ticketId={ticket.id} mode="customer" />
            </SectionCard>
            <SectionCard titleKey="support.internalNote">
              <ReplyForm ticketId={ticket.id} mode="internal" />
            </SectionCard>
          </div>

          <SectionCard titleKey="support.changeStatus">
            <ManageTicketForm
              ticketId={ticket.id}
              status={ticket.status}
              priority={ticket.priority}
              assignedToId={ticket.assignedToId}
              agents={agents.map((agent) => ({ id: agent.id, name: agent.name, email: agent.email }))}
            />
          </SectionCard>

          <SectionCard titleKey="support.activity">
            <DataTable
              emptyKey="common.noData"
              rows={ticket.activityLogs}
              ariaLabel={t.support.activity}
              columns={[
                { key: "action", headerKey: "common.actions", cell: (row) => activityTitle(row.action, t) },
                { key: "details", headerKey: "common.description", cell: (row) => row.details ?? "—" },
                {
                  key: "createdAt",
                  headerKey: "common.createdAt",
                  cell: (row) => formatDateTime(row.createdAt, locale),
                },
              ]}
            />
          </SectionCard>
        </div>

        <aside className="space-y-6" aria-label={t.sections.details}>
          <SectionCard titleKey="sections.details">
            <DetailsGrid
              items={[
                { labelKey: "common.number", value: ticket.ticketNumber ?? "—" },
                { labelKey: "common.customer", value: ticket.customer.user.name ?? ticket.customer.user.email },
                { labelKey: "common.status", value: <StatusBadge value={ticket.status} /> },
                { labelKey: "common.priority", value: <StatusBadge value={ticket.priority} kind="priority" /> },
                {
                  labelKey: "common.assignee",
                  value: ticket.assignedTo?.name ?? ticket.assignedTo?.email ?? "—",
                },
                { labelKey: "common.createdAt", value: formatDateTime(ticket.createdAt, locale) },
                {
                  labelKey: "common.resolution",
                  value: formatDateTime(ticket.resolvedAt ?? ticket.closedAt, locale),
                },
              ]}
            />
          </SectionCard>

          {activeSla && (
            <SectionCard titleKey="support.sla" descriptionKey="sections.configuration">
              <DetailsGrid
                items={[
                  { labelKey: "forms.name", value: activeSla.name },
                  { labelKey: "support.slaTarget", value: activeSla.responseMinutes },
                  { labelKey: "support.resolutionTarget", value: activeSla.resolutionMinutes },
                ]}
              />
            </SectionCard>
          )}

          <SectionCard titleKey="common.attachments">
            <DataTable
              emptyKey="common.noData"
              rows={ticket.attachments}
              ariaLabel={t.common.attachments}
              columns={[
                {
                  key: "fileName",
                  headerKey: "forms.fileName",
                  cell: (row) => (
                    <a
                      href={row.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium hover:underline focus-visible:underline"
                    >
                      {row.fileName}
                    </a>
                  ),
                },
                { key: "mimeType", headerKey: "forms.mimeType", cell: (row) => row.mimeType ?? "—" },
                {
                  key: "createdAt",
                  headerKey: "common.createdAt",
                  cell: (row) => formatDateTime(row.createdAt, locale),
                },
              ]}
            />
          </SectionCard>

          <SectionCard titleKey="support.relatedAssets">
            <DataTable
              emptyKey="empty.assets"
              rows={ticket.customer.assets}
              ariaLabel={t.support.relatedAssets}
              columns={[
                { key: "assetTag", headerKey: "common.number", cell: (row) => row.assetTag },
                { key: "name", headerKey: "forms.name", cell: (row) => row.name },
                { key: "type", headerKey: "common.category", cell: (row) => row.type },
                { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
              ]}
            />
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
