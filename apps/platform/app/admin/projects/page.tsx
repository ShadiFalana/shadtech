import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createProject, deleteProject } from "@/actions/admin-projects";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDate } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminProjectsPage() {
  await requirePermission("customers.view", "admin");
  const [items, total, locale] = await Promise.all([
    prisma.project.findMany({ include: { tasks: true }, orderBy: { createdAt: "desc" } }),
    prisma.project.count(),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.projects"
      stats={[{ labelKey: "sections.records", value: total }]}
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createProject}
          fields={[
            { name: "name", labelKey: "forms.name", required: true },
            { name: "description", labelKey: "forms.description", textarea: true },
            { name: "status", labelKey: "forms.status", defaultValue: "ACTIVE" },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "name", headerKey: "forms.name", cell: (row) => row.name },
        { key: "status", headerKey: "common.status", cell: (row) => row.status },
        { key: "tasks", headerKey: "admin.tasks", cell: (row) => row.tasks.length },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deleteProject} id={row.id} /> },
      ]}
    />
  );
}
