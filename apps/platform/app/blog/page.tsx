import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicShell } from "@/components/public/public-shell";
import { PageHeader } from "@/components/workspace/page-header";
import { prisma } from "@/lib/db";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerDictionary();
  return { title: t.public.blogTitle };
}

export default async function BlogPage() {
  const [t, locale] = await Promise.all([getServerDictionary(), getServerLocale()]);
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: [
      { publishedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
  });
  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <PageHeader titleKey="public.blogTitle" descriptionKey="public.blogSubtitle" />

        {posts.length === 0 ? (
          <Card className="mt-8 border-[#E4E7EC] bg-gradient-to-br from-[#F79432]/10 to-transparent shadow-sm dark:border-white/10">
            <CardContent className="py-10">
              <p className="text-sm leading-7 text-muted-foreground">{t.public.noPosts}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="flex flex-col overflow-hidden border-[#E4E7EC] shadow-sm dark:border-white/10"
              >
                <div className="h-1.5 bg-gradient-to-r from-[#F79432] via-[#FFB15C] to-[#F79432]" />
                <CardHeader>
                  <CardTitle className="text-lg text-foreground dark:text-white">{post.title}</CardTitle>
                  {post.publishedAt && (
                    <p className="text-xs text-muted-foreground">{dateFormatter.format(post.publishedAt)}</p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-5">
                  <p className="text-sm leading-7 text-muted-foreground">
                    {post.excerpt ?? post.content.slice(0, 180)}
                  </p>
                  <Button
                    variant="link"
                    className="h-auto w-fit px-0 text-[#F79432]"
                    nativeButton={false}
                    render={<Link href={`/blog/${post.slug}`} />}
                  >
                    {t.common.view}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
