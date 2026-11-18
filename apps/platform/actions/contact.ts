"use server";

import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  serviceInterest: z.string().trim().max(120).optional(),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(4000),
});

const hits = new Map<string, { count: number; reset: number }>();

function allow(key: string) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + 10 * 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count += 1;
  return true;
}

export async function submitContact(formData: FormData) {
  if (String(formData.get("website") ?? "").trim()) return { ok: true };
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allow(ip)) return { ok: false as const, error: "forms.rateLimitError" as const };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    company: String(formData.get("company") ?? "").trim() || undefined,
    serviceInterest: String(formData.get("serviceInterest") ?? "").trim() || undefined,
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { ok: false as const, error: "forms.validationError" as const };
  await prisma.contactMessage.create({ data: parsed.data });
  return { ok: true };
}
