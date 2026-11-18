import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { solutionsCatalog, text } from "@/lib/public-catalog";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [solution, t, locale] = await Promise.all([
    prisma.solution.findUnique({ where: { slug }, select: { title: true } }),
    getServerDictionary(),
    getServerLocale(),
  ]);
  const entry = solutionsCatalog.find((item) => item.slug === slug);
  return { title: entry ? text(entry.title, locale) : (solution?.title ?? t.brand.name) };
}

export default async function SolutionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [t, locale] = await Promise.all([getServerDictionary(), getServerLocale()]);
  const solution = await prisma.solution.findUnique({ where: { slug, isActive: true } });
  if (!solution) notFound();

  const catalog = solutionsCatalog.find((entry) => entry.slug === slug);
  const englishOnly = locale === "ar" && !catalog;
  const title = catalog ? text(catalog.title, locale) : solution.title;
  const description = catalog ? text(catalog.description, locale) : solution.description;
  const content = catalog ? text(catalog.content, locale) : (solution.content ?? "");

  return (
    <PublicShell>
      <section className="st-hero relative isolate overflow-hidden bg-[#24272D] py-20 text-white">
        <div aria-hidden="true" className="st-hero-grid absolute inset-0" />
        <div className="section-shell relative">
          <p className="st-eyebrow text-[#FFB15C]">{t.nav.solutions}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>
          {englishOnly && (
            <p className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#FFB15C]">
              {t.public.englishOnly}
            </p>
          )}
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">{description}</p>
        </div>
      </section>

      <section className="section-shell py-16">
        <div className="max-w-3xl">
          <p className="st-eyebrow">{t.public.serviceDescription}</p>
          <div className="mt-5 whitespace-pre-wrap text-base leading-8 text-secondary-foreground dark:text-white/75">
            {content}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button
              className="rounded-full bg-[#F79432] px-6 font-semibold text-primary-foreground hover:bg-[#FFB15C]"
              nativeButton={false}
              render={<Link href={`/request-quote?solution=${slug}`} />}
            >
              {t.hero.requestQuote}
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-[#777F89]/25 px-6 font-semibold text-secondary-foreground hover:bg-[#F7F8FA] dark:text-white dark:hover:bg-[#30343B]"
              nativeButton={false}
              render={<Link href="/contact" />}
            >
              {t.nav.contact}
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
