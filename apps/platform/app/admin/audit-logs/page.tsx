import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDateTime } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminAuditLogsPage() {
  await requirePermission("audit.view", "admin");
  const [items, total, locale] = await Promise.all([
    prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.auditLog.count(),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.auditLogs"
      stats={[{ labelKey: "sections.records", value: total }]}
      rows={items}
      columns={[
        { key: "actor", headerKey: "common.agent", cell: (row) => row.actor?.name ?? row.actor?.email ?? "—" },
        { key: "action", headerKey: "common.actions", cell: (row) => row.action },
        { key: "entity", headerKey: "forms.category", cell: (row) => row.entity ?? "—" },
        { key: "entityId", headerKey: "forms.code", cell: (row) => row.entityId ?? "—" },
        { key: "details", headerKey: "common.description", cell: (row) => row.details ?? "—" },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDateTime(row.createdAt, locale) },
      ]}
    />
  );
}
