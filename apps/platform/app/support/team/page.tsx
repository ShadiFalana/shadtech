import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { PageHeader } from "@/components/workspace/page-header";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

type AgentRow = Awaited<ReturnType<typeof loadAgents>>[number];

async function loadAgents(q: string) {
  return prisma.user.findMany({
    where: {
      role: { in: ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"] },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: { employeeProfile: true, _count: { select: { assignedTickets: true } } },
    orderBy: { name: "asc" },
    take: 200,
  });
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupportTeamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getServerDictionary();
  const locale = await getServerLocale();
  const params = await searchParams;
  const q = first(params.q)?.trim() ?? "";

  const [agents, demoAgents] = await Promise.all([
    loadAgents(q),
    prisma.user.count({
      where: {
        id: { startsWith: "demo_user_" },
        role: { in: ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"] },
      },
    }),
  ]);

  const columns: Column<AgentRow>[] = [
    {
      key: "name",
      headerKey: "forms.name",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name ?? row.email}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    { key: "role", headerKey: "forms.role", cell: (row) => <Badge variant="outline">{row.role}</Badge> },
    {
      key: "title",
      headerKey: "sections.details",
      cell: (row) => row.employeeProfile?.title ?? "—",
    },
    { key: "tickets", headerKey: "support.tickets", cell: (row) => row._count.assignedTickets },
    { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="support.team" />

      {demoAgents > 0 && <DemoNotice />}

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-[#E4E7EC] bg-white p-4 dark:border-white/10 dark:bg-[#24272D]">
        <div className="min-w-64 flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="team-q">
            {t.common.search}
          </label>
          <Input id="team-q" name="q" defaultValue={q} placeholder={t.common.search} />
        </div>
        <Button type="submit">{t.common.search}</Button>
        <Button nativeButton={false} render={<Link href="/support/team" />} variant="outline">
          {t.common.refresh}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">{t.sections.results}: {agents.length}</p>
      <DataTable rows={agents} columns={columns} emptyKey="empty.search" />
    </div>
  );
}
