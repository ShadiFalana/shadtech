import type { Metadata } from "next";
import { QuoteForm } from "@/components/public/quote-form";
import { PublicShell } from "@/components/public/public-shell";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { getServerDictionary } from "@/lib/server-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerDictionary();
  return { title: t.public.quoteTitle };
}

export default async function RequestQuotePage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <PageHeader titleKey="public.quoteTitle" descriptionKey="public.quoteSubtitle" />
        <div className="mt-8">
          <SectionCard titleKey="sections.details">
            <QuoteForm />
          </SectionCard>
        </div>
      </div>
    </PublicShell>
  );
}
