import Link from "next/link";
import { Construction } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/workspace/page-header";
import { translateKey } from "@/lib/dictionaries";
import { workspaceMeta, type Workspace } from "@/lib/navigation";
import { getServerDictionary } from "@/lib/server-i18n";

export async function UnavailablePage({ workspace, labelKey }: { workspace: Workspace; labelKey: string }) {
  const t = await getServerDictionary();
  const meta = workspaceMeta[workspace];

  return (
    <div className="space-y-6">
      <PageHeader titleKey={labelKey} descriptionKey="unavailable.description" />
      <div className="surface-card flex flex-col items-center px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-orange/12 text-brand-orange">
          <Construction className="size-6" />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-foreground">
          {translateKey(t, "unavailable.title") ?? "unavailable.title"}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
          {translateKey(t, "unavailable.help") ?? "unavailable.help"}
        </p>
        <Link href={meta.homeHref} className={buttonVariants({ variant: "brand", size: "xl", className: "mt-6" })}>
          {translateKey(t, "unavailable.back") ?? "unavailable.back"}
        </Link>
      </div>
    </div>
  );
}
