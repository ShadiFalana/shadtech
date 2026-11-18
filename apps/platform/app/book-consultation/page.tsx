import type { Metadata } from "next";
import { ConsultationForm } from "@/components/public/consultation-form";
import { PublicShell } from "@/components/public/public-shell";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { getServerDictionary } from "@/lib/server-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerDictionary();
  return { title: t.public.consultationTitle };
}

export default async function BookConsultationPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <PageHeader
          titleKey="public.consultationTitle"
          descriptionKey="public.consultationSubtitle"
        />
        <div className="mt-8">
          <SectionCard titleKey="sections.details">
            <ConsultationForm />
          </SectionCard>
        </div>
      </div>
    </PublicShell>
  );
}
