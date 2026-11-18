import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";

type QuoteRow = {
  id: string;
  number: string;
  total: number;
  status: string;
  validUntil: Date | null;
  createdAt: Date;
};

export default async function QuotesPage() {
  const { profile } = await requireCustomerProfile();
  const locale = await getServerLocale();

  const quotes = await prisma.quotation.findMany({
    where: { customerId: profile.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, number: true, total: true, status: true, validUntil: true, createdAt: true },
  });

  const columns: Column<QuoteRow>[] = [
    { key: "number", headerKey: "common.number", cell: (row) => <span className="font-medium">{row.number}</span> },
    { key: "total", headerKey: "common.amount", cell: (row) => formatMoney(row.total, locale) },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
    { key: "validUntil", headerKey: "common.dueDate", cell: (row) => formatDate(row.validUntil, locale) },
    { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.quotes" />
      <DataTable rows={quotes} columns={columns} emptyKey="common.noData" />
    </div>
  );
}
