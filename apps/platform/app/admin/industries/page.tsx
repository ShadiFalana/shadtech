import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createIndustry, deleteIndustry } from "@/actions/admin-industries";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDate } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminIndustriesPage() {
  await requirePermission("content.manage", "admin");
  const [items, total, locale] = await Promise.all([
    prisma.industry.findMany({ orderBy: { order: "asc" } }),
    prisma.industry.count(),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.industries"
      stats={[{ labelKey: "sections.records", value: total }]}
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createIndustry}
          fields={[
            { name: "name", labelKey: "forms.name", required: true },
            { name: "slug", labelKey: "forms.code", required: true },
            { name: "description", labelKey: "forms.description", textarea: true, required: true },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "name", headerKey: "forms.name", cell: (row) => row.name },
        { key: "description", headerKey: "forms.description", cell: (row) => row.description },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deleteIndustry} id={row.id} /> },
      ]}
    />
  );
}
