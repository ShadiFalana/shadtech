import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { industriesCatalog, text } from "@/lib/public-catalog";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [industry, t, locale] = await Promise.all([
    prisma.industry.findUnique({ where: { slug }, select: { name: true } }),
    getServerDictionary(),
    getServerLocale(),
  ]);
  const entry = industriesCatalog.find((item) => item.slug === slug);
  return { title: entry ? text(entry.name, locale) : (industry?.name ?? t.brand.name) };
}

export default async function IndustryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [t, locale] = await Promise.all([getServerDictionary(), getServerLocale()]);
  const industry = await prisma.industry.findUnique({ where: { slug, isActive: true } });
  if (!industry) notFound();

  const catalog = industriesCatalog.find((entry) => entry.slug === slug);
  const englishOnly = locale === "ar" && !catalog;
  const name = catalog ? text(catalog.name, locale) : industry.name;
  const description = catalog ? text(catalog.description, locale) : industry.description;
  const challenges = catalog?.challenges.map((item) => text(item, locale)) ?? industry.challenges;
  const solutions = catalog?.solutions.map((item) => text(item, locale)) ?? industry.solutions;

  return (
    <PublicShell>
      <section className="st-hero relative isolate overflow-hidden bg-[#24272D] py-20 text-white">
        <div aria-hidden="true" className="st-hero-grid absolute inset-0" />
        <div className="section-shell relative">
          <p className="st-eyebrow text-[#FFB15C]">{t.nav.industries}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {name}
          </h1>
          {englishOnly && (
            <p className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#FFB15C]">
              {t.public.englishOnly}
            </p>
          )}
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">{description}</p>
        </div>
      </section>

      <section className="section-shell space-y-10 py-16">
        {challenges.length > 0 && (
          <ItemList title={t.public.challenges} items={challenges} />
        )}
        {solutions.length > 0 && (
          <ItemList title={t.public.recommendedSolutions} items={solutions} />
        )}
        <div className="rounded-[2rem] bg-[#30343B] p-8 text-white">
          <p className="st-eyebrow text-[#FFB15C]">{t.brand.name}</p>
          <p className="mt-3 text-xl font-semibold">{t.home.ctaTitle}</p>
          <Button
            className="mt-6 rounded-full bg-[#F79432] px-6 font-semibold text-primary-foreground hover:bg-[#FFB15C]"
            nativeButton={false}
            render={<Link href={`/contact?industry=${slug}`} />}
          >
            {t.nav.contact}
          </Button>
        </div>
      </section>
    </PublicShell>
  );
}

function ItemList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-foreground dark:text-white">{title}</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="rounded-xl border border-[#777F89]/25 bg-white px-4 py-3 text-sm leading-6 text-secondary-foreground dark:bg-[#30343B]/40 dark:text-white/75"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
