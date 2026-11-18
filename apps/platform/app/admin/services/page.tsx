import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createService, deleteService, toggleService } from "@/actions/admin-services";
import { AdminActionForm, AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { getServerDictionary } from "@/lib/server-i18n";

export default async function AdminServicesPage() {
  await requirePermission("content.manage", "admin");
  const [items, total, t] = await Promise.all([
    prisma.service.findMany({ orderBy: { order: "asc" } }),
    prisma.service.count(),
    getServerDictionary(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.services"
      stats={[{ labelKey: "sections.records", value: total }]}
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createService}
          fields={[
            { name: "name", labelKey: "forms.name", required: true },
            { name: "slug", labelKey: "forms.code", required: true },
            { name: "description", labelKey: "forms.description", textarea: true, required: true },
            { name: "isActive", labelKey: "common.active", checkbox: true, defaultValue: "true" },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "name", headerKey: "forms.name", cell: (row) => row.name },
        { key: "slug", headerKey: "forms.code", cell: (row) => row.slug },
        {
          key: "status",
          headerKey: "common.status",
          cell: (row) => (row.isActive ? t.common.active : t.common.inactive),
        },
        {
          key: "actions",
          headerKey: "common.actions",
          cell: (row) => (
            <div className="flex flex-wrap gap-2">
              <AdminActionForm action={toggleService} id={row.id} labelKey="support.changeStatus" />
              <AdminDeleteForm action={deleteService} id={row.id} />
            </div>
          ),
        },
      ]}
    />
  );
}
