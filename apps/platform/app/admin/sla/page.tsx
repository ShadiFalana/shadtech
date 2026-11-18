import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createSLA, deleteSLA } from "@/actions/admin-itsm";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { getServerDictionary } from "@/lib/server-i18n";

export default async function AdminSLAPage() {
  await requirePermission("tickets.view", "admin");
  const [items, t] = await Promise.all([
    prisma.sLAPolicy.findMany({ orderBy: { createdAt: "desc" } }),
    getServerDictionary(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.sla"
      stats={[{ labelKey: "sections.records", value: items.length }]}
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createSLA}
          fields={[
            { name: "name", labelKey: "forms.name", required: true },
            { name: "responseMinutes", labelKey: "support.slaTarget", type: "number", min: 1, required: true },
            { name: "resolutionMinutes", labelKey: "support.resolutionTarget", type: "number", min: 1, required: true },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "name", headerKey: "forms.name", cell: (row) => row.name },
        {
          key: "responseMinutes",
          headerKey: "support.slaTarget",
          cell: (row) => `${row.responseMinutes}`,
        },
        {
          key: "resolutionMinutes",
          headerKey: "support.resolutionTarget",
          cell: (row) => `${row.resolutionMinutes}`,
        },
        {
          key: "status",
          headerKey: "common.status",
          cell: (row) => (row.isActive ? t.common.active : t.common.inactive),
        },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deleteSLA} id={row.id} /> },
      ]}
    />
  );
}
