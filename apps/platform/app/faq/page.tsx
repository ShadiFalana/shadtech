import { FaqList } from "@/components/faq-list";
import { PageHeader } from "@/components/workspace/page-header";
import { PublicShell } from "@/components/public/public-shell";
import { prisma } from "@/lib/db";
import { servicesCatalog, text } from "@/lib/public-catalog";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import Link from "next/link";

export async function generateMetadata() {
  const t = await getServerDictionary();
  return { title: t.nav.faq };
}

export default async function FaqPage() {
  const [faqs, t, locale] = await Promise.all([
    prisma.fAQ.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    getServerDictionary(),
    getServerLocale(),
  ]);
  const serviceFaqs = servicesCatalog.filter((service) => service.faqs.length > 0);

  return (
    <PublicShell>
      <div className="section-shell py-16">
        <PageHeader titleKey="nav.faq" />
        {locale === "ar" && (
          <p className="mt-4 rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm text-muted-foreground dark:bg-[#30343B]/40 dark:text-white/65">
            {t.public.faqEnglishNote}
          </p>
        )}
        <div className="mt-8">
          <FaqList faqs={faqs} />
        </div>

        {serviceFaqs.length > 0 && (
          <section className="mt-16">
            <p className="st-eyebrow">{t.nav.services}</p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground dark:text-white">
              {t.public.serviceFaq}
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {serviceFaqs.map((service) => (
                <div
                  key={service.slug}
                  className="rounded-3xl border border-[#777F89]/25 bg-white p-6 dark:bg-[#30343B]/40"
                >
                  <Link
                    href={`/services/${service.slug}`}
                    className="text-base font-semibold text-foreground hover:text-[#F79432] dark:text-white"
                  >
                    {text(service.name, locale)}
                  </Link>
                  <div className="mt-4 space-y-3">
                    {service.faqs.map((faq, index) => (
                      <details
                        key={`${faq.q.en}-${index}`}
                        className="rounded-2xl bg-[#F7F8FA] p-4 dark:bg-[#24272D]/60"
                      >
                        <summary className="cursor-pointer text-sm font-semibold text-foreground dark:text-white">
                          {text(faq.q, locale)}
                        </summary>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground dark:text-white/65">
                          {text(faq.a, locale)}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </PublicShell>
  );
}
