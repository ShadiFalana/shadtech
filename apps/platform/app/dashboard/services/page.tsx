import { ServiceRequestButton } from "@/components/portal/service-request-button";
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

type ServiceRequestRow = {
  id: string;
  status: string;
  createdAt: Date;
  service: { name: string };
};

export default async function CustomerServicesPage() {
  const { profile } = await requireCustomerProfile();
  const locale = await getServerLocale();
  const t = await getServerDictionary();

  const [services, requests] = await Promise.all([
    prisma.service.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    prisma.serviceRequest.findMany({
      where: { customerId: profile.id },
      orderBy: { createdAt: "desc" },
      include: { service: { select: { name: true } } },
    }),
  ]);

  const columns: Column<ServiceRequestRow>[] = [
    { key: "service", headerKey: "forms.service", cell: (row) => row.service.name },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
    { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.services" descriptionKey="portal.serviceRequests">
        <Button nativeButton={false} render={<Link href="/dashboard/service-tickets" />} variant="outline" size="sm">
          {t.portal.serviceTickets}
        </Button>
      </PageHeader>

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
                  <ServiceRequestButton serviceId={service.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground dark:text-white">{t.portal.serviceRequests}</h2>
        <DataTable rows={requests} columns={columns} emptyKey="common.noData" />
      </div>
    </div>
  );
}
