import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createPartner, deletePartner } from "@/actions/admin-partners";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { getServerDictionary } from "@/lib/server-i18n";

export default async function AdminPartnersPage() {
  await requirePermission("content.manage", "admin");
  const [items, total, t] = await Promise.all([
    prisma.partner.findMany({ orderBy: { order: "asc" } }),
    prisma.partner.count(),
    getServerDictionary(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.partners"
      stats={[{ labelKey: "sections.records", value: total }]}
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createPartner}
          fields={[
            { name: "name", labelKey: "forms.name", required: true },
            { name: "category", labelKey: "forms.category" },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "name", headerKey: "forms.name", cell: (row) => row.name },
        { key: "category", headerKey: "forms.category", cell: (row) => row.category ?? "—" },
        {
          key: "status",
          headerKey: "common.status",
          cell: (row) => (row.isActive ? t.common.active : t.common.inactive),
        },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deletePartner} id={row.id} /> },
      ]}
    />
  );
}
