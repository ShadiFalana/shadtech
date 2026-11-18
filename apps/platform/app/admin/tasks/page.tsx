import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { StatusBadge } from "@/components/workspace/status-badge";
import { formatDate } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminTasksPage() {
  await requirePermission("customers.view", "admin");
  const [items, total, locale] = await Promise.all([
    prisma.task.findMany({
      include: { project: true, assignee: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.count(),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.tasks"
      stats={[{ labelKey: "sections.records", value: total }]}
      rows={items}
      columns={[
        { key: "title", headerKey: "forms.title", cell: (row) => row.title },
        { key: "status", headerKey: "common.status", cell: (row) => row.status },
        {
          key: "priority",
          headerKey: "common.priority",
          cell: (row) => <StatusBadge value={row.priority} kind="priority" />,
        },
        { key: "project", headerKey: "admin.projects", cell: (row) => row.project?.name ?? "—" },
        { key: "assignee", headerKey: "common.assignee", cell: (row) => row.assignee?.name ?? row.assignee?.email ?? "—" },
        { key: "dueDate", headerKey: "common.dueDate", cell: (row) => formatDate(row.dueDate, locale) },
      ]}
    />
  );
}
