import { requirePermission } from "@/lib/session";
import { ConfiguredBadge } from "@/components/super-admin/badges";
import { DataTable, type Column } from "@/components/workspace/data-table";
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

type IntegrationRow = {
  key: IntegrationKey;
  labelKey: string;
};

const integrationRows: IntegrationRow[] = [
  { key: "openRouter", labelKey: "integrations.openRouter" },
  { key: "email", labelKey: "integrations.smtp" },
  { key: "payments", labelKey: "integrations.payments" },
  { key: "whatsapp", labelKey: "integrations.whatsapp" },
  { key: "rmm", labelKey: "integrations.rmm" },
  { key: "monitoring", labelKey: "integrations.monitoring" },
  { key: "sms", labelKey: "integrations.sms" },
  { key: "fileStorage", labelKey: "integrations.fileStorage" },
];

export default async function SuperAdminIntegrationsPage() {
  await requirePermission("settings.manage", "admin");
  const t = await getServerDictionary();
  const configuredCount = configuredIntegrationCount();

  const columns: Column<IntegrationRow>[] = [
    {
      key: "name",
      headerKey: "forms.name",
      cell: (row) => <span className="font-medium">{translateKey(t, row.labelKey) ?? row.labelKey}</span>,
    },
    {
      key: "configured",
      headerKey: "common.status",
      cell: (row) => <ConfiguredBadge configured={integrationIsConfigured(row.key)} />,
    },
    {
      key: "setup",
      headerKey: "integrations.setupInstructions",
      cell: (row) => (
        <p className="max-w-2xl text-xs text-muted-foreground">
          {translateKey(t, setupKeyByIntegration[row.key]) ?? ""}
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="superAdmin.integrations" descriptionKey="integrations.subtitle" />
      <StatGrid items={[{ labelKey: "system.integrationCount", value: configuredCount }]} />
      <DataTable rows={integrationRows} columns={columns} />
    </div>
  );
}
