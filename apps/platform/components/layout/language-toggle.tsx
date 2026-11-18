"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "cn";

export function LanguageToggle({
  compact = false,
  className,
  onSurface = "light",
}: {
  compact?: boolean;
  className?: string;
  onSurface?: "light" | "dark";
}) {
  const { locale, setLocale, t } = useLanguage();
  const next = locale === "ar" ? "EN" : "عربي";
  const label = locale === "ar" ? "English" : "العربية";

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors focus-brand",
        compact ? "size-9" : "h-9 px-3",
        onSurface === "dark"
          ? "text-white/85 hover:bg-white/10 hover:text-white"
          : "text-muted-foreground hover:bg-brand-canvas hover:text-foreground dark:hover:bg-brand-slate",
        className,
      )}
      aria-label={`${t.common.language}: ${label}`}
      title={`${t.common.language}: ${label}`}
    >
      {compact ? <Languages className="size-4" /> : <span dir="auto">{next}</span>}
    </button>
  );
}
