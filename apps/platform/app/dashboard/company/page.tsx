import { DataTable, type Column } from "@/components/workspace/data-table";
import { DetailsGrid, type DetailItem } from "@/components/workspace/details-grid";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { prisma } from "@/lib/db";
import { getServerDictionary } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";

type MembershipRow = {
  id: string;
  organizationName: string;
  role: string;
};

export default async function CompanyPage() {
  const { session, profile } = await requireCustomerProfile();
  const t = await getServerDictionary();
  const location = [profile.address, profile.city, profile.country].filter(Boolean).join(", ");

  const memberships = await prisma.organizationMembership.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { organization: { select: { name: true } } },
  });

  const rows: MembershipRow[] = memberships.map((membership) => ({
    id: membership.id,
    organizationName: membership.organization.name,
    role: membership.role,
  }));

  const details: DetailItem[] = [
    { labelKey: "forms.company", value: profile.company ?? "—" },
    { labelKey: "forms.location", value: location || "—" },
  ];

  const columns: Column<MembershipRow>[] = [
    { key: "organization", headerKey: "common.organization", cell: (row) => row.organizationName },
    { key: "role", headerKey: "forms.role", cell: (row) => row.role },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.company" descriptionKey="sections.companyDetails" />
      <SectionCard titleKey="sections.companyDetails">
        <DetailsGrid items={details} />
      </SectionCard>
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground dark:text-white">{t.sections.members}</h2>
        <DataTable rows={rows} columns={columns} emptyKey="common.noData" />
      </div>
    </div>
  );
}
