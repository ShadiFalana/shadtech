import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { StatusBadge } from "@/components/workspace/status-badge";
import { formatDateTime, formatMoney } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminPaymentsPage() {
  await requirePermission("customers.view", "admin");
  const [items, total, successful, locale] = await Promise.all([
    prisma.payment.findMany({
      include: { invoice: { include: { customer: { include: { user: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.count(),
    prisma.payment.count({ where: { status: "SUCCESS" } }),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.payments"
      stats={[
        { labelKey: "sections.records", value: total },
        { labelKey: "statuses.SUCCESS", value: successful },
      ]}
      rows={items}
      columns={[
        { key: "invoice", headerKey: "admin.invoices", cell: (row) => row.invoice.number },
        {
          key: "customer",
          headerKey: "common.customer",
          cell: (row) => row.invoice.customer.user.name ?? row.invoice.customer.user.email,
        },
        { key: "amount", headerKey: "common.amount", cell: (row) => formatMoney(row.amount, locale, row.currency) },
        { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
        { key: "method", headerKey: "forms.category", cell: (row) => row.method ?? "—" },
        { key: "reference", headerKey: "forms.code", cell: (row) => row.reference ?? "—" },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDateTime(row.createdAt, locale) },
      ]}
    />
  );
}
