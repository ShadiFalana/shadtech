import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { PageHeader } from "@/components/workspace/page-header";
import { StatGrid } from "@/components/workspace/stat-grid";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

type AppointmentRow = Awaited<ReturnType<typeof loadAppointments>>[number];

async function loadAppointments(q: string) {
  return prisma.appointment.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
            { customer: { user: { name: { contains: q, mode: "insensitive" } } } },
            { assignee: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { customer: { include: { user: true } }, assignee: true },
    orderBy: { startsAt: "desc" },
    take: 200,
  });
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupportSchedulePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getServerDictionary();
  const locale = await getServerLocale();
  const params = await searchParams;
  const q = first(params.q)?.trim() ?? "";

  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [appointments, upcoming, todayCount, demoAppointments] = await Promise.all([
    loadAppointments(q),
    prisma.appointment.count({ where: { startsAt: { gte: now } } }),
    prisma.appointment.count({ where: { startsAt: { gte: now, lte: endOfToday } } }),
    prisma.appointment.count({ where: { id: { startsWith: "demo_appointment_" } } }),
  ]);

  const columns: Column<AppointmentRow>[] = [
    { key: "title", headerKey: "forms.title", cell: (row) => <p className="font-medium">{row.title}</p> },
    { key: "startsAt", headerKey: "forms.preferredTime", cell: (row) => formatDateTime(row.startsAt, locale) },
    {
      key: "customer",
      headerKey: "common.customer",
      cell: (row) => row.customer?.user.name ?? row.customer?.user.email ?? "—",
    },
    { key: "assignee", headerKey: "common.assignee", cell: (row) => row.assignee?.name ?? row.assignee?.email ?? "—" },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
    { key: "location", headerKey: "forms.location", cell: (row) => row.location ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="support.schedule" />

      {demoAppointments > 0 && <DemoNotice />}

      <StatGrid
        items={[
          { labelKey: "admin.appointments", value: upcoming },
          { labelKey: "common.today", value: todayCount },
        ]}
      />

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-[#E4E7EC] bg-white p-4 dark:border-white/10 dark:bg-[#24272D]">
        <div className="min-w-64 flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="schedule-q">
            {t.common.search}
          </label>
          <Input id="schedule-q" name="q" defaultValue={q} placeholder={t.common.search} />
        </div>
        <Button type="submit">{t.common.search}</Button>
        <Button nativeButton={false} render={<Link href="/support/schedule" />} variant="outline">
          {t.common.refresh}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">{t.sections.results}: {appointments.length}</p>
      <DataTable rows={appointments} columns={columns} emptyKey="common.noData" />
    </div>
  );
}
