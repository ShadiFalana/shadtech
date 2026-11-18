import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { StatusBadge } from "@/components/workspace/status-badge";
import { formatDate } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminSubscriptionsPage() {
  await requirePermission("customers.view", "admin");
  const [items, total, active, locale] = await Promise.all([
    prisma.subscription.findMany({
      include: { plan: true, customer: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.subscriptions"
      stats={[
        { labelKey: "sections.records", value: total },
        { labelKey: "statuses.ACTIVE", value: active },
      ]}
      rows={items}
      columns={[
        { key: "plan", headerKey: "admin.plans", cell: (row) => row.plan.name },
        {
          key: "customer",
          headerKey: "common.customer",
          cell: (row) => row.customer.user.name ?? row.customer.user.email,
        },
        { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
        { key: "period", headerKey: "forms.category", cell: (row) => row.period },
        { key: "startDate", headerKey: "forms.startDate", cell: (row) => formatDate(row.startDate, locale) },
        { key: "endDate", headerKey: "forms.endDate", cell: (row) => formatDate(row.endDate, locale) },
      ]}
    />
  );
}
