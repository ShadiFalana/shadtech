import { PublicShell } from "@/components/public/public-shell";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, t] = await Promise.all([
    prisma.knowledgeArticle.findUnique({ where: { slug }, select: { title: true } }),
    getServerDictionary(),
  ]);
  return { title: article?.title ?? t.brand.name };
}

export default async function KnowledgeArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getServerLocale();
  const article = await prisma.knowledgeArticle.findUnique({ where: { slug, isPublished: true } });
  if (!article) notFound();

  return (
    <PublicShell>
      <article className="mx-auto max-w-4xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#F79432]">{article.category}</p>
        <h1 className="mt-3 text-4xl font-bold text-foreground dark:text-white">{article.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{formatDate(article.updatedAt, locale)}</p>
        <div className="mt-8 whitespace-pre-wrap leading-7 text-secondary-foreground dark:text-white/85">
          {article.content}
        </div>
      </article>
    </PublicShell>
  );
}
