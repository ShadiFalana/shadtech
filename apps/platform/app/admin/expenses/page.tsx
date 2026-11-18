import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { StatusBadge } from "@/components/workspace/status-badge";
import { formatDate, formatMoney } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminExpensesPage() {
  await requirePermission("customers.view", "admin");
  const [items, total, pending, locale] = await Promise.all([
    prisma.expense.findMany({ include: { recordedBy: true }, orderBy: { expenseDate: "desc" } }),
    prisma.expense.count(),
    prisma.expense.count({ where: { status: "PENDING" } }),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.expenses"
      stats={[
        { labelKey: "sections.records", value: total },
        { labelKey: "statuses.PENDING", value: pending },
      ]}
      rows={items}
      columns={[
        { key: "description", headerKey: "common.description", cell: (row) => row.description },
        { key: "amount", headerKey: "common.amount", cell: (row) => formatMoney(row.amount, locale, row.currency) },
        { key: "category", headerKey: "forms.category", cell: (row) => row.category ?? "—" },
        { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
        { key: "date", headerKey: "common.createdAt", cell: (row) => formatDate(row.expenseDate, locale) },
        { key: "recordedBy", headerKey: "common.agent", cell: (row) => row.recordedBy?.name ?? row.recordedBy?.email ?? "—" },
      ]}
    />
  );
}
