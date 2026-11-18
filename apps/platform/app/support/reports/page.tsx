import { TicketStatus } from "@prisma/client";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { DetailsGrid } from "@/components/workspace/details-grid";
import { MiniChart } from "@/components/workspace/mini-chart";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatGrid } from "@/components/workspace/stat-grid";
import { prisma } from "@/lib/db";
import { getServerDictionary } from "@/lib/server-i18n";

const openStatuses: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_FOR_CUSTOMER,
];

export default async function SupportReportsPage() {
  const t = await getServerDictionary();
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [total, open, urgent, resolvedToday, byStatus, byPriority, byAssignee, agents, demoTickets, slaPolicy] =
    await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: { in: openStatuses } } }),
      prisma.supportTicket.count({ where: { priority: "CRITICAL" } }),
      prisma.supportTicket.count({ where: { resolvedAt: { gte: startOfToday, lte: now } } }),
      prisma.supportTicket.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.supportTicket.groupBy({ by: ["priority"], _count: { _all: true } }),
      prisma.supportTicket.groupBy({ by: ["assignedToId"], _count: { _all: true } }),
      prisma.user.findMany({
        where: { role: { in: ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"] } },
        orderBy: { name: "asc" },
      }),
      prisma.supportTicket.count({ where: { id: { startsWith: "demo_" } } }),
      prisma.sLAPolicy.findFirst({
        where: { isActive: true },
        orderBy: { resolutionMinutes: "asc" },
      }),
    ]);

  const statusLabels = t.statuses as Record<string, string>;
  const priorityLabels = t.priorities as Record<string, string>;
  const agentLabels = new Map(agents.map((agent) => [agent.id, agent.name ?? agent.email]));

  return (
    <div className="space-y-6">
      <PageHeader titleKey="support.reports" />

      {demoTickets > 0 && <DemoNotice />}

      <StatGrid
        items={[
          { labelKey: "admin.totalTickets", value: total },
          { labelKey: "admin.openTickets", value: open },
          { labelKey: "admin.urgentTickets", value: urgent },
          { labelKey: "support.resolvedToday", value: resolvedToday },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <MiniChart
          titleKey="admin.ticketsByStatus"
          data={byStatus.map((row) => ({
            label: statusLabels[row.status] ?? row.status,
            value: row._count._all,
          }))}
        />
        <MiniChart
          titleKey="admin.ticketsByPriority"
          data={byPriority.map((row) => ({
            label: priorityLabels[row.priority] ?? row.priority,
            value: row._count._all,
          }))}
        />
      </div>

      <MiniChart
        titleKey="reports.agentWorkload"
        data={byAssignee.map((row) => ({
          label: row.assignedToId
            ? agentLabels.get(row.assignedToId) ?? t.common.agent
            : t.common.assignee,
          value: row._count._all,
        }))}
      />

      <SectionCard titleKey="reports.slaPerformance" descriptionKey="sections.configuration">
        {slaPolicy ? (
          <DetailsGrid
            items={[
              { labelKey: "forms.name", value: slaPolicy.name },
              { labelKey: "support.slaTarget", value: slaPolicy.responseMinutes },
              { labelKey: "support.resolutionTarget", value: slaPolicy.resolutionMinutes },
              {
                labelKey: "common.status",
                value: slaPolicy.isActive ? t.common.active : t.common.inactive,
              },
            ]}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{t.common.noData}</p>
        )}
      </SectionCard>
    </div>
  );
}
