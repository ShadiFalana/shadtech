import { TicketPriority, TicketStatus, type Prisma } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { PageHeader } from "@/components/workspace/page-header";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import { requireRole } from "@/lib/session";

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

export default async function SupportTicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireRole(["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"], "staff");
  const t = await getServerDictionary();
  const locale = await getServerLocale();
  const query = await searchParams;

  const status = first(query.status) ?? "";
  const priority = first(query.priority) ?? "";
  const assignee = first(query.assignee) ?? "";
  const resolvedToday = first(query.resolved) === "today";
  const q = first(query.q)?.trim() ?? "";

  const where: Prisma.SupportTicketWhereInput = {};
  if (isTicketStatus(status)) where.status = status;
  if (isTicketPriority(priority)) where.priority = priority;
  if (assignee === "me") where.assignedToId = session.user.id;
  else if (assignee) where.assignedToId = assignee;
  if (resolvedToday) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    where.resolvedAt = { gte: start };
  }
  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { ticketNumber: { contains: q, mode: "insensitive" } },
      { customer: { user: { name: { contains: q, mode: "insensitive" } } } },
      { customer: { user: { email: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [tickets, agents, demoTickets] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: { customer: { include: { user: true } }, assignedTo: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"] } },
      orderBy: { name: "asc" },
    }),
    prisma.supportTicket.count({ where: { id: { startsWith: "demo_" } } }),
  ]);

  const statusLabels = t.statuses as Record<string, string>;
  const priorityLabels = t.priorities as Record<string, string>;

  const columns: Column<TicketRow>[] = [
    {
      key: "subject",
      headerKey: "common.subject",
      cell: (row) => (
        <Link href={`/support/tickets/${row.id}`} className="font-medium hover:underline">
          {row.ticketNumber ? `${row.ticketNumber} · ` : ""}
          {row.subject}
        </Link>
      ),
    },
    {
      key: "customer",
      headerKey: "common.customer",
      cell: (row) => (
        <div>
          <p className="text-sm">{row.customer.user.name ?? row.customer.user.email}</p>
          <p className="text-xs text-muted-foreground">{row.customer.user.email}</p>
        </div>
      ),
    },
    {
      key: "status",
      headerKey: "common.status",
      cell: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: "priority",
      headerKey: "common.priority",
      cell: (row) => <StatusBadge value={row.priority} kind="priority" />,
    },
    {
      key: "assignee",
      headerKey: "common.assignee",
      cell: (row) => row.assignedTo?.name ?? row.assignedTo?.email ?? "—",
    },
    {
      key: "createdAt",
      headerKey: "common.createdAt",
      cell: (row) => formatDate(row.createdAt, locale),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="support.tickets">
        <Button nativeButton={false} render={<Link href="/support/queues" />}>
          {t.support.queues}
        </Button>
      </PageHeader>

      {demoTickets > 0 && <DemoNotice />}

      <nav aria-label={t.common.filters}>
        <ul className="flex flex-wrap gap-2">
          {[
            { key: "all", label: t.common.all, href: "/support/tickets", active: !status && !priority && !assignee && !resolvedToday },
            { key: "mine", label: t.support.assigned, href: "/support/tickets?assignee=me", active: assignee === "me" },
            { key: "urgent", label: t.support.urgent, href: "/support/tickets?priority=CRITICAL", active: priority === "CRITICAL" },
            {
              key: "waiting",
              label: t.support.waiting,
              href: "/support/tickets?status=WAITING_FOR_CUSTOMER",
              active: status === "WAITING_FOR_CUSTOMER",
            },
            {
              key: "resolved",
              label: t.portal.resolvedTickets,
              href: "/support/tickets?resolved=today",
              active: resolvedToday,
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
        {resolvedToday && <input type="hidden" name="resolved" value="today" />}
        <div className="min-w-56 flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="ticket-q">
            {t.common.search}
          </label>
          <Input id="ticket-q" name="q" defaultValue={q} placeholder={t.common.search} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="ticket-status">
            {t.common.status}
          </label>
          <select
            id="ticket-status"
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
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="ticket-priority">
            {t.common.priority}
          </label>
          <select
            id="ticket-priority"
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
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="ticket-assignee">
            {t.common.assignee}
          </label>
          <select
            id="ticket-assignee"
            name="assignee"
            defaultValue={assignee}
            className="h-8 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">{t.common.all} · {t.common.assignee}</option>
            <option value="me">{t.support.assigned}</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name ?? agent.email}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">{t.common.search}</Button>
        <Button nativeButton={false} render={<Link href="/support/tickets" />} variant="outline">
          {t.common.refresh}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">{t.sections.results}: {tickets.length}</p>
      <DataTable
        rows={tickets}
        columns={columns}
        emptyKey="empty.tickets"
        ariaLabel={t.support.tickets}
        defaultSort={{ key: "createdAt", direction: "desc" }}
      />
    </div>
  );
}
