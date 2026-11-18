import { requirePermission } from "@/lib/session";
import { UnavailablePage } from "@/components/workspace/unavailable-page";

export default async function Page() {
  await requirePermission("tickets.view", "admin");
  return <UnavailablePage workspace="admin" labelKey="navItems.incidents" />;
}
