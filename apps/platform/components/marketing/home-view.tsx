"use client";

import { TechVisual } from "@/components/marketing/tech-visual";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import {
  productCategories,
  quickServiceSlugs,
  servicesCatalog,
  text,
} from "@/lib/public-catalog";
import {
  AppWindow,
  ArrowUpRight,
  BadgeCheck,
  Cloud,
  Cpu,
  DatabaseBackup,
  Headphones,
  MessagesSquare,
  Monitor,
  MonitorSmartphone,
  Server,
  Shield,
  ShieldCheck,
  Wallet,
  Wifi,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

export type PartnerHighlight = {
  id: string;
  name: string;
  category: string | null;
  website: string | null;
  logoUrl: string | null;
};

const arabicTextPattern =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

function hasArabicText(value: string) {
  return arabicTextPattern.test(value);
}

const icons: Record<string, ComponentType<{ className?: string }>> = {
  Server,
  Headphones,
  Monitor,
  AppWindow,
  Wrench,
  Wifi,
  Shield,
  Cloud,
  DatabaseBackup,
  MessagesSquare,
  MonitorSmartphone,
  Cpu,
};

export function HomeView({ partners = [] }: { partners?: PartnerHighlight[] }) {
  const { locale, t } = useLanguage();

  const quick = quickServiceSlugs
    .map((slug) => servicesCatalog.find((service) => service.slug === slug))
    .filter((service): service is (typeof servicesCatalog)[number] => Boolean(service));

  const why = [
    { icon: Headphones, label: t.home.why1 },
    { icon: Wallet, label: t.home.why2 },
    { icon: MessagesSquare, label: t.home.why3 },
    { icon: MonitorSmartphone, label: t.home.why4 },
    { icon: Cpu, label: t.home.why5 },
    { icon: MessagesSquare, label: t.home.why6 },
    { icon: BadgeCheck, label: t.home.why7 },
    { icon: Server, label: t.home.why8 },
  ];

  const steps = [
    t.home.step1,
    t.home.step2,
    t.home.step3,
    t.home.step4,
    t.home.step5,
  ];

  const tech = [
    t.home.tech1,
    t.home.tech2,
    t.home.tech3,
    t.home.tech4,
    t.home.tech5,
    t.home.tech6,
  ];

  return (
    <>
      <section className="st-hero relative isolate overflow-hidden bg-[#24272D] text-white">
        <div aria-hidden="true" className="st-hero-grid absolute inset-0" />
        <div aria-hidden="true" className="st-hero-glow absolute -top-40 end-[-10%] size-[36rem]" />
        <div className="section-shell relative grid gap-12 py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:py-28">
          <div>
            <p className="st-kicker">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-[#F79432]" />
              {t.brand.name}
            </p>
            <h1 className="mt-6 max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.06] tracking-tight text-white">
              {t.brand.tagline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
              {t.home.heroSubtitle}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="h-12 rounded-full bg-[#F79432] px-7 font-semibold text-primary-foreground hover:bg-[#FFB15C]"
                nativeButton={false}
                render={<Link href="/contact?intent=support" />}
              >
                {t.hero.requestSupport}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/35 bg-transparent px-7 font-semibold text-white hover:bg-white/10 hover:text-white"
                nativeButton={false}
                render={<Link href="/request-quote" />}
              >
                {t.hero.requestQuote}
              </Button>
            </div>
          </div>
          <TechVisual />
        </div>
      </section>

      <section className="relative z-10 -mt-10">
        <div className="section-shell">
          <div className="surface-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="st-eyebrow">{t.home.quickAccess}</p>
                <p className="mt-1 text-sm text-muted-foreground dark:text-white/60">
                  {t.home.quickAccessNote}
                </p>
              </div>
              <Link
                href="/services"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#F79432] hover:text-[#FFB15C]"
              >
                {t.nav.viewAll}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {quick.map((service) => {
                const Icon = icons[service.icon] ?? Server;
                return (
                  <Link
                    key={service.slug}
                    href={`/services/${service.slug}`}
                    className="st-card-lift flex items-center gap-3 rounded-2xl bg-[#F7F8FA] p-3 dark:bg-[#30343B]/70"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#F79432] shadow-sm dark:bg-[#24272D]">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold leading-5 text-foreground dark:text-white">
                      {text(service.name, locale)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-20 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow={t.brand.name}
              title={t.home.expertiseTitle}
              description={t.home.intro}
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Info title={t.about.mission} body={t.about.missionBody} />
              <Info title={t.about.vision} body={t.about.visionBody} />
            </div>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#F79432] hover:text-[#FFB15C]"
            >
              {t.nav.about}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#30343B] p-7 text-white sm:p-9">
            <div aria-hidden="true" className="st-panel-glow absolute -end-16 -top-16 size-56" />
            <p className="st-eyebrow text-[#FFB15C]">{t.home.coreValuesTitle}</p>
            <ul className="relative mt-6 space-y-4">
              {[
                t.home.valueClarity,
                t.home.valueFollowThrough,
                t.home.valueData,
                t.home.valuePracticality,
              ].map((value) => (
                <li key={value} className="flex gap-3 text-sm leading-6 text-white/80">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-[#F79432]" aria-hidden="true" />
                  {value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-[#24272D] lg:py-24">
        <div className="section-shell">
          <SectionHeading
            eyebrow={t.home.quickAccess}
            title={t.nav.services}
            action={
              <Link
                href="/services"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#F79432] hover:text-[#FFB15C]"
              >
                {t.nav.viewAll}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            }
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {servicesCatalog.map((service) => {
              const Icon = icons[service.icon] ?? Server;
              return (
                <article
                  key={service.slug}
                  className="st-card-lift flex flex-col rounded-3xl border border-[#777F89]/25 bg-[#F7F8FA] p-6 dark:border-white/10 dark:bg-[#30343B]/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#F79432] shadow-sm dark:bg-[#24272D]">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {text(service.category, locale)}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground dark:text-white">
                    {text(service.name, locale)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground dark:text-white/60">
                    {text(service.short, locale)}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/services/${service.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[#F79432] hover:text-[#FFB15C]"
                    >
                      {t.public.learnMore}
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href={`/contact?service=${service.slug}`}
                      className="rounded-full bg-[#24272D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#30343B] dark:bg-[#F79432] dark:text-primary-foreground dark:hover:bg-[#FFB15C]"
                    >
                      {t.home.requestService}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-shell py-20 lg:py-24">
        <SectionHeading
          eyebrow={t.brand.name}
          title={t.home.whyTitle}
          description={t.home.industryNote}
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {why.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="st-card-lift rounded-3xl border border-[#777F89]/25 bg-white p-6 dark:border-white/10 dark:bg-[#30343B]/40"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#F7F8FA] text-[#F79432] dark:bg-[#F79432]/15">
                <item.icon className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-5 text-sm font-semibold leading-6 text-foreground dark:text-white">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell pb-20 lg:pb-24">
        <div className="surface-card flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="st-eyebrow">{t.home.teamAccessTitle}</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground dark:text-white/60">
              {t.home.teamAccessNote}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="h-11 rounded-full border border-transparent bg-[#24272D] px-6 font-semibold text-white hover:bg-[#30343B] dark:border-white/15 dark:bg-[#30343B] dark:text-white dark:hover:bg-[#3A3F47]"
              nativeButton={false}
              render={<Link href="/auth/admin/login" />}
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              {t.home.adminLogin}
            </Button>
            <Button
              size="lg"
              className="h-11 rounded-full border border-transparent bg-[#24272D] px-6 font-semibold text-white hover:bg-[#30343B] dark:border-white/15 dark:bg-[#30343B] dark:text-white dark:hover:bg-[#3A3F47]"
              nativeButton={false}
              render={<Link href="/auth/staff/login" />}
            >
              <Headphones className="size-4" aria-hidden="true" />
              {t.home.staffLogin}
            </Button>
          </div>
        </div>
      </section>

      <section className="brand-gradient relative isolate overflow-hidden py-20 text-white lg:py-24">
        <div aria-hidden="true" className="st-hero-glow absolute -bottom-48 start-[-8%] size-[34rem]" />
        <div className="section-shell relative">
          <p className="st-eyebrow text-[#FFB15C]">{t.home.howTitle}</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.home.howTitle}
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {steps.map((step, index) => (
              <li
                key={step}
                className="st-process-step rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <span className="st-number text-3xl font-semibold text-[#F79432]">
                  0{index + 1}
                </span>
                <p className="mt-4 text-sm font-medium leading-6 text-white/85">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-shell py-20 lg:py-24">
        <SectionHeading
          eyebrow={t.brand.name}
          title={t.home.partnersTitle}
          description={t.home.partnersNote}
        />
        {partners.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {partners.map((partner) => {
              const needsEnglishLabel =
                locale === "ar" &&
                [partner.name, partner.category ?? ""].some(
                  (value) => value.length > 0 && !hasArabicText(value),
                );
              return (
              <article
                key={partner.id}
                className="st-card-lift flex items-center gap-4 rounded-3xl border border-[#777F89]/25 bg-white p-5 dark:border-white/10 dark:bg-[#30343B]/40"
              >
                {partner.logoUrl && (
                  <span
                    aria-hidden="true"
                    className="size-12 shrink-0 rounded-xl border border-[#777F89]/25 bg-contain bg-center bg-no-repeat dark:border-white/10"
                    style={{
                      backgroundImage: `url("${partner.logoUrl.replace(/["\\]/g, "")}")`,
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground dark:text-white">
                    {partner.name}
                  </p>
                  {partner.category && (
                    <p className="mt-1 truncate text-xs text-muted-foreground dark:text-white/60">
                      {partner.category}
                    </p>
                  )}
                  {needsEnglishLabel && (
                    <span className="mt-1 block text-xs font-semibold text-[#F79432]">
                      {t.public.englishOnly}
                    </span>
                  )}
                </div>
                {partner.website && (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={partner.name}
                    className="text-[#F79432] hover:text-[#FFB15C]"
                  >
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                )}
              </article>
              );
            })}
          </div>
        ) : (
          <p className="surface-card mt-10 p-6 text-sm leading-7 text-muted-foreground dark:text-white/60">
            {t.home.partnersEmpty}
          </p>
        )}
      </section>

      <section className="bg-[#F7F8FA] py-20 dark:bg-[#20242A] lg:py-24">
        <div className="section-shell">
          <SectionHeading
            eyebrow={t.brand.name}
            title={t.home.technologyTitle}
            description={t.home.industryNote}
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tech.map((item) => (
              <Link
                key={item}
                href="/products"
                className="st-card-lift flex items-center justify-between gap-3 rounded-2xl border border-[#777F89]/25 bg-white px-5 py-4 text-sm font-semibold text-foreground hover:border-[#F79432] dark:border-white/10 dark:bg-[#30343B]/40 dark:text-white"
              >
                {item}
                <ArrowUpRight className="size-4 text-[#F79432]" aria-hidden="true" />
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {productCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="rounded-full border border-[#777F89]/25 bg-white px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition-colors hover:border-[#F79432] hover:text-[#F79432] dark:border-white/10 dark:bg-[#30343B]/50 dark:text-white/80"
              >
                {text(category.name, locale)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#24272D] py-20 text-white lg:py-24">
        <div aria-hidden="true" className="st-hero-glow absolute -top-40 end-[-12%] size-[32rem]" />
        <div className="section-shell relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="st-eyebrow text-[#FFB15C]">{t.brand.name}</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.home.ctaTitle}
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-white/70">{t.home.finalCtaNote}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="h-12 rounded-full bg-[#F79432] px-6 font-semibold text-primary-foreground hover:bg-[#FFB15C]"
              nativeButton={false}
              render={<Link href="/contact?intent=support" />}
            >
              {t.hero.requestSupport}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-white/35 bg-transparent px-6 font-semibold text-white hover:bg-white/10 hover:text-white"
              nativeButton={false}
              render={<Link href="/request-quote" />}
            >
              {t.hero.requestQuote}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <p className="st-eyebrow">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground dark:text-white sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-4 text-sm leading-7 text-muted-foreground dark:text-white/60">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function Info({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-[#777F89]/25 bg-white p-5 dark:border-white/10 dark:bg-[#30343B]/40">
      <h3 className="font-semibold text-foreground dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-white/60">{body}</p>
    </div>
  );
}
