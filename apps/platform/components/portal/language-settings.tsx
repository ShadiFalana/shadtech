"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";

export function LanguageSettings() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant={locale === "en" ? "default" : "outline"}
        onClick={() => setLocale("en")}
        aria-label={t.common.language}
      >
        EN
      </Button>
      <Button
        type="button"
        variant={locale === "ar" ? "default" : "outline"}
        onClick={() => setLocale("ar")}
        aria-label={t.common.language}
      >
        عربي
      </Button>
    </div>
  );
}
