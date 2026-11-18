import { translateKey } from "@/lib/dictionaries";
import { getServerDictionary } from "@/lib/server-i18n";

export async function PageHeader({
  titleKey,
  descriptionKey,
  children,
}: {
  titleKey: string;
  descriptionKey?: string;
  children?: React.ReactNode;
}) {
  const t = await getServerDictionary();
  const title = translateKey(t, titleKey) ?? titleKey;
  const description = descriptionKey ? translateKey(t, descriptionKey) : undefined;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
