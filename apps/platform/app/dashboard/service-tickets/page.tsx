import { ServiceTicketRequestForm } from "@/components/portal/service-ticket-request-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";
import Link from "next/link";

type TicketRow = {
  id: string;
  ticketNumber: string | null;
  subject: string;
  status: string;
  createdAt: Date;
  service: { name: string } | null;
};

export default async function ServiceTicketsPage() {
  const { profile } = await requireCustomerProfile();
  const locale = await getServerLocale();
  const t = await getServerDictionary();

  const [services, tickets] = await Promise.all([
    prisma.service.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    prisma.supportTicket.findMany({
      where: { customerId: profile.id, serviceId: { not: null } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        createdAt: true,
        service: { select: { name: true } },
      },
    }),
  ]);

  const columns: Column<TicketRow>[] = [
    {
      key: "ticket",
      headerKey: "forms.subject",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.service?.name ?? row.subject}</p>
          <p dir="ltr" className="text-xs text-muted-foreground">
            {row.ticketNumber ?? "—"}
          </p>
        </div>
      ),
    },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
    { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
    {
      key: "open",
      headerKey: "actions.open",
      cell: (row) => (
        <Button nativeButton={false} render={<Link href={`/dashboard/tickets/${row.id}`} />} variant="link" size="sm">
          {t.actions.open}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.serviceTickets" descriptionKey="portal.serviceTicketsDescription" />
      <SectionCard titleKey="portal.services">
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.common.noData}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <Card key={service.id} className="border-[#E4E7EC] shadow-sm dark:border-white/10">
                <CardHeader>
                  <CardTitle className="text-base">{service.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{service.shortDescription ?? service.description}</p>
                  <ServiceTicketRequestForm serviceId={service.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </SectionCard>
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground dark:text-white">{t.portal.myServiceTickets}</h2>
        <DataTable rows={tickets} columns={columns} emptyKey="common.noData" />
      </div>
    </div>
  );
}
