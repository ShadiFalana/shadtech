import type { Dictionary } from "@/lib/dictionaries";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AttachmentReferenceForm } from "@/components/support/attachment-reference-form";
import { ManageTicketForm } from "@/components/support/manage-ticket-form";
import { ReplyForm } from "@/components/support/reply-form";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { DetailsGrid } from "@/components/workspace/details-grid";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

function activityLabel(action: string, t: Dictionary) {
  if (action === "REPLY") return t.support.reply;
  if (action === "UPDATED") return t.common.updatedAt;
  if (action === "CREATED") return t.common.create;
  if (action === "ATTACHMENT_REFERENCE_ADDED") return t.actions.addReference;
  return action;
}

type TimelineEntry = {
  id: string;
  at: Date;
  title: string;
  body?: string;
  internal?: boolean;
};

export default async function SupportTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getServerDictionary();
  const locale = await getServerLocale();

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      customer: { include: { user: true, assets: true } },
      assignedTo: true,
      messages: { include: { author: true }, orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { createdAt: "desc" } },
      activityLogs: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!ticket) notFound();

  const agents = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"] } },
    orderBy: { name: "asc" },
  });

  const articleWhere = ticket.category
    ? {
        isPublished: true,
        OR: [
          { category: { equals: ticket.category, mode: "insensitive" as const } },
          { tags: { has: ticket.category } },
        ],
      }
    : { isPublished: true };

  const [suggestedArticles, activeSla] = await Promise.all([
    prisma.knowledgeArticle.findMany({
      where: articleWhere,
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.sLAPolicy.findFirst({
      where: { isActive: true },
      orderBy: { resolutionMinutes: "asc" },
    }),
  ]);

  const isDemo =
    ticket.id.startsWith("demo_") || ticket.ticketNumber?.toUpperCase().startsWith("DEMO");

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
        title: activityLabel(log.action, t),
        body: log.details ?? undefined,
      })),
  ].sort((left, right) => right.at.getTime() - left.at.getTime());

  const actorLabels = new Map(agents.map((agent) => [agent.id, agent.name ?? agent.email]));
  const attachmentRows = ticket.attachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.fileName,
    type: attachment.mimeType ?? "—",
    size: attachment.fileSize ?? "—",
    createdAt: formatDateTime(attachment.createdAt, locale),
    url: attachment.fileUrl,
  }));
  const attachmentColumns: Column<(typeof attachmentRows)[number]>[] = [
    {
      key: "name",
      headerKey: "forms.fileName",
      cell: (row) => (
        <a href={row.url} target="_blank" rel="noreferrer" className="font-medium hover:underline focus-visible:underline">
          {row.name}
        </a>
      ),
    },
    { key: "type", headerKey: "forms.mimeType", cell: (row) => row.type },
    { key: "size", headerKey: "forms.fileSize", cell: (row) => row.size },
    { key: "createdAt", headerKey: "common.createdAt", cell: (row) => row.createdAt },
  ];

  const activityRows = ticket.activityLogs.map((log) => ({
    id: log.id,
    action: activityLabel(log.action, t),
    actor: log.actorId ? actorLabels.get(log.actorId) ?? log.actorId : "—",
    date: formatDateTime(log.createdAt, locale),
    details: log.details ?? "—",
  }));
  const activityColumns: Column<(typeof activityRows)[number]>[] = [
    { key: "action", headerKey: "common.actions", cell: (row) => row.action },
    { key: "actor", headerKey: "common.agent", cell: (row) => row.actor },
    { key: "date", headerKey: "common.createdAt", cell: (row) => row.date },
    { key: "details", headerKey: "forms.details", cell: (row) => row.details },
  ];

  const articleRows = suggestedArticles.map((article) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    category: article.category ?? "—",
    updatedAt: formatDate(article.updatedAt, locale),
  }));
  const articleColumns: Column<(typeof articleRows)[number]>[] = [
    {
      key: "title",
      headerKey: "forms.title",
      cell: (row) => (
        <Link href={`/knowledge/${row.slug}`} className="font-medium hover:underline focus-visible:underline">
          {row.title}
        </Link>
      ),
    },
    { key: "category", headerKey: "common.category", cell: (row) => row.category },
    { key: "updatedAt", headerKey: "common.updatedAt", cell: (row) => row.updatedAt },
  ];

  const assetRows = ticket.customer.assets.map((asset) => ({
    id: asset.id,
    tag: asset.assetTag,
    name: asset.name,
    type: asset.type,
    status: asset.status,
  }));
  const assetColumns: Column<(typeof assetRows)[number]>[] = [
    { key: "tag", headerKey: "common.number", cell: (row) => row.tag },
    { key: "name", headerKey: "forms.name", cell: (row) => row.name },
    { key: "type", headerKey: "common.category", cell: (row) => row.type },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="support.tickets">
        <Button nativeButton={false} render={<Link href="/support/tickets" />} variant="outline">
          {t.common.back}
        </Button>
      </PageHeader>

      {isDemo && <DemoNotice />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard titleKey="sections.details">
            <DetailsGrid
              items={[
                {
                  labelKey: "common.subject",
                  value: ticket.ticketNumber ? `${ticket.ticketNumber} · ${ticket.subject}` : ticket.subject,
                },
                { labelKey: "common.status", value: <StatusBadge value={ticket.status} /> },
                { labelKey: "common.priority", value: <StatusBadge value={ticket.priority} kind="priority" /> },
                { labelKey: "common.category", value: ticket.category ?? "—" },
                { labelKey: "common.assignee", value: ticket.assignedTo?.name ?? ticket.assignedTo?.email ?? "—" },
                { labelKey: "common.createdAt", value: formatDateTime(ticket.createdAt, locale) },
                { labelKey: "common.updatedAt", value: formatDateTime(ticket.updatedAt, locale) },
                {
                  labelKey: "common.resolution",
                  value: ticket.resolvedAt
                    ? formatDateTime(ticket.resolvedAt, locale)
                    : formatDateTime(ticket.closedAt, locale),
                },
              ]}
            />
            <p className="mt-4 whitespace-pre-wrap text-sm">{ticket.description}</p>
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

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard titleKey="common.attachments">
              <DataTable
                rows={attachmentRows}
                columns={attachmentColumns}
                emptyKey="common.noData"
                ariaLabel={t.common.attachments}
              />
            </SectionCard>
            <SectionCard titleKey="actions.addReference">
              <AttachmentReferenceForm ticketId={ticket.id} />
            </SectionCard>
          </div>

          <SectionCard titleKey="support.activity">
            <DataTable
              rows={activityRows}
              columns={activityColumns}
              emptyKey="common.noData"
              ariaLabel={t.support.activity}
            />
          </SectionCard>
        </div>

        <aside className="space-y-6" aria-label={t.sections.related}>
          <SectionCard titleKey="common.customer">
            <DetailsGrid
              items={[
                { labelKey: "forms.name", value: ticket.customer.user.name ?? "—" },
                { labelKey: "forms.email", value: ticket.customer.user.email },
                { labelKey: "forms.phone", value: ticket.customer.phone ?? "—" },
                { labelKey: "forms.company", value: ticket.customer.company ?? "—" },
                {
                  labelKey: "forms.location",
                  value: [ticket.customer.city, ticket.customer.country].filter(Boolean).join(", ") || "—",
                },
                { labelKey: "common.createdAt", value: formatDateTime(ticket.customer.createdAt, locale) },
              ]}
            />
            <div className="mt-4">
              <Button nativeButton={false} render={<Link href={`/support/customers?q=${encodeURIComponent(ticket.customer.user.email)}`} />} variant="outline">
                {t.actions.viewRecord}
              </Button>
            </div>
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

          <SectionCard titleKey="support.relatedAssets">
            <DataTable
              rows={assetRows}
              columns={assetColumns}
              emptyKey="empty.assets"
              ariaLabel={t.support.relatedAssets}
            />
          </SectionCard>

          <SectionCard titleKey="support.suggestedArticles">
            <DataTable
              rows={articleRows}
              columns={articleColumns}
              emptyKey="empty.articles"
              ariaLabel={t.support.suggestedArticles}
            />
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
