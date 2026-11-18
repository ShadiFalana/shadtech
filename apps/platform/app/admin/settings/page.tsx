import { prisma } from "@/lib/db";
import { saveSetting } from "@/actions/admin-settings";
import { AdminForm } from "@/components/admin/admin-form";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { translateKey } from "@/lib/dictionaries";
import { getServerDictionary } from "@/lib/server-i18n";
import { requirePermission } from "@/lib/session";

const settingFields = [
  { key: "company_name", labelKey: "forms.company", defaultValue: "ShadTech" },
  { key: "company_email", labelKey: "forms.email", defaultValue: "info@shadtech.com" },
  { key: "company_phone", labelKey: "forms.phone", defaultValue: "+1 000 000 0000" },
  { key: "openrouter_model", labelKey: "integrations.openRouter", defaultValue: "openai/gpt-4o-mini" },
];

export default async function AdminSettingsPage() {
  // Users without settings.manage never see the form (and the action rechecks server-side).
  await requirePermission("settings.manage", "admin");
  const settings = await prisma.systemSetting.findMany();
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const t = await getServerDictionary();

  return (
    <div className="space-y-6">
      <PageHeader titleKey="admin.settings" />
      <DemoNotice />
      <SectionCard titleKey="sections.configuration">
        <div className="space-y-6">
          {settingFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <AdminForm
                action={saveSetting}
                submitKey="common.save"
                hiddenFields={[{ name: "key", value: field.key }]}
                fields={[
                  {
                    name: "value",
                    labelKey: field.labelKey,
                    defaultValue: values[field.key] ?? field.defaultValue,
                  },
                ]}
              />
              {field.key === "openrouter_model" ? (
                <p className="max-w-xl text-xs leading-5 text-muted-foreground">
                  {translateKey(t, "integrations.setupOpenRouter")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
