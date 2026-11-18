"use client";

import { useLanguage } from "@/components/providers/language-provider";
import type { Copy } from "@/lib/public-catalog";

export function T({ copy, en, ar }: { copy?: Copy; en?: string; ar?: string }) {
  const { locale } = useLanguage();
  if (copy) return <>{locale === "ar" ? copy.ar : copy.en}</>;
  return <>{locale === "ar" ? ar : en}</>;
}
