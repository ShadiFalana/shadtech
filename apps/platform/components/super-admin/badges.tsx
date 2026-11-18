import { Badge } from "@/components/ui/badge";
import { getServerDictionary } from "@/lib/server-i18n";

/** Translated active/inactive state from a boolean database field. */
export async function ActiveBadge({ active }: { active: boolean }) {
  const t = await getServerDictionary();
  return (
    <Badge variant={active ? "default" : "outline"}>
      {active ? t.common.active : t.common.inactive}
    </Badge>
  );
}

/** Visibly marks records that come from the demo seed. */
export async function DemoBadge() {
  const t = await getServerDictionary();
  return <Badge variant="secondary">{t.common.demo}</Badge>;
}

/** Translated configured/not-configured state for an integration or service. */
export async function ConfiguredBadge({ configured }: { configured: boolean }) {
  const t = await getServerDictionary();
  return (
    <Badge variant={configured ? "default" : "outline"}>
      {configured ? t.integrations.configured : t.integrations.notConfigured}
    </Badge>
  );
}
