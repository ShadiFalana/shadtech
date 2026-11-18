import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { translateKey } from "@/lib/dictionaries";
import { getServerDictionary } from "@/lib/server-i18n";

export type StatItem = {
  labelKey: string;
  value: string | number;
  hint?: string;
};

export async function StatGrid({ items }: { items: StatItem[] }) {
  const t = await getServerDictionary();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.labelKey} className="border-[#E4E7EC] shadow-sm dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {translateKey(t, item.labelKey) ?? item.labelKey}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground dark:text-white">{item.value}</p>
            {item.hint && <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
