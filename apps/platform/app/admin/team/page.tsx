import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { translateKey } from "@/lib/dictionaries";
import { getServerDictionary } from "@/lib/server-i18n";
import { DataTable } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatGrid } from "@/components/workspace/stat-grid";

const staffRoles = ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT", "CONTENT_MANAGER"] as const;

export default async function AdminTeamPage() {
  await requirePermission("users.manage", "admin");
  const t = await getServerDictionary();
  const [profiles, staff] = await Promise.all([
    prisma.employeeProfile.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({
      where: { role: { in: [...staffRoles] } },
      orderBy: { email: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  const profiledUserIds = new Set(profiles.map((profile) => profile.userId));
  const unprofiledStaff = staff.filter((user) => !profiledUserIds.has(user.id));

  return (
    <div className="space-y-6">
      <PageHeader titleKey="admin.team" />
      <StatGrid
        items={[
          { labelKey: "sections.members", value: profiles.length },
          { labelKey: "common.agent", value: staff.length },
        ]}
      />
      <SectionCard titleKey="sections.members">
        <DataTable
          emptyKey="common.noData"
          rows={profiles}
          columns={[
            { key: "name", headerKey: "forms.name", cell: (row) => row.user.name ?? row.user.email },
            { key: "title", headerKey: "forms.role", cell: (row) => row.title ?? "—" },
            { key: "department", headerKey: "forms.category", cell: (row) => row.department ?? "—" },
            { key: "email", headerKey: "forms.email", cell: (row) => row.user.email },
            { key: "phone", headerKey: "forms.phone", cell: (row) => row.phone ?? "—" },
          ]}
        />
      </SectionCard>
      <SectionCard titleKey="common.agent">
        <DataTable
          emptyKey="common.noData"
          rows={unprofiledStaff}
          columns={[
            { key: "name", headerKey: "forms.name", cell: (row) => row.name ?? row.email },
            { key: "email", headerKey: "forms.email", cell: (row) => row.email },
            { key: "role", headerKey: "forms.role", cell: (row) => translateKey(t, `roles.${row.role}`) ?? row.role },
          ]}
        />
      </SectionCard>
    </div>
  );
}
