import { PublicShell } from "@/components/public/public-shell";
import { getServerDictionary } from "@/lib/server-i18n";

export const metadata = { title: "Offline" };

export default async function OfflinePage() {
  const t = await getServerDictionary();
  return (
    <PublicShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">{t.public.offlineTitle}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t.public.offlineMessage}</p>
      </div>
    </PublicShell>
  );
}
