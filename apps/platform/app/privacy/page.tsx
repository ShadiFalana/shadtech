import type { Metadata } from "next";
import { PublicShell } from "@/components/public/public-shell";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { getServerDictionary } from "@/lib/server-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerDictionary();
  return { title: t.public.privacyTitle };
}

export default async function PrivacyPage() {
  const t = await getServerDictionary();
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:py-16">
        <PageHeader titleKey="public.privacyTitle" />
        <SectionCard titleKey="sections.dataPolicy">
          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>{t.public.privacyIntro}</p>
            <p>{t.public.privacyData}</p>
          </div>
        </SectionCard>
        <SectionCard titleKey="sections.contactDetails">
          <p className="text-sm leading-7 text-muted-foreground">{t.public.privacyContact}</p>
        </SectionCard>
      </div>
    </PublicShell>
  );
}
