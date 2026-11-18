import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { translateKey } from "@/lib/dictionaries";
import { getServerDictionary } from "@/lib/server-i18n";

export async function LoadingBlock({ labelKey = "common.loading" }: { labelKey?: string }) {
  const t = await getServerDictionary();
  const label = translateKey(t, labelKey) ?? t.common.loading;
  return (
    <div className="section-shell py-10" role="status" aria-live="polite" aria-busy="true">
      <div className="surface-card p-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          <span>{label}</span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="mt-6 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export async function EmptyBlock({ messageKey = "common.noData" }: { messageKey?: string }) {
  const t = await getServerDictionary();
  return (
    <div className="surface-card flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-orange/10 text-brand-orange">
        <Inbox className="size-5" />
      </span>
      <p className="text-sm text-muted-foreground">{translateKey(t, messageKey) ?? messageKey}</p>
    </div>
  );
}

export async function ErrorBlock({ messageKey = "errors.generic" }: { messageKey?: string }) {
  const t = await getServerDictionary();
  return (
    <div className="surface-card flex flex-col items-center justify-center gap-3 px-6 py-12 text-center" role="alert">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </span>
      <p className="text-sm text-muted-foreground">{translateKey(t, messageKey) ?? messageKey}</p>
    </div>
  );
}
