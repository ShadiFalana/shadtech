import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDate, formatMoney } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminQuotationsPage() {
  await requirePermission("customers.view", "admin");
  const [items, total, locale] = await Promise.all([
    prisma.quotation.findMany({
      include: { customer: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quotation.count(),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.quotes"
      stats={[{ labelKey: "sections.records", value: total }]}
      rows={items}
      columns={[
        { key: "number", headerKey: "common.number", cell: (row) => row.number },
        {
          key: "customer",
          headerKey: "common.customer",
          cell: (row) => row.customer?.user.name ?? row.customer?.user.email ?? "—",
        },
        { key: "total", headerKey: "common.amount", cell: (row) => formatMoney(row.total, locale) },
        { key: "status", headerKey: "common.status", cell: (row) => row.status },
        { key: "validUntil", headerKey: "common.dueDate", cell: (row) => formatDate(row.validUntil, locale) },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
      ]}
    />
  );
}
