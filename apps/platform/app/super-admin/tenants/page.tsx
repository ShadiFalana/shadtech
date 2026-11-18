import { requirePermission } from "@/lib/session";
import { ActiveBadge, DemoBadge } from "@/components/super-admin/badges";
import { CreateTenantForm, TenantActions } from "@/components/super-admin/platform-forms";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { DetailsGrid } from "@/components/workspace/details-grid";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: { memberships: number };
};

export default async function SuperAdminTenantsPage() {
  await requirePermission("tenants.manage", "admin");
  const locale = await getServerLocale();
  const t = await getServerDictionary();

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { memberships: true } } },
  });

  const hasDemoRecords = organizations.some((org) => org.id.startsWith("demo_"));

  const columns: Column<TenantRow>[] = [
    {
      key: "name",
      headerKey: "forms.name",
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{row.name}</span>
            {row.id.startsWith("demo_") && <DemoBadge />}
          </div>
          {row.domain && <p className="text-xs text-muted-foreground">{row.domain}</p>}
        </div>
      ),
    },
    {
      key: "slug",
      headerKey: "forms.code",
      cell: (row) => <code className="text-xs text-muted-foreground">{row.slug}</code>,
    },
    {
      key: "members",
      headerKey: "sections.members",
      cell: (row) => <span className="tabular-nums">{row._count.memberships}</span>,
    },
    {
      key: "isActive",
      headerKey: "common.status",
      cell: (row) => <ActiveBadge active={row.isActive} />,
    },
    {
      key: "createdAt",
      headerKey: "common.createdAt",
      cell: (row) => formatDate(row.createdAt, locale),
    },
    {
      key: "actions",
      headerKey: "common.actions",
      cell: (row) => (
        <TenantActions
          id={row.id}
          name={row.name}
          slug={row.slug}
          domain={row.domain}
          isActive={row.isActive}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="superAdmin.tenants" />
      {hasDemoRecords && <DemoNotice />}
      <SectionCard titleKey="superAdmin.createTenant" descriptionKey="sections.configuration">
        <CreateTenantForm />
      </SectionCard>
      <DataTable rows={organizations} columns={columns} />
      <SectionCard titleKey="unavailable.title" descriptionKey="unavailable.description">
        <DetailsGrid
          items={[
            { labelKey: "sections.billing", value: t.unavailable.title },
            { labelKey: "sections.usage", value: t.unavailable.title },
          ]}
        />
      </SectionCard>
    </div>
  );
}
