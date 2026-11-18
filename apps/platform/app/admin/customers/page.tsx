import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDate } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminCustomersPage() {
  await requirePermission("customers.view", "admin");
  const [customers, locale] = await Promise.all([
    prisma.customerProfile.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } }),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.customers"
      emptyKey="empty.customers"
      rows={customers}
      columns={[
        {
          key: "name",
          headerKey: "common.customer",
          cell: (row) => row.user.name ?? row.user.email,
        },
        { key: "email", headerKey: "forms.email", cell: (row) => row.user.email },
        { key: "company", headerKey: "forms.company", cell: (row) => row.company ?? "—" },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
      ]}
    />
  );
}
