import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createPlan, deletePlan } from "@/actions/admin-plans";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { Badge } from "@/components/ui/badge";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { formatMoney } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

export default async function AdminPlansPage() {
  await requirePermission("settings.manage", "admin");
  const [plans, t, locale] = await Promise.all([
    prisma.subscriptionPlan.findMany({ orderBy: { priceMonthly: "asc" } }),
    getServerDictionary(),
    getServerLocale(),
  ]);

  return (
    <div className="space-y-6">
      <DemoNotice />
      <AdminResourcePage
        titleKey="admin.plans"
        descriptionKey="public.pricingSubtitle"
        stats={[{ labelKey: "sections.records", value: plans.length }]}
        formTitleKey="actions.createRecord"
        form={
          <AdminForm
            action={createPlan}
            fields={[
              { name: "name", labelKey: "forms.name", required: true },
              { name: "slug", labelKey: "forms.code", required: true },
              { name: "description", labelKey: "forms.description", textarea: true },
              { name: "priceMonthly", labelKey: "forms.value", type: "number", min: 0, step: 0.01, required: true },
              { name: "priceYearly", labelKey: "common.amount", type: "number", min: 0, step: 0.01, required: true },
              { name: "isActive", labelKey: "common.active", checkbox: true, defaultValue: "true" },
            ]}
          />
        }
        rows={plans}
        columns={[
          {
            key: "name",
            headerKey: "forms.name",
            cell: (row) => (
              <div className="space-y-1">
                <span>{row.name}</span>
                {!row.isActive && (
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">{t.common.demo}</Badge>
                    <Badge variant="outline">{t.common.inactive}</Badge>
                  </div>
                )}
              </div>
            ),
          },
          { key: "monthly", headerKey: "forms.value", cell: (row) => formatMoney(row.priceMonthly, locale, row.currency) },
          { key: "yearly", headerKey: "common.amount", cell: (row) => formatMoney(row.priceYearly, locale, row.currency) },
          {
            key: "status",
            headerKey: "common.status",
            cell: (row) => (row.isActive ? t.common.active : t.common.inactive),
          },
          { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deletePlan} id={row.id} /> },
        ]}
      />
    </div>
  );
}
