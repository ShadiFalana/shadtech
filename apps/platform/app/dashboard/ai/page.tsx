import { AiChat } from "@/components/portal/ai-chat";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { integrationIsConfigured } from "@/lib/integrations";
import { getServerDictionary } from "@/lib/server-i18n";
import { requireCustomerProfile } from "@/lib/session";

export default async function AIPage() {
  await requireCustomerProfile();
  const t = await getServerDictionary();
  const configured = integrationIsConfigured("openRouter");

  return (
    <div className="space-y-6">
      <PageHeader titleKey="portal.askAI" descriptionKey="common.description" />

      {configured ? (
        <SectionCard titleKey="portal.askAI">
          <AiChat />
        </SectionCard>
      ) : (
        <SectionCard titleKey="integrations.openRouter" descriptionKey="errors.aiNotConfigured">
          <p className="text-sm text-muted-foreground">{t.integrations.notConfigured}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t.integrations.setupOpenRouter}</p>
        </SectionCard>
      )}
    </div>
  );
}
