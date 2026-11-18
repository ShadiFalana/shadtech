import { requirePermission } from "@/lib/session";
import { DemoBadge } from "@/components/super-admin/badges";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { PageHeader } from "@/components/workspace/page-header";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { translateKey } from "@/lib/dictionaries";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  createdAt: Date;
};

export default async function SuperAdminUsersPage() {
  await requirePermission("users.manage", "admin");
  const locale = await getServerLocale();
  const t = await getServerDictionary();

  // Explicit select: no Account.password, TwoFactor.secret or other credentials
  // are ever fetched or rendered in this surface.
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  });

  const hasDemoRecords = users.some((user) => user.id.startsWith("demo_"));

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      headerKey: "forms.name",
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{row.name ?? "—"}</span>
            {row.id.startsWith("demo_") && <DemoBadge />}
          </div>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {row.email}
          </p>
        </div>
      ),
    },
    { key: "role", headerKey: "forms.role", searchValue: (row) => `${row.role} ${translateKey(t, `roles.${row.role}`) ?? ""}`, cell: (row) => <span className="text-xs">{translateKey(t, `roles.${row.role}`) ?? row.role}</span> },
    {
      key: "twoFactorEnabled",
      headerKey: "auth.twoFactorTitle",
      cell: (row) => (row.twoFactorEnabled ? t.common.yes : t.common.no),
    },
    { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="superAdmin.platformUsers" />
      {hasDemoRecords && <DemoNotice />}
      <DataTable rows={users} columns={columns} />
    </div>
  );
}
