import { requirePermission } from "@/lib/session";
import { ActiveBadge, DemoBadge } from "@/components/super-admin/badges";
import { CreatePlanForm, PlanActions } from "@/components/super-admin/platform-forms";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

type PlanRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  isActive: boolean;
  maxTickets: number | null;
  maxUsers: number | null;
  features: string[];
  _count: { subscriptions: number };
};

function isDemoPlan(row: PlanRow) {
  return (
    row.id.startsWith("demo_plan_") ||
    row.slug.startsWith("demo-") ||
    (row.priceMonthly === 0 && row.priceYearly === 0)
  );
}

export default async function SuperAdminPlansPage() {
  await requirePermission("superAdmin.access", "admin");
  const locale = await getServerLocale();
  const t = await getServerDictionary();

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: [{ isActive: "desc" }, { priceMonthly: "asc" }],
    include: { _count: { select: { subscriptions: true } } },
  });

  const hasDemoRecords = plans.some(isDemoPlan);

  const columns: Column<PlanRow>[] = [
    {
      key: "name",
      headerKey: "forms.name",
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{row.name}</span>
            {isDemoPlan(row) && <DemoBadge />}
          </div>
          <code className="text-xs text-muted-foreground">{row.slug}</code>
          {row.description && <p className="text-xs text-muted-foreground">{row.description}</p>}
        </div>
      ),
    },
    {
      key: "billing",
      headerKey: "sections.billing",
      cell: (row) => (
        <div className="text-sm tabular-nums">
          <p>{formatMoney(row.priceMonthly, locale, row.currency)}</p>
          <p className="text-xs text-muted-foreground">{formatMoney(row.priceYearly, locale, row.currency)}</p>
        </div>
      ),
    },
    {
      key: "subscriptions",
      headerKey: "superAdmin.subscriptions",
      cell: (row) => <span className="tabular-nums">{row._count.subscriptions}</span>,
    },
    {
      key: "isActive",
      headerKey: "common.status",
      cell: (row) => (
        <div className="space-y-1">
          <ActiveBadge active={row.isActive} />
          {isDemoPlan(row) && <p className="text-xs text-muted-foreground">{t.public.noPublishedPlans}</p>}
        </div>
      ),
    },
    {
      key: "actions",
      headerKey: "common.actions",
      cell: (row) => (
        <PlanActions
          id={row.id}
          name={row.name}
          slug={row.slug}
          description={row.description}
          priceMonthly={row.priceMonthly}
          priceYearly={row.priceYearly}
          maxTickets={row.maxTickets}
          maxUsers={row.maxUsers}
          features={row.features}
          isActive={row.isActive}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="superAdmin.plans" descriptionKey="public.pricingSubtitle" />
      {hasDemoRecords && <DemoNotice />}
      <SectionCard titleKey="actions.createRecord" descriptionKey="sections.configuration">
        <CreatePlanForm />
      </SectionCard>
      <DataTable rows={plans} columns={columns} />
    </div>
  );
}
