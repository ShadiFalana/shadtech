import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createChange, deleteChange } from "@/actions/admin-itsm";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { StatusBadge } from "@/components/workspace/status-badge";
import { formatDate } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminChangesPage() {
  await requirePermission("tickets.view", "admin");
  const [items, total, locale] = await Promise.all([
    prisma.changeRequest.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.changeRequest.count(),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.changes"
      stats={[{ labelKey: "sections.records", value: total }]}
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createChange}
          fields={[
            { name: "title", labelKey: "forms.title", required: true },
            { name: "description", labelKey: "forms.description", textarea: true, required: true },
            { name: "risk", labelKey: "common.priority", defaultValue: "LOW" },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "title", headerKey: "forms.title", cell: (row) => row.title },
        { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
        { key: "risk", headerKey: "common.priority", cell: (row) => <StatusBadge value={row.risk} kind="priority" /> },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deleteChange} id={row.id} /> },
      ]}
    />
  );
}
