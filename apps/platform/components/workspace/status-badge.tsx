import { Badge } from "@/components/ui/badge";
import { getServerDictionary } from "@/lib/server-i18n";

export async function StatusBadge({
  value,
  kind = "status",
}: {
  value: string | null | undefined;
  kind?: "status" | "priority";
}) {
  const t = await getServerDictionary();
  const source = kind === "priority" ? t.priorities : t.statuses;
  const label = value ? (source as Record<string, string>)[value] ?? value : "—";
  const tone =
    value === "OPEN" ||
    value === "CRITICAL" ||
    value === "HIGH" ||
    value === "OVERDUE" ||
    value === "FAILED"
      ? "destructive"
      : value === "RESOLVED" || value === "PAID" || value === "SUCCESS" || value === "ACTIVE"
        ? "default"
        : "outline";

  return <Badge variant={tone}>{label}</Badge>;
}
