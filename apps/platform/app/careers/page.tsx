import type { Metadata } from "next";
import { PublicShell } from "@/components/public/public-shell";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { getServerDictionary } from "@/lib/server-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerDictionary();
  return { title: t.nav.careers };
}

export default async function CareersPage() {
  const t = await getServerDictionary();
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <PageHeader titleKey="public.careersTitle" descriptionKey="public.careersSubtitle" />
        <div className="mt-8">
          <SectionCard titleKey="sections.overview">
            <p className="text-sm leading-7 text-muted-foreground">{t.public.noOpenRoles}</p>
          </SectionCard>
        </div>
      </div>
    </PublicShell>
  );
}
