import { AlertTriangle } from "lucide-react";
import { getServerDictionary } from "@/lib/server-i18n";

export async function DemoNotice() {
  const t = await getServerDictionary();
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#FFB15C]/50 bg-[#FFF3E6] p-3 text-sm text-[#6B440C] dark:border-[#F79432]/30 dark:bg-[#F79432]/10 dark:text-[#FFB15C]">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{t.system.demoNotice}</p>
    </div>
  );
}
