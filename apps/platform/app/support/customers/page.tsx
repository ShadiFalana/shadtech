import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { PageHeader } from "@/components/workspace/page-header";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

type CustomerRow = Awaited<ReturnType<typeof loadCustomers>>[number];

async function loadCustomers(q: string) {
  return prisma.customerProfile.findMany({
    where: q
      ? {
          OR: [
            { user: { name: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
            { company: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { user: true, _count: { select: { tickets: true, assets: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupportCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getServerDictionary();
  const locale = await getServerLocale();
  const params = await searchParams;
  const q = first(params.q)?.trim() ?? "";

  const [customers, demoCustomers] = await Promise.all([
    loadCustomers(q),
    prisma.customerProfile.count({ where: { id: { startsWith: "demo_" } } }),
  ]);

  const columns: Column<CustomerRow>[] = [
    {
      key: "customer",
      headerKey: "common.customer",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.user.name ?? row.user.email}</p>
          <p className="text-xs text-muted-foreground">{row.user.email}</p>
        </div>
      ),
    },
    { key: "company", headerKey: "forms.company", cell: (row) => row.company ?? "—" },
    { key: "tickets", headerKey: "support.tickets", cell: (row) => row._count.tickets },
    { key: "assets", headerKey: "support.relatedAssets", cell: (row) => row._count.assets },
    { key: "createdAt", headerKey: "common.createdAt", cell: (row) => formatDate(row.createdAt, locale) },
    {
      key: "actions",
      headerKey: "common.actions",
      cell: (row) => (
        <Button
          nativeButton={false}
          render={<Link href={`/support/tickets?q=${encodeURIComponent(row.user.email)}`} />}
          variant="outline"
          size="sm"
        >
          {t.common.view}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="support.customers" />

      {demoCustomers > 0 && <DemoNotice />}

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-[#E4E7EC] bg-white p-4 dark:border-white/10 dark:bg-[#24272D]">
        <div className="min-w-64 flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="customer-q">
            {t.common.search}
          </label>
          <Input id="customer-q" name="q" defaultValue={q} placeholder={t.common.search} />
        </div>
        <Button type="submit">{t.common.search}</Button>
        <Button nativeButton={false} render={<Link href="/support/customers" />} variant="outline">
          {t.common.refresh}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">{t.sections.results}: {customers.length}</p>
      <DataTable rows={customers} columns={columns} emptyKey="empty.customers" />
    </div>
  );
}
