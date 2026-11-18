import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { StatusBadge } from "@/components/workspace/status-badge";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { getServerLocale } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";

type ContractRow = {
  id: string;
  number: string;
  title: string;
  status: string;
  value: number | null;
  currency: string;
  startDate: Date | null;
  endDate: Date | null;
};

export default async function ContractsPage() {
  const { profile } = await requireCustomerProfile();
  const locale = await getServerLocale();

  const contracts = await prisma.contract.findMany({
    where: { customerId: profile.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      value: true,
      currency: true,
      startDate: true,
      endDate: true,
    },
  });

  const columns: Column<ContractRow>[] = [
    { key: "number", headerKey: "common.number", cell: (row) => row.number },
    { key: "title", headerKey: "forms.title", cell: (row) => <span className="font-medium">{row.title}</span> },
    { key: "status", headerKey: "common.status", cell: (row) => <StatusBadge value={row.status} /> },
    { key: "value", headerKey: "common.amount", cell: (row) => formatMoney(row.value, locale, row.currency) },
    { key: "startDate", headerKey: "forms.startDate", cell: (row) => formatDate(row.startDate, locale) },
    { key: "endDate", headerKey: "forms.endDate", cell: (row) => formatDate(row.endDate, locale) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.contracts" />
      <DataTable rows={contracts} columns={columns} emptyKey="common.noData" />
    </div>
  );
}
