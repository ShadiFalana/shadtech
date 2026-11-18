import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDate, formatMoney } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminOpportunitiesPage() {
  await requirePermission("customers.view", "admin");
  const [items, total, locale] = await Promise.all([
    prisma.opportunity.findMany({
      include: { customer: { include: { user: true } }, owner: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.opportunity.count(),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.opportunities"
      stats={[{ labelKey: "sections.records", value: total }]}
      rows={items}
      columns={[
        { key: "name", headerKey: "forms.name", cell: (row) => row.name },
        { key: "value", headerKey: "forms.value", cell: (row) => formatMoney(row.value, locale) },
        { key: "stage", headerKey: "common.status", cell: (row) => row.stage },
        {
          key: "customer",
          headerKey: "common.customer",
          cell: (row) => row.customer?.user.name ?? row.customer?.user.email ?? "—",
        },
        {
          key: "owner",
          headerKey: "common.assignee",
          cell: (row) => row.owner?.name ?? row.owner?.email ?? "—",
        },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
      ]}
    />
  );
}
