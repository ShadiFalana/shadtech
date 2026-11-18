import { TicketPriority, TicketStatus, type Prisma } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatGrid } from "@/components/workspace/stat-grid";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

type TicketRow = Prisma.SupportTicketGetPayload<{
  include: { customer: { include: { user: true } }; assignedTo: true };
}>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isTicketStatus(value: string | undefined): value is TicketStatus {
  return Boolean(value && Object.values(TicketStatus).includes(value as TicketStatus));
}

function isTicketPriority(value: string | undefined): value is TicketPriority {
  return Boolean(value && Object.values(TicketPriority).includes(value as TicketPriority));
}

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("tickets.view", "admin");
  const [query, t, locale] = await Promise.all([searchParams, getServerDictionary(), getServerLocale()]);
  const status = first(query.status) ?? "";
  const priority = first(query.priority) ?? "";
  const assignee = first(query.assignee) ?? "";
  const q = first(query.q)?.trim() ?? "";

  const where: Prisma.SupportTicketWhereInput = {};
  if (isTicketStatus(status)) where.status = status;
  if (isTicketPriority(priority)) where.priority = priority;
  if (assignee) where.assignedToId = assignee;
  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { ticketNumber: { contains: q, mode: "insensitive" } },
      { customer: { user: { name: { contains: q, mode: "insensitive" } } } },
      { customer: { user: { email: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [tickets, total, open, urgent, agents] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: { customer: { include: { user: true } }, assignedTo: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.supportTicket.count({ where: { priority: "CRITICAL" } }),
    prisma.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  const statusLabels = t.statuses as Record<string, string>;
  const priorityLabels = t.priorities as Record<string, string>;

  const columns: Column<TicketRow>[] = [
    {
      key: "subject",
      headerKey: "table.subject",
      cell: (row) => (
        <Button nativeButton={false} variant="link" size="sm" className="h-auto p-0" render={<Link href={`/admin/tickets/${row.id}`} />}>
          {row.ticketNumber ? `${row.ticketNumber} · ` : ""}
          {row.subject}
        </Button>
      ),
    },
    {
      key: "customer",
      headerKey: "table.customer",
      cell: (row) => row.customer.user.name ?? row.customer.user.email,
    },
    { key: "status", headerKey: "table.status", cell: (row) => <StatusBadge value={row.status} /> },
    {
      key: "priority",
      headerKey: "table.priority",
      cell: (row) => <StatusBadge value={row.priority} kind="priority" />,
    },
    {
      key: "assignee",
      headerKey: "table.assignee",
      cell: (row) => row.assignedTo?.name ?? row.assignedTo?.email ?? "—",
    },
    { key: "createdAt", headerKey: "table.created", cell: (row) => formatDate(row.createdAt, locale) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="admin.tickets" />
      <StatGrid
        items={[
          { labelKey: "admin.totalTickets", value: total },
          { labelKey: "admin.openTickets", value: open },
          { labelKey: "admin.urgentTickets", value: urgent },
        ]}
      />

      <nav aria-label={t.common.filters}>
        <ul className="flex flex-wrap gap-2">
          {[
            { key: "all", label: t.common.all, href: "/admin/tickets", active: !status && !priority && !assignee && !q },
            { key: "open", label: t.statuses.OPEN, href: "/admin/tickets?status=OPEN", active: status === "OPEN" },
            {
              key: "urgent",
              label: t.support.urgent,
              href: "/admin/tickets?priority=CRITICAL",
              active: priority === "CRITICAL",
            },
          ].map((view) => (
            <li key={view.key}>
              <Button
                nativeButton={false}
                render={<Link href={view.href} aria-current={view.active ? "page" : undefined} />}
                variant={view.active ? "default" : "outline"}
                size="sm"
              >
                {view.label}
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      <form method="get" aria-label={t.common.filters} className="flex flex-wrap items-end gap-3 rounded-xl border border-[#E4E7EC] bg-white p-4 dark:border-white/10 dark:bg-[#24272D]">
        <div className="min-w-56 flex-1">
          <label htmlFor="admin-ticket-q" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.common.search}
          </label>
          <Input id="admin-ticket-q" name="q" defaultValue={q} placeholder={t.common.search} />
        </div>
        <div>
          <label htmlFor="admin-ticket-status" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.common.status}
          </label>
          <select
            id="admin-ticket-status"
            name="status"
            defaultValue={status}
            className="h-8 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">{t.common.all} · {t.common.status}</option>
            {Object.values(TicketStatus).map((value) => (
              <option key={value} value={value}>
                {statusLabels[value] ?? value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="admin-ticket-priority" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.common.priority}
          </label>
          <select
            id="admin-ticket-priority"
            name="priority"
            defaultValue={priority}
            className="h-8 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">{t.common.all} · {t.common.priority}</option>
            {Object.values(TicketPriority).map((value) => (
              <option key={value} value={value}>
                {priorityLabels[value] ?? value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="admin-ticket-assignee" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.common.assignee}
          </label>
          <select
            id="admin-ticket-assignee"
            name="assignee"
            defaultValue={assignee}
            className="h-8 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">{t.common.all} · {t.common.assignee}</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name ?? agent.email}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">{t.common.search}</Button>
        <Button nativeButton={false} render={<Link href="/admin/tickets" />} variant="outline">
          {t.common.refresh}
        </Button>
      </form>

      <SectionCard titleKey="sections.records">
        <DataTable
          rows={tickets}
          columns={columns}
          emptyKey="empty.tickets"
          ariaLabel={t.admin.tickets}
          defaultSort={{ key: "createdAt", direction: "desc" }}
        />
      </SectionCard>
    </div>
  );
}
