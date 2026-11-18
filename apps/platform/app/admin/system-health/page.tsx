import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { DetailsGrid } from "@/components/workspace/details-grid";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatGrid } from "@/components/workspace/stat-grid";
import { configuredIntegrationCount } from "@/lib/integrations";
import { getServerDictionary } from "@/lib/server-i18n";

export default async function AdminSystemHealthPage() {
  await requirePermission("settings.manage", "admin");
  let databaseConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseConnected = true;
  } catch {
    databaseConnected = false;
  }

  const t = await getServerDictionary();
  const environment = process.env.NODE_ENV ?? "production";

  return (
    <div className="space-y-6">
      <PageHeader titleKey="admin.systemHealth" />
      <DemoNotice />
      <StatGrid
        items={[
          {
            labelKey: "system.database",
            value: databaseConnected ? t.system.connected : t.system.disconnected,
          },
          { labelKey: "system.migrations", value: t.system.applied },
          { labelKey: "system.integrationCount", value: configuredIntegrationCount() },
          { labelKey: "system.environment", value: environment },
        ]}
      />
      <SectionCard titleKey="system.healthTitle">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={databaseConnected ? "default" : "destructive"}>
              {databaseConnected ? t.system.connected : t.system.disconnected}
            </Badge>
            <Badge variant="secondary">{t.system.applied}</Badge>
          </div>
          <DetailsGrid
            items={[
              { labelKey: "system.database", value: databaseConnected ? t.system.connected : t.system.disconnected },
              { labelKey: "system.migrations", value: t.system.applied },
              { labelKey: "system.environment", value: environment },
              { labelKey: "system.integrationCount", value: configuredIntegrationCount() },
            ]}
          />
        </div>
      </SectionCard>
    </div>
  );
}
