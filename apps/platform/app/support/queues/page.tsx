import { TicketStatus } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { MiniChart } from "@/components/workspace/mini-chart";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { getServerDictionary } from "@/lib/server-i18n";

type QueueRow = {
  status: TicketStatus;
  count: number;
};

export default async function SupportQueuesPage() {
  const t = await getServerDictionary();
  const [byStatus, byPriority, demoTickets] = await Promise.all([
    prisma.supportTicket.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.supportTicket.groupBy({ by: ["priority"], _count: { _all: true } }),
    prisma.supportTicket.count({ where: { id: { startsWith: "demo_" } } }),
  ]);

  const countForStatus = new Map(byStatus.map((row) => [row.status, row._count._all]));
  const rows: QueueRow[] = Object.values(TicketStatus).map((status) => ({
    status,
    count: countForStatus.get(status) ?? 0,
  }));

  const priorityLabels = t.priorities as Record<string, string>;

  const columns: Column<QueueRow>[] = [
    {
      key: "status",
      headerKey: "common.status",
      cell: (row) => <StatusBadge value={row.status} />,
    },
    { key: "count", headerKey: "sections.results", cell: (row) => row.count },
    {
      key: "actions",
      headerKey: "common.actions",
      cell: (row) => (
        <Button
          nativeButton={false}
          render={<Link href={`/support/tickets?status=${row.status}`} />}
          variant="outline"
          size="sm"
        >
          {t.common.view}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="support.queues">
        <Button nativeButton={false} render={<Link href="/support/tickets" />}>
          {t.support.tickets}
        </Button>
      </PageHeader>

      {demoTickets > 0 && <DemoNotice />}

      <SectionCard titleKey="sections.results">
        <DataTable rows={rows} columns={columns} emptyKey="common.noData" />
      </SectionCard>

      <MiniChart
        titleKey="admin.ticketsByPriority"
        data={byPriority.map((row) => ({
          label: priorityLabels[row.priority] ?? row.priority,
          value: row._count._all,
        }))}
      />
    </div>
  );
}
