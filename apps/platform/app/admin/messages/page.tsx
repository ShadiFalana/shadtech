import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { markMessageRead } from "@/actions/admin-content";
import { AdminActionForm } from "@/components/admin/admin-form";
import { AdminResourcePage } from "@/components/admin/admin-resource-page";
import { formatDate } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";

export default async function AdminMessagesPage() {
  await requirePermission("content.manage", "admin");
  const [items, locale, unread] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } }),
    getServerLocale(),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);

  return (
    <AdminResourcePage
      titleKey="admin.contactMessages"
      stats={[{ labelKey: "admin.notifications", value: unread }]}
      rows={items}
      columns={[
        { key: "name", headerKey: "forms.name", cell: (row) => row.name },
        { key: "email", headerKey: "forms.email", cell: (row) => row.email },
        { key: "subject", headerKey: "forms.subject", cell: (row) => row.subject ?? "—" },
        { key: "message", headerKey: "forms.message", cell: (row) => row.message },
        { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
        {
          key: "actions",
          headerKey: "common.actions",
          cell: (row) =>
            row.isRead ? (
              "—"
            ) : (
              <AdminActionForm action={markMessageRead} id={row.id} labelKey="actions.markRead" variant="default" />
            ),
        },
      ]}
    />
  );
}
