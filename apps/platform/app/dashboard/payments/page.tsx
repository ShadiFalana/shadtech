import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";

type PaymentRow = {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  reference: string | null;
  createdAt: Date;
};

export default async function PaymentsPage() {
  const { profile } = await requireCustomerProfile();
  const locale = await getServerLocale();

  const payments = await prisma.payment.findMany({
    where: { invoice: { customerId: profile.id } },
    orderBy: { createdAt: "desc" },
    include: { invoice: { select: { number: true } } },
  });

  const rows: PaymentRow[] = payments.map((payment) => ({
    id: payment.id,
    invoiceNumber: payment.invoice.number,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    method: payment.method,
    reference: payment.reference,
    createdAt: payment.createdAt,
  }));

  const columns: Column<PaymentRow>[] = [
    { key: "invoice", headerKey: "common.number", cell: (row) => row.invoiceNumber },
    { key: "amount", headerKey: "common.amount", cell: (row) => formatMoney(row.amount, locale, row.currency) },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
    { key: "method", headerKey: "common.notes", cell: (row) => row.method ?? "—" },
    { key: "reference", headerKey: "common.description", cell: (row) => row.reference ?? "—" },
    { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.payments" />
      <DataTable rows={rows} columns={columns} emptyKey="common.noData" />
    </div>
  );
}
