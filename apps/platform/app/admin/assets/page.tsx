import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createAsset, deleteAsset } from "@/actions/admin-assets";
import { AdminDeleteForm, AdminForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { StatusBadge } from "@/components/workspace/status-badge";
import { formatDate } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminAssetsPage() {
  await requirePermission("assets.manage", "admin");
  const [items, total, inUse, locale] = await Promise.all([
    prisma.asset.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.asset.count(),
    prisma.asset.count({ where: { status: "IN_USE" } }),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.assets"
      stats={[
        { labelKey: "sections.records", value: total },
        { labelKey: "admin.activeAssets", value: inUse },
      ]}
      emptyKey="empty.assets"
      formTitleKey="actions.createRecord"
      form={
        <AdminForm
          action={createAsset}
          fields={[
            { name: "assetTag", labelKey: "forms.code", required: true },
            { name: "name", labelKey: "forms.name", required: true },
            { name: "type", labelKey: "common.category", required: true },
            { name: "status", labelKey: "forms.status", defaultValue: "RECEIVED" },
          ]}
        />
      }
      rows={items}
      columns={[
        { key: "assetTag", headerKey: "forms.code", cell: (row) => row.assetTag },
        { key: "name", headerKey: "forms.name", cell: (row) => row.name },
        { key: "type", headerKey: "common.category", cell: (row) => row.type },
        { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
        { key: "actions", headerKey: "common.actions", cell: (row) => <AdminDeleteForm action={deleteAsset} id={row.id} /> },
      ]}
    />
  );
}
