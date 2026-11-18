import { DashboardQuickActions } from "@/components/portal/dashboard-quick-actions";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { PageHeader } from "@/components/workspace/page-header";
import { StatGrid } from "@/components/workspace/stat-grid";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";

type RecentTicket = {
  id: string;
  subject: string;
  status: string;
  createdAt: Date;
};

export default async function DashboardOverview() {
  const { profile } = await requireCustomerProfile();
  const locale = await getServerLocale();
  const t = await getServerDictionary();
  const customerId = profile.id;

  const [openTickets, totalTickets, resolvedTickets, subscriptions, outstandingInvoices, activeContracts, recent] =
    await Promise.all([
      prisma.supportTicket.count({
        where: { customerId, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER"] } },
      }),
      prisma.supportTicket.count({ where: { customerId } }),
      prisma.supportTicket.count({ where: { customerId, status: { in: ["RESOLVED", "CLOSED"] } } }),
      prisma.subscription.count({ where: { customerId } }),
      prisma.invoice.count({ where: { customerId, status: { in: ["PENDING", "OVERDUE"] } } }),
      prisma.contract.count({ where: { customerId, status: "ACTIVE" } }),
      prisma.supportTicket.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, subject: true, status: true, createdAt: true },
      }),
    ]);

  const columns: Column<RecentTicket>[] = [
    {
      key: "subject",
      headerKey: "common.subject",
      cell: (row) => (
        <a href={`/dashboard/tickets/${row.id}`} className="font-medium hover:underline">
          {row.subject}
        </a>
      ),
    },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
    { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.dashboard" descriptionKey="portal.overview" />
      <DemoNotice />
      <StatGrid
        items={[
          { labelKey: "portal.openTickets", value: openTickets },
          { labelKey: "portal.resolvedTickets", value: resolvedTickets },
          { labelKey: "portal.tickets", value: totalTickets },
          { labelKey: "portal.subscriptions", value: subscriptions },
          { labelKey: "portal.outstandingInvoices", value: outstandingInvoices },
          { labelKey: "portal.activeContracts", value: activeContracts },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-base font-semibold text-foreground dark:text-white">{t.portal.recentActivity}</h2>
          <DataTable rows={recent} columns={columns} emptyKey="empty.tickets" />
        </div>
        <DashboardQuickActions />
      </div>
    </div>
  );
}
