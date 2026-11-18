import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDateTime } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminAppointmentsPage() {
  await requirePermission("customers.view", "admin");
  const [items, total, locale] = await Promise.all([
    prisma.appointment.findMany({
      include: { customer: { include: { user: true } }, assignee: true },
      orderBy: { startsAt: "desc" },
    }),
    prisma.appointment.count(),
    getServerLocale(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.appointments"
      stats={[{ labelKey: "sections.records", value: total }]}
      rows={items}
      columns={[
        { key: "title", headerKey: "forms.title", cell: (row) => row.title },
        { key: "startsAt", headerKey: "forms.startDate", cell: (row) => formatDateTime(row.startsAt, locale) },
        { key: "status", headerKey: "common.status", cell: (row) => row.status },
        {
          key: "customer",
          headerKey: "common.customer",
          cell: (row) => row.customer?.user.name ?? row.customer?.user.email ?? "—",
        },
        { key: "assignee", headerKey: "common.assignee", cell: (row) => row.assignee?.name ?? row.assignee?.email ?? "—" },
        { key: "location", headerKey: "forms.location", cell: (row) => row.location ?? "—" },
      ]}
    />
  );
}
