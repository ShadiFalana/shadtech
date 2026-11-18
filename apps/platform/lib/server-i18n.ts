import { cookies } from "next/headers";
import {
  getDictionary,
  isLocale,
  localeCookieName,
  type Dictionary,
  type Locale,
} from "@/lib/dictionaries";

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get(localeCookieName)?.value;
  return isLocale(raw) ? raw : "en";
}

export async function getServerDictionary(): Promise<Dictionary> {
  return getDictionary(await getServerLocale());
}
