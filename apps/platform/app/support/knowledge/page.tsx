import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { PageHeader } from "@/components/workspace/page-header";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

type ArticleRow = Awaited<ReturnType<typeof loadArticles>>[number];

async function loadArticles(q: string) {
  return prisma.knowledgeArticle.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
            { tags: { has: q } },
          ],
        }
      : undefined,
    include: { author: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupportKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getServerDictionary();
  const locale = await getServerLocale();
  const params = await searchParams;
  const q = first(params.q)?.trim() ?? "";

  const [articles, demoArticles] = await Promise.all([
    loadArticles(q),
    prisma.knowledgeArticle.count({ where: { id: { startsWith: "demo_kb_" } } }),
  ]);

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
    {
      key: "author",
      headerKey: "common.agent",
      cell: (row) => row.author?.name ?? row.author?.email ?? "—",
    },
    {
      key: "status",
      headerKey: "common.status",
      cell: (row) => (
        <Badge variant={row.isPublished ? "default" : "outline"}>
          {row.isPublished ? t.common.active : t.statuses.DRAFT}
        </Badge>
      ),
    },
    { key: "updatedAt", headerKey: "common.updatedAt", cell: (row) => formatDate(row.updatedAt, locale) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="support.knowledgeBase" />

      {demoArticles > 0 && <DemoNotice />}

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-[#E4E7EC] bg-white p-4 dark:border-white/10 dark:bg-[#24272D]">
        <div className="min-w-64 flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="kb-q">
            {t.common.search}
          </label>
          <Input id="kb-q" name="q" defaultValue={q} placeholder={t.common.search} />
        </div>
        <Button type="submit">{t.common.search}</Button>
        <Button nativeButton={false} render={<Link href="/support/knowledge" />} variant="outline">
          {t.common.refresh}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">{t.sections.results}: {articles.length}</p>
      <DataTable rows={articles} columns={columns} emptyKey="empty.articles" />
    </div>
  );
}
