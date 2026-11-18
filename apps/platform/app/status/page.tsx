import type { Metadata } from "next";
import { PublicShell } from "@/components/public/public-shell";
import { DetailsGrid, type DetailItem } from "@/components/workspace/details-grid";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { integrationIsConfigured } from "@/lib/integrations";
import { getServerDictionary } from "@/lib/server-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerDictionary();
  return { title: t.public.statusTitle };
}

export default async function StatusPage() {
  const t = await getServerDictionary();

  const statusValue = (ready: boolean) => (
    <span
      className={
        ready
          ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
          : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
      }
    >
      {ready ? t.public.ready : t.public.configurationRequired}
    </span>
  );

  const items: DetailItem[] = [
    { labelKey: "public.serviceDesk", value: t.public.notMonitored },
    {
      labelKey: "public.aiAssistant",
      value: statusValue(integrationIsConfigured("openRouter")),
    },
    {
      labelKey: "public.emailDelivery",
      value: statusValue(integrationIsConfigured("email")),
    },
    {
      labelKey: "public.paymentGateway",
      value: statusValue(integrationIsConfigured("payments")),
    },
    {
      labelKey: "integrations.monitoring",
      value: statusValue(integrationIsConfigured("monitoring")),
    },
  ];

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-12 sm:py-16">
        <PageHeader titleKey="public.statusTitle" descriptionKey="public.statusDescription" />
        {!integrationIsConfigured("monitoring") && (
          <p className="rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm leading-7 text-muted-foreground dark:bg-[#30343B]/40 dark:text-white/65">
            {t.public.statusNoMonitoring}
          </p>
        )}
        <SectionCard titleKey="sections.configuration">
          <DetailsGrid items={items} />
        </SectionCard>
      </div>
    </PublicShell>
  );
}
