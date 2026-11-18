import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDateTime } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

export default async function AdminNotificationsPage() {
  await requirePermission("content.manage", "admin");
  const [items, total, unread, locale, t] = await Promise.all([
    prisma.notification.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.notification.count(),
    prisma.notification.count({ where: { isRead: false } }),
    getServerLocale(),
    getServerDictionary(),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.notifications"
      stats={[
        { labelKey: "sections.records", value: total },
        { labelKey: "common.status", value: unread },
      ]}
      emptyKey="empty.notifications"
      rows={items}
      columns={[
        { key: "title", headerKey: "forms.title", cell: (row) => row.title },
        { key: "body", headerKey: "forms.message", cell: (row) => row.body },
        { key: "type", headerKey: "forms.category", cell: (row) => row.type ?? "—" },
        { key: "user", headerKey: "common.customer", cell: (row) => row.user.name ?? row.user.email },
        { key: "isRead", headerKey: "common.status", cell: (row) => (row.isRead ? t.common.yes : t.common.no) },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDateTime(row.createdAt, locale) },
      ]}
    />
  );
}
