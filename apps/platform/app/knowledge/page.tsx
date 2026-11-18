import { PublicShell } from "@/components/public/public-shell";
import { PageHeader } from "@/components/workspace/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getServerDictionary } from "@/lib/server-i18n";
import Link from "next/link";

export async function generateMetadata() {
  const t = await getServerDictionary();
  return { title: t.nav.knowledgeBase };
}

export default async function KnowledgePage() {
  const t = await getServerDictionary();
  const articles = await prisma.knowledgeArticle.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <PageHeader titleKey="nav.knowledgeBase" />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Card key={article.id} className="border-[#E4E7EC] shadow-sm dark:border-white/10">
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F79432]">
                  {article.category}
                </p>
                <CardTitle className="text-lg">{article.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="link"
                  className="px-0 text-[#F79432]"
                  nativeButton={false}
                  render={<Link href={`/knowledge/${article.slug}`} />}
                >
                  {t.public.readArticle}
                </Button>
              </CardContent>
            </Card>
          ))}
          {articles.length === 0 && <p className="text-sm text-muted-foreground">{t.empty.articles}</p>}
        </div>
      </div>
    </PublicShell>
  );
}
