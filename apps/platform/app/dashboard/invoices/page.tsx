import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";

type InvoiceRow = {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: Date | null;
  createdAt: Date;
};

export default async function InvoicesPage() {
  const { profile } = await requireCustomerProfile();
  const locale = await getServerLocale();

  const invoices = await prisma.invoice.findMany({
    where: { customerId: profile.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      number: true,
      amount: true,
      currency: true,
      status: true,
      dueDate: true,
      createdAt: true,
    },
  });

  const columns: Column<InvoiceRow>[] = [
    { key: "number", headerKey: "common.number", cell: (row) => <span className="font-medium">{row.number}</span> },
    { key: "amount", headerKey: "common.amount", cell: (row) => formatMoney(row.amount, locale, row.currency) },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
    { key: "dueDate", headerKey: "common.dueDate", cell: (row) => formatDate(row.dueDate, locale) },
    { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.invoices" />
      <DataTable rows={invoices} columns={columns} emptyKey="empty.invoices" />
    </div>
  );
}
