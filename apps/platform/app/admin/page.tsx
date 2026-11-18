import Link from "next/link";
import { prisma } from "@/lib/db";
import { getServerDictionary } from "@/lib/server-i18n";
import { translateKey } from "@/lib/dictionaries";
import { getServerLocale } from "@/lib/server-i18n";
import { formatMoney } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { MiniChart } from "@/components/workspace/mini-chart";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatGrid } from "@/components/workspace/stat-grid";

const ticketStatuses = ["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"] as const;
const ticketPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export default async function AdminOverviewPage() {
  const t = await getServerDictionary();
  const locale = await getServerLocale();
  const session = await getSession();
  const canAccessSuperAdmin = hasPermission((session?.user as { role?: string } | undefined)?.role, "superAdmin.access");

  const [
    customers,
    tickets,
    openTickets,
    resolvedTickets,
    revenueAgg,
    activeSubscriptions,
    activeContracts,
    activeAssets,
    statusGroups,
    priorityGroups,
  ] = await Promise.all([
    prisma.customerProfile.count(),
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.contract.count({ where: { status: "ACTIVE" } }),
    prisma.asset.count({ where: { status: "IN_USE" } }),
    prisma.supportTicket.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.supportTicket.groupBy({ by: ["priority"], _count: { _all: true } }),
  ]);

  const statusData = ticketStatuses.map((status) => ({
    label: translateKey(t, `statuses.${status}`) ?? status,
    value: statusGroups.find((group) => group.status === status)?._count._all ?? 0,
  }));
  const priorityData = ticketPriorities.map((priority) => ({
    label: translateKey(t, `priorities.${priority}`) ?? priority,
    value: priorityGroups.find((group) => group.priority === priority)?._count._all ?? 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader titleKey="admin.dashboard" />
      <DemoNotice />
      <StatGrid
        items={[
          { labelKey: "admin.totalCustomers", value: customers },
          { labelKey: "admin.totalTickets", value: tickets },
          { labelKey: "admin.openTickets", value: openTickets },
          { labelKey: "admin.resolvedTickets", value: resolvedTickets },
          { labelKey: "admin.totalRevenue", value: formatMoney(revenueAgg._sum.amount ?? 0, locale) },
          { labelKey: "admin.activeContracts", value: activeContracts },
          { labelKey: "admin.activeAssets", value: activeAssets },
          { labelKey: "admin.subscriptions", value: activeSubscriptions },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <MiniChart titleKey="admin.ticketsByStatus" data={statusData} />
        <MiniChart titleKey="admin.ticketsByPriority" data={priorityData} />
      </div>
      {canAccessSuperAdmin && (
        <SectionCard titleKey="nav.superAdmin" descriptionKey="superAdmin.dashboard">
          <Button nativeButton={false} variant="outline" render={<Link href="/super-admin" />}>
            {t.actions.open}
          </Button>
        </SectionCard>
      )}
    </div>
  );
}
