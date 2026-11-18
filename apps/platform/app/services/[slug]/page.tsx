import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { servicesCatalog, text } from "@/lib/public-catalog";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [service, t, locale] = await Promise.all([
    prisma.service.findUnique({ where: { slug }, select: { name: true } }),
    getServerDictionary(),
    getServerLocale(),
  ]);
  const entry = servicesCatalog.find((item) => item.slug === slug);
  return { title: entry ? text(entry.name, locale) : (service?.name ?? t.brand.name) };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [t, locale] = await Promise.all([getServerDictionary(), getServerLocale()]);
  const service = await prisma.service.findUnique({ where: { slug, isActive: true } });
  if (!service) notFound();

  const catalog = servicesCatalog.find((entry) => entry.slug === slug);
  const englishOnly = locale === "ar" && !catalog;
  const localName = catalog ? text(catalog.name, locale) : service.name;
  const localShort = catalog ? text(catalog.short, locale) : (service.shortDescription ?? service.description);
  const localDescription = catalog ? text(catalog.description, locale) : service.description;
  const challenges = catalog?.problems.map((item) => text(item, locale)) ?? [];
  const benefits = catalog?.benefits.length
    ? catalog.benefits.map((item) => text(item, locale))
    : service.benefits;
  const features = catalog ? [] : service.features;
  const steps = catalog?.process.length
    ? catalog.process.map((item) => text(item, locale))
    : service.process;
  const faqs = catalog?.faqs.map((faq) => ({
    question: text(faq.q, locale),
    answer: text(faq.a, locale),
  })) ?? [];

  const related = await prisma.service.findMany({
    where: { isActive: true, NOT: { id: service.id } },
    take: 3,
    orderBy: { order: "asc" },
  });

  const relatedName = (name: string, relatedSlug: string) => {
    const entry = servicesCatalog.find((item) => item.slug === relatedSlug);
    return entry ? text(entry.name, locale) : name;
  };

  return (
    <PublicShell>
      <section className="st-hero relative isolate overflow-hidden bg-[#24272D] py-20 text-white">
        <div aria-hidden="true" className="st-hero-grid absolute inset-0" />
        <div className="section-shell relative">
          <p className="st-eyebrow text-[#FFB15C]">
            {catalog ? text(catalog.category, locale) : t.nav.services}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {localName}
          </h1>
          {englishOnly && (
            <p className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#FFB15C]">
              {t.public.englishOnly}
            </p>
          )}
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">{localShort}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              className="rounded-full bg-[#F79432] px-6 font-semibold text-primary-foreground hover:bg-[#FFB15C]"
              nativeButton={false}
              render={<Link href={`/contact?service=${slug}`} />}
            >
              {t.home.requestService}
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-white/35 bg-transparent px-6 font-semibold text-white hover:bg-white/10 hover:text-white"
              nativeButton={false}
              render={<Link href={`/request-quote?service=${slug}`} />}
            >
              {t.hero.requestQuote}
            </Button>
          </div>
        </div>
      </section>

      <section className="section-shell space-y-12 py-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-foreground dark:text-white">
            {t.public.serviceDescription}
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground dark:text-white/65">{localDescription}</p>
        </div>

        {challenges.length > 0 && (
          <List title={t.public.challenges} items={challenges} />
        )}
        {benefits.length > 0 && <List title={t.public.benefits} items={benefits} />}
        {features.length > 0 && <List title={t.public.features} items={features} />}
        {steps.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-foreground dark:text-white">
              {t.public.process}
            </h2>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              {steps.map((step, index) => (
                <li
                  key={`${step}-${index}`}
                  className="st-number rounded-2xl border border-[#777F89]/25 bg-white p-5 text-sm leading-6 text-secondary-foreground dark:bg-[#30343B]/40 dark:text-white/80"
                >
                  <span className="block text-lg font-semibold text-[#F79432]">0{index + 1}</span>
                  <span className="mt-2 block">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-semibold text-foreground dark:text-white">{t.public.faq}</h2>
          {faqs.length > 0 ? (
            <div className="mt-4 space-y-3">
              {faqs.map((faq, index) => (
                <details
                  key={`${faq.question}-${index}`}
                  className="group rounded-2xl border border-[#777F89]/25 bg-white p-5 dark:bg-[#30343B]/40"
                >
                  <summary className="cursor-pointer text-sm font-semibold text-foreground dark:text-white">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground dark:text-white/65">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground dark:text-white/65">{t.public.faqContact}</p>
          )}
        </div>

        {related.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-foreground dark:text-white">
              {t.public.relatedServices}
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/services/${item.slug}`}
                  className="st-card-lift rounded-3xl border border-[#777F89]/25 bg-white p-5 dark:bg-[#30343B]/40"
                >
                  <p className="font-semibold text-foreground dark:text-white">
                    {relatedName(item.name, item.slug)}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#F79432]">
                    {t.public.explore}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-[2rem] bg-[#30343B] p-8 text-center text-white">
          <p className="st-eyebrow text-[#FFB15C]">{t.brand.name}</p>
          <p className="mt-3 text-xl font-semibold">{t.home.ctaTitle}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              className="rounded-full bg-[#F79432] px-6 font-semibold text-primary-foreground hover:bg-[#FFB15C]"
              nativeButton={false}
              render={<Link href="/book-consultation" />}
            >
              {t.public.requestConsultation}
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-foreground dark:text-white">{title}</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex gap-3 rounded-xl bg-white px-4 py-3 text-sm leading-6 text-secondary-foreground dark:bg-[#30343B]/40 dark:text-white/75"
          >
            <span aria-hidden="true" className="text-[#F79432]">
              •
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
