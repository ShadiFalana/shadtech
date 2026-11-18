import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createProblem, deleteProblem } from "@/actions/admin-itsm";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { StatusBadge } from "@/components/workspace/status-badge";
import { formatDate } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminProblemsPage() {
  await requirePermission("tickets.view", "admin");
  const [items, total, open, locale] = await Promise.all([
    prisma.problem.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.problem.count(),
    prisma.problem.count({ where: { status: "OPEN" } }),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.problems"
      stats={[
        { labelKey: "sections.records", value: total },
        { labelKey: "admin.openTickets", value: open },
      ]}
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createProblem}
          fields={[
            { name: "title", labelKey: "forms.title", required: true },
            { name: "description", labelKey: "forms.description", textarea: true, required: true },
            { name: "priority", labelKey: "forms.priority", defaultValue: "MEDIUM" },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "title", headerKey: "forms.title", cell: (row) => row.title },
        { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
        {
          key: "priority",
          headerKey: "common.priority",
          cell: (row) => <StatusBadge value={row.priority} kind="priority" />,
        },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deleteProblem} id={row.id} /> },
      ]}
    />
  );
}
