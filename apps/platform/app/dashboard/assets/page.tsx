import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";

type AssetRow = {
  id: string;
  name: string;
  assetTag: string;
  type: string;
  status: string;
  warrantyExpires: Date | null;
  location: string | null;
};

export default async function AssetsPage() {
  const { profile } = await requireCustomerProfile();
  const locale = await getServerLocale();

  const assets = await prisma.asset.findMany({
    where: { customerId: profile.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      assetTag: true,
      type: true,
      status: true,
      warrantyExpires: true,
      location: true,
    },
  });

  const columns: Column<AssetRow>[] = [
    { key: "name", headerKey: "forms.name", cell: (row) => <span className="font-medium">{row.name}</span> },
    { key: "assetTag", headerKey: "common.number", cell: (row) => row.assetTag },
    { key: "type", headerKey: "common.category", cell: (row) => row.type },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
    { key: "warrantyExpires", headerKey: "forms.endDate", cell: (row) => formatDate(row.warrantyExpires, locale) },
    { key: "location", headerKey: "forms.location", cell: (row) => row.location ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.assets" />
      <DataTable rows={assets} columns={columns} emptyKey="empty.assets" />
    </div>
  );
}
