import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { MiniChart } from "@/components/workspace/mini-chart";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatGrid } from "@/components/workspace/stat-grid";
import { translateKey } from "@/lib/dictionaries";
import { formatMoney } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

const ticketStatuses = ["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"] as const;
const ticketPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export default async function AdminReportsPage() {
  await requirePermission("reports.view", "admin");
  const [
    totalTickets,
    totalCustomers,
    revenueAgg,
    outstanding,
    statusGroups,
    priorityGroups,
    workloadGroups,
    agents,
    t,
    locale,
  ] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.customerProfile.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS" } }),
    prisma.invoice.count({ where: { status: { in: ["PENDING", "OVERDUE"] } } }),
    prisma.supportTicket.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.supportTicket.groupBy({ by: ["priority"], _count: { _all: true } }),
    prisma.supportTicket.groupBy({ by: ["assignedToId"], _count: { _all: true } }),
    prisma.user.findMany({ where: { role: { in: ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"] } } }),
    getServerDictionary(),
    getServerLocale(),
  ]);

  const agentNames = new Map(agents.map((agent) => [agent.id, agent.name ?? agent.email]));
  const workload = workloadGroups
    .filter((group) => group.assignedToId)
    .map((group) => ({
      label: agentNames.get(group.assignedToId!) ?? group.assignedToId!,
      value: group._count._all,
    }));

  return (
    <div className="space-y-6">
      <PageHeader titleKey="admin.reports" />
      <StatGrid
        items={[
          { labelKey: "admin.totalTickets", value: totalTickets },
          { labelKey: "admin.totalCustomers", value: totalCustomers },
          { labelKey: "admin.totalRevenue", value: formatMoney(revenueAgg._sum.amount ?? 0, locale) },
          { labelKey: "admin.outstandingInvoices", value: outstanding },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
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
      </div>
      <SectionCard titleKey="reports.agentWorkload">
        <MiniChart titleKey="reports.agentWorkload" data={workload} />
      </SectionCard>
    </div>
  );
}
