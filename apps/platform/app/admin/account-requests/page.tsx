import { AccountRequestActions } from "@/components/admin/account-request-actions";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatGrid } from "@/components/workspace/stat-grid";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { translateKey } from "@/lib/dictionaries";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import { requirePermission } from "@/lib/session";

type RequestRow = {
  id: string;
  requestedRole: string;
  status: string;
  note: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  user: { name: string | null; email: string };
};

export default async function AccountRequestsPage() {
  await requirePermission("users.manage", "admin");
  const locale = await getServerLocale();
  const t = await getServerDictionary();

  const [pending, reviewed] = await Promise.all([
    prisma.accountRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        requestedRole: true,
        status: true,
        note: true,
        createdAt: true,
        reviewedAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.accountRequest.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { reviewedAt: "desc" },
      select: {
        id: true,
        requestedRole: true,
        status: true,
        note: true,
        createdAt: true,
        reviewedAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const columns: Column<RequestRow>[] = [
    {
      key: "applicant",
      headerKey: "admin.applicant",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.user.name ?? "—"}</p>
          <p dir="ltr" className="text-xs text-muted-foreground">
            {row.user.email}
          </p>
        </div>
      ),
    },
    {
      key: "requestedRole",
      headerKey: "auth.requestedRole",
      cell: (row) => translateKey(t, `roles.${row.requestedRole}`) ?? row.requestedRole,
    },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
    { key: "createdAt", headerKey: "admin.requestedAt", cell: (row) => formatDate(row.createdAt, locale) },
    {
      key: "note",
      headerKey: "admin.requestNote",
      cell: (row) => <span className="text-xs text-muted-foreground">{row.note ?? "—"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="admin.accountRequests" descriptionKey="admin.roleGrantNotice" />
      <StatGrid
        items={[
          { labelKey: "admin.pendingRequests", value: pending.length },
          { labelKey: "admin.reviewRequest", value: reviewed.length },
        ]}
      />
      <SectionCard titleKey="admin.pendingRequests">
        <DataTable
          rows={pending}
          columns={[
            ...columns,
            {
              key: "actions",
              headerKey: "admin.reviewRequest",
              cell: (row) => <AccountRequestActions requestId={row.id} />,
            },
          ]}
        />
      </SectionCard>
      <SectionCard titleKey="sections.history">
        <DataTable
          rows={reviewed}
          columns={[
            ...columns,
            {
              key: "reviewedAt",
              headerKey: "admin.reviewedAt",
              cell: (row) => formatDate(row.reviewedAt, locale),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}
