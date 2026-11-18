import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { DetailsGrid } from "@/components/workspace/details-grid";
import { StatGrid } from "@/components/workspace/stat-grid";
import { translateKey } from "@/lib/dictionaries";
import { integrationIsConfigured, setupKeyByIntegration } from "@/lib/integrations";
import { getServerDictionary } from "@/lib/server-i18n";

export default async function AdminAiSettingsPage() {
  await requirePermission("settings.manage", "admin");
  const [t, conversations, modelSetting] = await Promise.all([
    getServerDictionary(),
    prisma.aIConversation.count(),
    prisma.systemSetting.findUnique({ where: { key: "openrouter_model" } }),
  ]);

  const configured = integrationIsConfigured("openRouter");

  return (
    <div className="space-y-6">
      <PageHeader titleKey="admin.aiSettings" />
      <StatGrid
        items={[
          {
            labelKey: "integrations.openRouter",
            value: configured ? t.integrations.configured : t.integrations.notConfigured,
          },
          { labelKey: "sections.records", value: conversations },
        ]}
      />
      <SectionCard titleKey="integrations.openRouter">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={configured ? "default" : "outline"}>
              {configured ? t.integrations.configured : t.integrations.notConfigured}
            </Badge>
            {!configured && <Badge variant="secondary">{t.public.configurationRequired}</Badge>}
          </div>
          {!configured && <p className="text-sm text-muted-foreground">{t.errors.aiNotConfigured}</p>}
          <DetailsGrid
            items={[
              {
                labelKey: "integrations.setupInstructions",
                value: translateKey(t, setupKeyByIntegration.openRouter) ?? setupKeyByIntegration.openRouter,
              },
              { labelKey: "forms.code", value: modelSetting?.value ?? "—" },
            ]}
          />
        </div>
      </SectionCard>
    </div>
  );
}
