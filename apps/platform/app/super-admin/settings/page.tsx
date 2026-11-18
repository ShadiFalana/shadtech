import { requirePermission } from "@/lib/session";
import Link from "next/link";
import { PlatformSettingForm } from "@/components/super-admin/platform-forms";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/workspace/data-table";
import { DetailsGrid } from "@/components/workspace/details-grid";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { configuredIntegrationCount } from "@/lib/integrations";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

type SettingRow = {
  id: string;
  key: string;
  value: string;
  updatedAt: Date;
};

export default async function SuperAdminSettingsPage() {
  await requirePermission("settings.manage", "admin");
  const locale = await getServerLocale();
  const t = await getServerDictionary();

  const settings = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } });

  let databaseConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseConnected = true;
  } catch {
    databaseConnected = false;
  }

  const columns: Column<SettingRow>[] = [
    { key: "key", headerKey: "forms.code", cell: (row) => <code className="text-xs">{row.key}</code> },
    {
      key: "value",
      headerKey: "forms.value",
      cell: (row) => <p className="break-words text-sm">{row.value}</p>,
    },
    {
      key: "updatedAt",
      headerKey: "common.updatedAt",
      cell: (row) => <span className="whitespace-nowrap text-xs">{formatDateTime(row.updatedAt, locale)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="superAdmin.platformSettings" descriptionKey="sections.configuration" />

      <SectionCard titleKey="common.settings" descriptionKey="sections.configuration">
        <PlatformSettingForm />
      </SectionCard>

      <SectionCard titleKey="sections.records">
        <DataTable rows={settings} columns={columns} />
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard titleKey="integrations.title">
          <DetailsGrid
            items={[
              { labelKey: "system.integrationCount", value: configuredIntegrationCount() },
            ]}
          />
          <div className="mt-4">
            <Button nativeButton={false} variant="outline" render={<Link href="/super-admin/integrations" />}>
              {t.actions.reviewConfiguration}
            </Button>
          </div>
        </SectionCard>

        <SectionCard titleKey="system.healthTitle">
          <DetailsGrid
            items={[
              {
                labelKey: "system.database",
                value: databaseConnected ? t.system.connected : t.system.disconnected,
              },
              { labelKey: "system.environment", value: process.env.NODE_ENV || "—" },
            ]}
          />
          <div className="mt-4">
            <Button nativeButton={false} variant="outline" render={<Link href="/super-admin/system-health" />}>
              {t.common.view}
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
