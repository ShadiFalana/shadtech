import type { Metadata } from "next";
import { PublicShell } from "@/components/public/public-shell";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { getServerDictionary } from "@/lib/server-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerDictionary();
  return { title: t.public.termsTitle };
}

export default async function TermsPage() {
  const t = await getServerDictionary();
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:py-16">
        <PageHeader titleKey="public.termsTitle" />
        <SectionCard titleKey="sections.legal">
          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>{t.public.termsIntro}</p>
            <p>{t.public.termsPricing}</p>
            <p>{t.public.termsAvailability}</p>
          </div>
        </SectionCard>
      </div>
    </PublicShell>
  );
}
