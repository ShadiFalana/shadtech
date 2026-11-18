"use server";

import { cookies } from "next/headers";
import { isLocale, localeCookieName, type Locale } from "@/lib/dictionaries";

export async function setLocaleAction(locale: Locale) {
  if (!isLocale(locale)) return { ok: false as const };

  const store = await cookies();
  store.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return { ok: true as const, locale };
}
