import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

export default async function AdminOrganizationsPage() {
  await requirePermission("customers.view", "admin");
  const [items, total, locale, t] = await Promise.all([
    prisma.organization.findMany({
      include: { memberships: true, locations: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.organization.count(),
    getServerLocale(),
    getServerDictionary(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.organizations"
      stats={[{ labelKey: "sections.records", value: total }]}
      rows={items}
      columns={[
        { key: "name", headerKey: "forms.name", cell: (row) => row.name },
        { key: "domain", headerKey: "common.organization", cell: (row) => row.domain ?? "—" },
        { key: "members", headerKey: "sections.members", cell: (row) => row.memberships.length },
        {
          key: "status",
          headerKey: "common.status",
          cell: (row) => (row.isActive ? t.common.active : t.common.inactive),
        },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
      ]}
    />
  );
}
