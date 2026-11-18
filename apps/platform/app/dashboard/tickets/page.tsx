import { TicketStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { translateKey } from "@/lib/dictionaries";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";
import Link from "next/link";

type TicketRow = {
  id: string;
  ticketNumber: string | null;
  subject: string;
  priority: string;
  status: string;
  createdAt: Date;
};

function isTicketStatus(value: string | undefined): value is TicketStatus {
  return Boolean(value && Object.values(TicketStatus).includes(value as TicketStatus));
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireCustomerProfile();
  const [locale, t, query] = await Promise.all([getServerLocale(), getServerDictionary(), searchParams]);
  const rawStatus = Array.isArray(query.status) ? query.status[0] : query.status;
  const status = isTicketStatus(rawStatus) ? rawStatus : undefined;

  const tickets = await prisma.supportTicket.findMany({
    where: { customerId: profile.id, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
      priority: true,
      status: true,
      createdAt: true,
    },
  });

  const views = [
    { key: "all", label: t.common.all, href: "/dashboard/tickets", active: !status },
    ...(
      [
        ["OPEN", t.statuses.OPEN],
        ["IN_PROGRESS", t.portal.inProgress],
        ["WAITING_FOR_CUSTOMER", t.portal.awaitingResponse],
        ["RESOLVED", t.portal.resolvedTickets],
      ] as const
    ).map(([value, label]) => ({
      key: value,
      label,
      href: `/dashboard/tickets?status=${value}`,
      active: status === value,
    })),
  ];

  const columns: Column<TicketRow>[] = [
    {
      key: "subject",
      headerKey: "common.subject",
      cell: (row) => (
        <div className="space-y-0.5">
          <Link href={`/dashboard/tickets/${row.id}`} className="font-medium hover:underline focus-visible:underline">
            {row.subject}
          </Link>
          {row.ticketNumber && <p className="text-xs text-muted-foreground">{row.ticketNumber}</p>}
        </div>
      ),
    },
    {
      key: "priority",
      headerKey: "common.priority",
      cell: (row) => <StatusBadge value={row.priority} kind="priority" />,
    },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
    { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
    {
      key: "view",
      headerKey: "common.actions",
      sortable: false,
      searchable: false,
      filterable: false,
      cell: (row) => (
        <Button nativeButton={false} variant="link" render={<Link href={`/dashboard/tickets/${row.id}`} />}>
          {t.common.view}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.tickets">
        <Button nativeButton={false} render={<Link href="/dashboard/tickets/new" />}>
          {translateKey(t, "portal.newTicket") ?? "portal.newTicket"}
        </Button>
      </PageHeader>

      <nav aria-label={t.common.filters}>
        <ul className="flex flex-wrap gap-2">
          {views.map((view) => (
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

      <DataTable
        rows={tickets}
        columns={columns}
        emptyKey="empty.tickets"
        ariaLabel={t.portal.tickets}
        defaultSort={{ key: "createdAt", direction: "desc" }}
      />
    </div>
  );
}
