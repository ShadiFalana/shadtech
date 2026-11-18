import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { StatusBadge } from "@/components/workspace/status-badge";
import { formatDate, formatMoney } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminContractsPage() {
  await requirePermission("customers.view", "admin");
  const [items, total, active, locale] = await Promise.all([
    prisma.contract.findMany({
      include: { customer: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contract.count(),
    prisma.contract.count({ where: { status: "ACTIVE" } }),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.contracts"
      stats={[
        { labelKey: "sections.records", value: total },
        { labelKey: "admin.activeContracts", value: active },
      ]}
      rows={items}
      columns={[
        { key: "number", headerKey: "common.number", cell: (row) => row.number },
        { key: "title", headerKey: "forms.title", cell: (row) => row.title },
        {
          key: "customer",
          headerKey: "common.customer",
          cell: (row) => row.customer.user.name ?? row.customer.user.email,
        },
        { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
        { key: "value", headerKey: "common.amount", cell: (row) => formatMoney(row.value, locale, row.currency) },
        { key: "startDate", headerKey: "forms.startDate", cell: (row) => formatDate(row.startDate, locale) },
        { key: "endDate", headerKey: "forms.endDate", cell: (row) => formatDate(row.endDate, locale) },
      ]}
    />
  );
}
