import { translateKey } from "@/lib/dictionaries";
import { getServerDictionary } from "@/lib/server-i18n";

export type DetailItem = {
  labelKey: string;
  value: React.ReactNode;
};

export async function DetailsGrid({ items }: { items: DetailItem[] }) {
  const t = await getServerDictionary();
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.labelKey} className="rounded-lg border border-[#E4E7EC] p-3 dark:border-white/10">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {translateKey(t, item.labelKey) ?? item.labelKey}
          </dt>
          <dd className="mt-1 break-words text-sm font-medium">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
