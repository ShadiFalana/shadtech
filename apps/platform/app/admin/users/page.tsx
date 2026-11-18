import { CreateUserForm, ChangeUserRoleForm } from "@/components/admin/user-management-forms";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatGrid } from "@/components/workspace/stat-grid";
import { prisma } from "@/lib/db";
import { translateKey } from "@/lib/dictionaries";
import { formatDate } from "@/lib/format";
import { normaliseRole } from "@/lib/permissions";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import { requirePermission } from "@/lib/session";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "SUPPORT_AGENT" | "CONTENT_MANAGER" | "CUSTOMER";
  twoFactorEnabled: boolean;
  createdAt: Date;
};

export default async function AdminUsersPage() {
  const session = await requirePermission("users.manage", "admin");
  const actorRole = normaliseRole((session.user as { role?: string }).role);
  const canGrantSuperAdmin = actorRole === "SUPER_ADMIN";
  const locale = await getServerLocale();
  const t = await getServerDictionary();

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

  const staffCount = users.filter((user) => user.role !== "CUSTOMER").length;

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      headerKey: "forms.name",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name ?? "—"}</p>
          <p dir="ltr" className="text-xs text-muted-foreground">
            {row.email}
          </p>
        </div>
      ),
    },
    {
      key: "role",
      headerKey: "forms.role",
      cell: (row) => translateKey(t, `roles.${row.role}`) ?? row.role,
    },
    {
      key: "twoFactor",
      headerKey: "auth.twoFactorTitle",
      cell: (row) => (row.twoFactorEnabled ? t.common.yes : t.common.no),
    },
    { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
    {
      key: "actions",
      headerKey: "admin.changeRole",
      cell: (row) => (
        <ChangeUserRoleForm
          userId={row.id}
          role={row.role}
          canGrantSuperAdmin={canGrantSuperAdmin}
          disabled={row.id === session.user.id || (row.role === "SUPER_ADMIN" && !canGrantSuperAdmin)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="admin.users" descriptionKey="admin.roleGrantNotice" />
      <StatGrid
        items={[
          { labelKey: "admin.users", value: users.length },
          { labelKey: "admin.team", value: staffCount },
        ]}
      />
      <SectionCard titleKey="admin.createUserTitle" descriptionKey="admin.createUserDescription">
        <CreateUserForm canGrantSuperAdmin={canGrantSuperAdmin} />
      </SectionCard>
      <SectionCard titleKey="admin.users">
        <DataTable rows={users} columns={columns} />
      </SectionCard>
    </div>
  );
}
