import { requirePermission } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/workspace/data-table";
import { PageHeader } from "@/components/workspace/page-header";
import { StatGrid } from "@/components/workspace/stat-grid";
import { translateKey } from "@/lib/dictionaries";
import {
  configuredIntegrationCount,
  integrationIsConfigured,
  setupKeyByIntegration,
  type IntegrationKey,
} from "@/lib/integrations";
import { getServerDictionary } from "@/lib/server-i18n";

const integrations: Array<{ key: IntegrationKey; titleKey: string }> = [
  { key: "openRouter", titleKey: "integrations.openRouter" },
  { key: "email", titleKey: "integrations.smtp" },
  { key: "payments", titleKey: "integrations.payments" },
  { key: "whatsapp", titleKey: "integrations.whatsapp" },
  { key: "rmm", titleKey: "integrations.rmm" },
  { key: "monitoring", titleKey: "integrations.monitoring" },
  { key: "sms", titleKey: "integrations.sms" },
  { key: "fileStorage", titleKey: "integrations.fileStorage" },
];

export default async function AdminIntegrationsPage() {
  await requirePermission("settings.manage", "admin");
  const t = await getServerDictionary();
  const rows = integrations.map((integration) => ({
    ...integration,
    configured: integrationIsConfigured(integration.key),
    setupKey: setupKeyByIntegration[integration.key],
  }));

  return (
    <div className="space-y-6">
      <PageHeader titleKey="integrations.title" descriptionKey="integrations.subtitle" />
      <StatGrid items={[{ labelKey: "system.integrationCount", value: configuredIntegrationCount() }]} />
      <DataTable
        emptyKey="common.noData"
        rows={rows}
        columns={[
          {
            key: "name",
            headerKey: "integrations.title",
            cell: (row) => translateKey(t, row.titleKey) ?? row.titleKey,
          },
          {
            key: "status",
            headerKey: "common.status",
            cell: (row) => (
              <Badge variant={row.configured ? "default" : "outline"}>
                {row.configured ? t.integrations.configured : t.integrations.notConfigured}
              </Badge>
            ),
          },
          {
            key: "setup",
            headerKey: "integrations.setupInstructions",
            cell: (row) => translateKey(t, row.setupKey) ?? row.setupKey,
          },
        ]}
      />
    </div>
  );
}
