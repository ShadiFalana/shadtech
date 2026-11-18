import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicShell } from "@/components/public/public-shell";
import { prisma } from "@/lib/db";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, isPublished: true },
    select: { title: true },
  });
  return { title: post?.title };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [t, locale] = await Promise.all([getServerDictionary(), getServerLocale()]);
  const post = await prisma.blogPost.findFirst({
    where: { slug, isPublished: true },
    include: { author: { select: { name: true } } },
  });
  if (!post) notFound();

  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:py-16">
        <Button
          variant="link"
          className="h-auto w-fit px-0 text-[#F79432]"
          nativeButton={false}
          render={<Link href="/blog" />}
        >
          {t.common.back}
        </Button>
        <Card className="overflow-hidden border-[#E4E7EC] shadow-sm dark:border-white/10">
          <div className="h-1.5 bg-gradient-to-r from-[#F79432] via-[#FFB15C] to-[#F79432]" />
          <CardHeader>
            <CardTitle className="text-2xl text-foreground dark:text-white">{post.title}</CardTitle>
            {(post.publishedAt || post.author?.name) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {post.publishedAt && <span>{dateFormatter.format(post.publishedAt)}</span>}
                {post.author?.name && <span>{post.author.name}</span>}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-8 text-foreground dark:text-white/90">
              {post.content}
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  );
}
