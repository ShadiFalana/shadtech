import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { StatusBadge } from "@/components/workspace/status-badge";
import { formatDate, formatMoney } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminInvoicesPage() {
  await requirePermission("customers.view", "admin");
  const [items, total, outstanding, locale] = await Promise.all([
    prisma.invoice.findMany({
      include: { customer: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.count(),
    prisma.invoice.count({ where: { status: { in: ["PENDING", "OVERDUE"] } } }),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.invoices"
      stats={[
        { labelKey: "sections.records", value: total },
        { labelKey: "admin.outstandingInvoices", value: outstanding },
      ]}
      emptyKey="empty.invoices"
      rows={items}
      columns={[
        { key: "number", headerKey: "common.number", cell: (row) => row.number },
        {
          key: "customer",
          headerKey: "common.customer",
          cell: (row) => row.customer.user.name ?? row.customer.user.email,
        },
        { key: "amount", headerKey: "common.amount", cell: (row) => formatMoney(row.amount, locale, row.currency) },
        { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
        { key: "dueDate", headerKey: "common.dueDate", cell: (row) => formatDate(row.dueDate, locale) },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
      ]}
    />
  );
}
