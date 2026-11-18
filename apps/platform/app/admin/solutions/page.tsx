import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createSolution, deleteSolution } from "@/actions/admin-solutions";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDate } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminSolutionsPage() {
  await requirePermission("content.manage", "admin");
  const [items, total, locale] = await Promise.all([
    prisma.solution.findMany({ orderBy: { order: "asc" } }),
    prisma.solution.count(),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.solutions"
      stats={[{ labelKey: "sections.records", value: total }]}
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createSolution}
          fields={[
            { name: "title", labelKey: "forms.title", required: true },
            { name: "slug", labelKey: "forms.code", required: true },
            { name: "description", labelKey: "forms.description", textarea: true, required: true },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "title", headerKey: "forms.title", cell: (row) => row.title },
        { key: "description", headerKey: "forms.description", cell: (row) => row.description },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deleteSolution} id={row.id} /> },
      ]}
    />
  );
}
