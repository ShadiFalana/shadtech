"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/actions/locale";
import {
  getDictionary,
  getDirection,
  type Dictionary,
  type Locale,
} from "@/lib/dictionaries";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  dir: "ltr" | "rtl";
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const dir = getDirection(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem("shadtech-locale", locale);
    } catch {
      // Storage can be unavailable in private browsing; the cookie is authoritative.
    }
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      setLocaleState(next);
      void setLocaleAction(next)
        .then(() => router.refresh())
        .catch(() => {
          // Keep the in-memory locale if the cookie cannot be persisted.
        });
    },
    [locale, router],
  );

  const value: LanguageContextValue = {
    locale,
    setLocale,
    t: getDictionary(locale),
    dir: getDirection(locale),
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
