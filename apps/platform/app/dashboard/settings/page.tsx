import { LanguageSettings } from "@/components/portal/language-settings";
import { DetailsGrid, type DetailItem } from "@/components/workspace/details-grid";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { requireCustomerProfile } from "@/lib/session";

export default async function SettingsPage() {
  const { profile } = await requireCustomerProfile();

  const details: DetailItem[] = [
    { labelKey: "common.language", value: profile.locale },
    { labelKey: "common.theme", value: profile.theme },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.settings" descriptionKey="sections.configuration" />
      <SectionCard titleKey="sections.configuration">
        <DetailsGrid items={details} />
      </SectionCard>
      <SectionCard titleKey="actions.switchLanguage">
        <LanguageSettings />
      </SectionCard>
    </div>
  );
}
