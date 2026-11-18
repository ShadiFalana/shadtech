import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicShell } from "@/components/public/public-shell";
import { PageHeader } from "@/components/workspace/page-header";
import { prisma } from "@/lib/db";
import { type Locale } from "@/lib/dictionaries";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerDictionary();
  return { title: t.public.pricingTitle };
}

function formatPrice(amount: number, currency: string, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`.trim();
  }
}

export default async function PricingPage() {
  const [t, locale] = await Promise.all([getServerDictionary(), getServerLocale()]);
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true, priceMonthly: { gt: 0 } },
    orderBy: { priceMonthly: "asc" },
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <PageHeader titleKey="public.pricingTitle" descriptionKey="public.pricingSubtitle" />

        {plans.length === 0 ? (
          <Card className="mt-8 border-[#E4E7EC] bg-gradient-to-br from-[#F79432]/10 to-transparent shadow-sm dark:border-white/10">
            <CardContent className="flex flex-col items-start gap-5 py-10 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-sm leading-7 text-muted-foreground">{t.public.noPublishedPlans}</p>
              <Button
                nativeButton={false}
                render={<Link href="/request-quote" />}
                className="rounded-full bg-[#F79432] px-6 text-primary-foreground hover:bg-[#FFB15C]"
              >
                {t.public.requestQuotation}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`overflow-hidden border-[#E4E7EC] shadow-sm dark:border-white/10 ${
                  plan.isPopular ? "ring-2 ring-[#F79432]" : ""
                }`}
              >
                <div className="h-1.5 bg-gradient-to-r from-[#F79432] via-[#FFB15C] to-[#F79432]" />
                <CardHeader>
                  <CardTitle className="text-xl text-foreground dark:text-white">{plan.name}</CardTitle>
                  {plan.description && (
                    <p className="text-sm leading-6 text-muted-foreground">{plan.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-3xl font-bold text-foreground dark:text-white">
                    {formatPrice(plan.priceMonthly, plan.currency, locale)}
                  </p>
                  {plan.features.length > 0 && (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {plan.features.map((feature, index) => (
                        <li key={`${plan.id}-feature-${index}`} className="flex gap-2">
                          <span aria-hidden="true" className="text-[#F79432]">
                            •
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    nativeButton={false}
                    render={<Link href="/request-quote" />}
                    className="w-full rounded-full bg-[#F79432] text-primary-foreground hover:bg-[#FFB15C]"
                  >
                    {t.public.requestQuotation}
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
