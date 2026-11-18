import { requirePermission } from "@/lib/session";
import { DemoBadge } from "@/components/super-admin/badges";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { PageHeader } from "@/components/workspace/page-header";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

type AuditRow = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: string | null;
  createdAt: Date;
  actor: { name: string | null; email: string } | null;
};

export default async function SuperAdminAuditPage() {
  await requirePermission("audit.view", "admin");
  const locale = await getServerLocale();

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { name: true, email: true } } },
  });

  const hasDemoRecords = logs.some((row) => row.id.startsWith("demo_"));

  const columns: Column<AuditRow>[] = [
    {
      key: "createdAt",
      headerKey: "common.createdAt",
      cell: (row) => <span className="whitespace-nowrap text-xs">{formatDateTime(row.createdAt, locale)}</span>,
    },
    {
      key: "actor",
      headerKey: "forms.name",
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span>{row.actor?.name ?? row.actor?.email ?? "—"}</span>
            {row.id.startsWith("demo_") && <DemoBadge />}
          </div>
          {row.actor && (
            <p className="text-xs text-muted-foreground" dir="ltr">
              {row.actor.email}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "action",
      headerKey: "common.actions",
      cell: (row) => <code className="text-xs">{row.action}</code>,
    },
    {
      key: "entity",
      headerKey: "sections.details",
      cell: (row) => (
        <div className="text-xs">
          <p>{row.entity ?? "—"}</p>
          {row.entityId && <p className="text-muted-foreground">{row.entityId}</p>}
        </div>
      ),
    },
    {
      key: "details",
      headerKey: "common.description",
      cell: (row) => <p className="max-w-md text-xs text-muted-foreground">{row.details ?? "—"}</p>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="superAdmin.auditLogs" descriptionKey="sections.history" />
      {hasDemoRecords && <DemoNotice />}
      <DataTable rows={logs} columns={columns} />
    </div>
  );
}
