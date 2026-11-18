import ar from "@/i18n/ar.json";
import en from "@/i18n/en.json";

export type Locale = "en" | "ar";
export type Dictionary = typeof en;

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  ar: ar as Dictionary,
};

export const localeCookieName = "shadtech-locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ar";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Resolve dot-separated keys such as `nav.home` from a dictionary. */
export function translateKey(dictionary: Dictionary, key: string | undefined): string | undefined {
  if (!key) return undefined;
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionary);
  return typeof value === "string" ? value : undefined;
}
