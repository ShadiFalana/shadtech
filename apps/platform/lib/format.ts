import type { Locale } from "@/lib/dictionaries";

export function formatDate(value: Date | string | null | undefined, locale: Locale = "en") {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    dateStyle: "medium",
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined, locale: Locale = "en") {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatMoney(value: number | null | undefined, locale: Locale = "en", currency = "USD") {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
