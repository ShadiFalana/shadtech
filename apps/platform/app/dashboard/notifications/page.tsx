import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";
import Link from "next/link";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

type Filter = "all" | "unread" | "read";

function parseFilter(value: string | string[] | undefined): Filter {
  if (value === "unread" || value === "read") return value;
  return "all";
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string | string[] }>;
}) {
  const { session } = await requireCustomerProfile();
  const locale = await getServerLocale();
  const t = await getServerDictionary();
  const filter = parseFilter((await searchParams).filter);

  const [allNotifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, body: true, link: true, isRead: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
  ]);

  const notifications =
    filter === "all"
      ? allNotifications
      : allNotifications.filter((notification) => notification.isRead === (filter === "read"));

  const markAllAction = markAllNotificationsRead as unknown as (formData: FormData) => void;

  const filters: Array<{ value: Filter; label: string }> = [
    { value: "all", label: t.common.all },
    { value: "unread", label: t.shell.unreadCount.replace("{count}", String(unreadCount)) },
    { value: "read", label: t.sections.history },
  ];

  const columns: Column<NotificationRow>[] = [
    {
      key: "title",
      headerKey: "common.subject",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-medium">{row.title}</p>
          <p className="text-sm text-muted-foreground">{row.body}</p>
        </div>
      ),
    },
    { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDateTime(row.createdAt, locale) },
    {
      key: "read",
      headerKey: "common.status",
      cell: (row) => (row.isRead ? t.common.yes : t.common.no),
    },
    {
      key: "actions",
      headerKey: "common.actions",
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          {!row.isRead && (
            <form action={markNotificationRead.bind(null, row.id) as unknown as (formData: FormData) => void}>
              <Button type="submit" variant="outline" size="sm">
                {t.actions.markRead}
              </Button>
            </form>
          )}
          {row.link && (
            <Button nativeButton={false} variant="link" size="sm" render={<Link href={row.link} />}>
              {t.actions.open}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.notifications">
        {unreadCount > 0 && (
          <form action={markAllAction}>
            <Button type="submit" variant="outline">
              {t.actions.markAllRead}
            </Button>
          </form>
        )}
      </PageHeader>
      <div className="flex flex-wrap gap-2">
        {filters.map((entry) => (
          <Button nativeButton={false}
            key={entry.value}
            variant={filter === entry.value ? "default" : "outline"}
            size="sm"
            render={<Link href={entry.value === "all" ? "/dashboard/notifications" : `/dashboard/notifications?filter=${entry.value}`} />}
          >
            {entry.label}
          </Button>
        ))}
      </div>
      <DataTable rows={notifications} columns={columns} emptyKey="empty.notifications" />
      <SectionCard titleKey="common.settings" descriptionKey="unavailable.description">
        <p className="text-sm text-muted-foreground">
          {t.common.notifications}: {t.unavailable.title}
        </p>
      </SectionCard>
    </div>
  );
}
