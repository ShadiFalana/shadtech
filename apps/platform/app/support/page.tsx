import { TicketStatus } from "@prisma/client";
import Link from "next/link";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { MiniChart } from "@/components/workspace/mini-chart";
import { PageHeader } from "@/components/workspace/page-header";
import { StatGrid } from "@/components/workspace/stat-grid";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getServerDictionary } from "@/lib/server-i18n";
import { requireRole } from "@/lib/session";

const openStatuses: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_FOR_CUSTOMER,
];

export default async function SupportDashboardPage() {
  const session = await requireRole(["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"], "staff");
  const t = await getServerDictionary();

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const slaPolicy = await prisma.sLAPolicy.findFirst({
    where: { isActive: true },
    orderBy: { resolutionMinutes: "asc" },
  });
  const overdueCutoff = slaPolicy
    ? new Date(now.getTime() - slaPolicy.resolutionMinutes * 60_000)
    : null;

  const [myOpen, assigned, urgent, waiting, overdue, resolvedToday, workload, demoTickets] =
    await Promise.all([
      prisma.supportTicket.count({
        where: { assignedToId: session.user.id, status: { in: openStatuses } },
      }),
      prisma.supportTicket.count({ where: { assignedToId: session.user.id } }),
      prisma.supportTicket.count({ where: { priority: "CRITICAL" } }),
      prisma.supportTicket.count({ where: { status: TicketStatus.WAITING_FOR_CUSTOMER } }),
      overdueCutoff
        ? prisma.supportTicket.count({
            where: { status: { in: openStatuses }, createdAt: { lt: overdueCutoff } },
          })
        : Promise.resolve(0),
      prisma.supportTicket.count({
        where: { resolvedAt: { gte: startOfToday, lte: now } },
      }),
      prisma.supportTicket.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.supportTicket.count({ where: { id: { startsWith: "demo_" } } }),
    ]);

  const statusLabels = t.statuses as Record<string, string>;
  const chartData = workload.map((row) => ({
    label: statusLabels[row.status] ?? row.status,
    value: row._count._all,
  }));

  return (
    <div className="space-y-6">
      <PageHeader titleKey="support.dashboard">
        <Button nativeButton={false} render={<Link href="/support/tickets" />}>
          {t.support.tickets}
        </Button>
      </PageHeader>

      {demoTickets > 0 && <DemoNotice />}

      <StatGrid
        items={[
          { labelKey: "support.myOpen", value: myOpen },
          { labelKey: "support.assigned", value: assigned },
          { labelKey: "support.urgent", value: urgent },
          { labelKey: "support.waiting", value: waiting },
          {
            labelKey: "support.overdue",
            value: overdue,
            hint: slaPolicy ? `${t.support.sla}: ${slaPolicy.name}` : undefined,
          },
          { labelKey: "support.resolvedToday", value: resolvedToday },
        ]}
      />

      <MiniChart titleKey="support.workload" data={chartData} />
    </div>
  );
}
