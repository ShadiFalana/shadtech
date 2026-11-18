import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createClient, deleteClient } from "@/actions/admin-clients";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { getServerDictionary } from "@/lib/server-i18n";

export default async function AdminClientsPage() {
  await requirePermission("customers.view", "admin");
  const [items, total, t] = await Promise.all([
    prisma.client.findMany({ orderBy: { order: "asc" } }),
    prisma.client.count(),
    getServerDictionary(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.clients"
      stats={[{ labelKey: "sections.records", value: total }]}
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createClient}
          fields={[
            { name: "name", labelKey: "forms.name", required: true },
            { name: "website", labelKey: "forms.fileUrl" },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "name", headerKey: "forms.name", cell: (row) => row.name },
        { key: "website", headerKey: "forms.fileUrl", cell: (row) => row.website ?? "—" },
        {
          key: "status",
          headerKey: "common.status",
          cell: (row) => (row.isActive ? t.common.active : t.common.inactive),
        },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deleteClient} id={row.id} /> },
      ]}
    />
  );
}
