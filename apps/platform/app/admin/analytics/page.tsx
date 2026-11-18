import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { MiniChart } from "@/components/workspace/mini-chart";
import { PageHeader } from "@/components/workspace/page-header";
import { StatGrid } from "@/components/workspace/stat-grid";
import { translateKey } from "@/lib/dictionaries";
import { formatMoney } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

const ticketStatuses = ["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"] as const;
const ticketPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export default async function AdminAnalyticsPage() {
  await requirePermission("reports.view", "admin");
  const [
    ticketCount,
    leadCount,
    quotationCount,
    revenueAgg,
    statusGroups,
    priorityGroups,
    leadGroups,
    t,
    locale,
  ] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.lead.count(),
    prisma.quotation.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS" } }),
    prisma.supportTicket.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.supportTicket.groupBy({ by: ["priority"], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    getServerDictionary(),
    getServerLocale(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader titleKey="admin.analytics" />
      <StatGrid
        items={[
          { labelKey: "admin.totalTickets", value: ticketCount },
          { labelKey: "admin.leads", value: leadCount },
          { labelKey: "admin.quotes", value: quotationCount },
          { labelKey: "admin.totalRevenue", value: formatMoney(revenueAgg._sum.amount ?? 0, locale) },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <MiniChart
          titleKey="admin.ticketsByStatus"
          data={ticketStatuses.map((status) => ({
            label: translateKey(t, `statuses.${status}`) ?? status,
            value: statusGroups.find((group) => group.status === status)?._count._all ?? 0,
          }))}
        />
        <MiniChart
          titleKey="admin.ticketsByPriority"
          data={ticketPriorities.map((priority) => ({
            label: translateKey(t, `priorities.${priority}`) ?? priority,
            value: priorityGroups.find((group) => group.priority === priority)?._count._all ?? 0,
          }))}
        />
        <MiniChart
          titleKey="reports.salesPipeline"
          data={leadGroups.map((group) => ({
            label: group.status,
            value: group._count._all,
          }))}
        />
      </div>
    </div>
  );
}
