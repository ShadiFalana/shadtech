import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { getServerDictionary } from "@/lib/server-i18n";

export default async function AdminWorkflowsPage() {
  await requirePermission("content.manage", "admin");
  const [items, t] = await Promise.all([
    prisma.workflow.findMany({ orderBy: { createdAt: "desc" } }),
    getServerDictionary(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.workflows"
      stats={[{ labelKey: "sections.records", value: items.length }]}
      rows={items}
      columns={[
        { key: "name", headerKey: "forms.name", cell: (row) => row.name },
        { key: "trigger", headerKey: "forms.trigger", cell: (row) => row.trigger },
        { key: "conditions", headerKey: "forms.conditions", cell: (row) => row.conditions ?? "—" },
        { key: "actions", headerKey: "forms.actions", cell: (row) => row.actions ?? "—" },
        {
          key: "status",
          headerKey: "common.status",
          cell: (row) => (row.isEnabled ? t.common.active : t.common.inactive),
        },
      ]}
    />
  );
}
