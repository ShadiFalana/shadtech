import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";

type SubscriptionRow = {
  id: string;
  planName: string;
  status: string;
  period: string;
  price: number;
  currency: string;
  endDate: Date | null;
  autoRenew: boolean;
};

export default async function SubscriptionsPage() {
  const { profile } = await requireCustomerProfile();
  const locale = await getServerLocale();
  const t = await getServerDictionary();

  const subscriptions = await prisma.subscription.findMany({
    where: { customerId: profile.id },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });

  const rows: SubscriptionRow[] = subscriptions.map((subscription) => ({
    id: subscription.id,
    planName: subscription.plan.name,
    status: subscription.status,
    period: subscription.period,
    price: subscription.period === "YEARLY" ? subscription.plan.priceYearly : subscription.plan.priceMonthly,
    currency: subscription.plan.currency,
    endDate: subscription.endDate,
    autoRenew: subscription.autoRenew,
  }));

  const columns: Column<SubscriptionRow>[] = [
    { key: "plan", headerKey: "forms.name", cell: (row) => <span className="font-medium">{row.planName}</span> },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
    { key: "period", headerKey: "sections.billing", cell: (row) => row.period },
    { key: "price", headerKey: "common.amount", cell: (row) => formatMoney(row.price, locale, row.currency) },
    { key: "endDate", headerKey: "forms.endDate", cell: (row) => formatDate(row.endDate, locale) },
    { key: "autoRenew", headerKey: "common.active", cell: (row) => (row.autoRenew ? t.common.yes : t.common.no) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.subscriptions" />
      <DataTable rows={rows} columns={columns} emptyKey="common.noData" />
    </div>
  );
}
