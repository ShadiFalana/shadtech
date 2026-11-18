import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";
import Link from "next/link";

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  updatedAt: Date;
};

export default async function KnowledgePage() {
  await requireCustomerProfile();
  const locale = await getServerLocale();
  const t = await getServerDictionary();

  const articles = await prisma.knowledgeArticle.findMany({
    where: { isPublished: true },
    orderBy: { updatedAt: "desc" },
    select: { id: true, slug: true, title: true, category: true, updatedAt: true },
  });

  const columns: Column<ArticleRow>[] = [
    {
      key: "title",
      headerKey: "forms.title",
      cell: (row) => (
        <Link href={`/knowledge/${row.slug}`} className="font-medium hover:underline">
          {row.title}
        </Link>
      ),
    },
    { key: "category", headerKey: "common.category", cell: (row) => row.category ?? "—" },
    { key: "updatedAt", headerKey: "common.updatedAt", cell: (row) => formatDate(row.updatedAt, locale) },
    {
      key: "open",
      headerKey: "common.actions",
      cell: (row) => (
        <Button nativeButton={false} variant="link" render={<Link href={`/knowledge/${row.slug}`} />}>
          {t.actions.open}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.knowledgeBase" />
      <DataTable rows={articles} columns={columns} emptyKey="empty.articles" />
    </div>
  );
}
