import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";

type AppointmentRow = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  status: string;
  location: string | null;
  assigneeName: string;
};

export default async function AppointmentsPage() {
  const { profile } = await requireCustomerProfile();
  const locale = await getServerLocale();

  const appointments = await prisma.appointment.findMany({
    where: { customerId: profile.id },
    orderBy: { startsAt: "desc" },
    include: { assignee: { select: { name: true, email: true } } },
  });

  const rows: AppointmentRow[] = appointments.map((appointment) => ({
    id: appointment.id,
    title: appointment.title,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    status: appointment.status,
    location: appointment.location,
    assigneeName: appointment.assignee?.name ?? appointment.assignee?.email ?? "—",
  }));

  const columns: Column<AppointmentRow>[] = [
    { key: "title", headerKey: "forms.title", cell: (row) => <span className="font-medium">{row.title}</span> },
    { key: "startsAt", headerKey: "forms.startDate", cell: (row) => formatDateTime(row.startsAt, locale) },
    { key: "endsAt", headerKey: "forms.endDate", cell: (row) => formatDateTime(row.endsAt, locale) },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
    { key: "location", headerKey: "forms.location", cell: (row) => row.location ?? "—" },
    { key: "assignee", headerKey: "common.assignee", cell: (row) => row.assigneeName },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.appointments" />
      <DataTable rows={rows} columns={columns} emptyKey="common.noData" />
    </div>
  );
}
