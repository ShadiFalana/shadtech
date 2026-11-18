import { requirePermission } from "@/lib/session";
import { DemoBadge } from "@/components/super-admin/badges";
import { CreateSubscriptionForm, SubscriptionActions } from "@/components/super-admin/platform-forms";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { DetailsGrid } from "@/components/workspace/details-grid";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

type SubscriptionRow = {
  id: string;
  status: string;
  period: string;
  startDate: Date;
  endDate: Date | null;
  customer: {
    company: string | null;
    user: { name: string | null; email: string };
  };
  plan: { name: string };
};

export default async function SuperAdminSubscriptionsPage() {
  await requirePermission("superAdmin.access", "admin");
  const locale = await getServerLocale();
  const t = await getServerDictionary();

  const [subscriptions, customers, plans] = await Promise.all([
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { include: { user: { select: { name: true, email: true } } } },
        plan: { select: { name: true } },
      },
    }),
    prisma.customerProfile.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, company: true, user: { select: { name: true, email: true } } },
    }),
    prisma.subscriptionPlan.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const hasDemoRecords = subscriptions.some((row) => row.id.startsWith("demo_"));

  const customerOptions = customers.map((customer) => ({
    id: customer.id,
    label: customer.company ?? customer.user.name ?? customer.user.email,
  }));
  const planOptions = plans.map((plan) => ({ id: plan.id, label: plan.name }));

  const columns: Column<SubscriptionRow>[] = [
    {
      key: "customer",
      headerKey: "forms.customer",
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {row.customer.company ?? row.customer.user.name ?? row.customer.user.email}
            </span>
            {row.id.startsWith("demo_") && <DemoBadge />}
          </div>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {row.customer.user.email}
          </p>
        </div>
      ),
    },
    { key: "plan", headerKey: "superAdmin.plans", cell: (row) => row.plan.name },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
    { key: "period", headerKey: "sections.billing", cell: (row) => <span className="text-xs">{row.period}</span> },
    { key: "startDate", headerKey: "forms.startDate", cell: (row) => formatDate(row.startDate, locale) },
    { key: "endDate", headerKey: "forms.endDate", cell: (row) => formatDate(row.endDate, locale) },
    {
      key: "actions",
      headerKey: "common.actions",
      cell: (row) => (
        <SubscriptionActions id={row.id} status={row.status} period={row.period} endDate={row.endDate} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="superAdmin.subscriptions" />
      {hasDemoRecords && <DemoNotice />}
      <SectionCard titleKey="actions.createRecord" descriptionKey="sections.configuration">
        <CreateSubscriptionForm customers={customerOptions} plans={planOptions} />
      </SectionCard>
      <DataTable rows={subscriptions} columns={columns} />
      <SectionCard titleKey="unavailable.title" descriptionKey="unavailable.description">
        <DetailsGrid items={[{ labelKey: "sections.billing", value: t.unavailable.title }]} />
      </SectionCard>
    </div>
  );
}
