import { requirePermission } from "@/lib/session";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DetailsGrid } from "@/components/workspace/details-grid";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { prisma } from "@/lib/db";
import { configuredIntegrationCount } from "@/lib/integrations";
import { getServerDictionary } from "@/lib/server-i18n";

export default async function SuperAdminSystemHealthPage() {
  await requirePermission("settings.manage", "admin");
  const t = await getServerDictionary();

  let databaseConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseConnected = true;
  } catch {
    databaseConnected = false;
  }

  const environment = process.env.NODE_ENV || "—";

  return (
    <div className="space-y-6">
      <PageHeader titleKey="superAdmin.systemHealth" descriptionKey="public.statusDescription" />

      <SectionCard titleKey="system.healthTitle">
        <DetailsGrid
          items={[
            {
              labelKey: "system.database",
              value: databaseConnected ? t.system.connected : t.system.disconnected,
            },
            { labelKey: "system.environment", value: environment },
            { labelKey: "system.integrationCount", value: configuredIntegrationCount() },
          ]}
        />
      </SectionCard>

      <Button nativeButton={false} render={<Link href="/super-admin/integrations" />}>
        {t.actions.reviewConfiguration}
      </Button>
    </div>
  );
}
