import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { DataTable } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatGrid } from "@/components/workspace/stat-grid";

export default async function AdminCmdbPage() {
  await requirePermission("assets.manage", "admin");
  const [items, relations, itemCount, relationCount] = await Promise.all([
    prisma.configurationItem.findMany({ include: { owner: true }, orderBy: { createdAt: "desc" } }),
    prisma.cIRelation.findMany({ include: { from: true, to: true }, orderBy: { type: "asc" } }),
    prisma.configurationItem.count(),
    prisma.cIRelation.count(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader titleKey="admin.cmdb" />
      <StatGrid
        items={[
          { labelKey: "sections.records", value: itemCount },
          { labelKey: "sections.dependencies", value: relationCount },
        ]}
      />
      <SectionCard titleKey="sections.records">
        <DataTable
          emptyKey="common.noData"
          rows={items}
          columns={[
            { key: "name", headerKey: "forms.name", cell: (row) => row.name },
            { key: "type", headerKey: "common.category", cell: (row) => row.type },
            { key: "status", headerKey: "common.status", cell: (row) => row.status },
            { key: "owner", headerKey: "common.agent", cell: (row) => row.owner?.name ?? row.owner?.email ?? "—" },
            { key: "location", headerKey: "forms.location", cell: (row) => row.location ?? "—" },
          ]}
        />
      </SectionCard>
      <SectionCard titleKey="sections.dependencies">
        <DataTable
          emptyKey="common.noData"
          rows={relations}
          columns={[
            { key: "from", headerKey: "common.from", cell: (row) => row.from.name },
            { key: "to", headerKey: "common.to", cell: (row) => row.to.name },
            { key: "type", headerKey: "forms.category", cell: (row) => row.type },
          ]}
        />
      </SectionCard>
    </div>
  );
}
