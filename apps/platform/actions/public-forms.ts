"use server";

import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const quoteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  service: z.string().trim().min(2).max(120),
  details: z.string().trim().min(10).max(4000),
});

const consultationSchema = quoteSchema.extend({
  preferredTime: z.string().trim().min(1),
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

async function clientKey() {
  const hdrs = await headers();
  return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function submitQuoteRequest(formData: FormData) {
  if (String(formData.get("website") ?? "").trim()) return { ok: true as const };
  if (!(await allow(`quote:${await clientKey()}`))) return { ok: false as const, error: "rateLimit" as const };

  const parsed = quoteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    company: String(formData.get("company") ?? "").trim() || undefined,
    service: formData.get("service"),
    details: formData.get("details"),
  });
  if (!parsed.success) return { ok: false as const, error: "validation" as const };

  await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      company: parsed.data.company ?? null,
      serviceInterest: parsed.data.service,
      subject: `Quote request: ${parsed.data.service}`,
      message: parsed.data.details,
    },
  });
  revalidatePath("/admin/messages");
  return { ok: true as const };
}

export async function submitConsultationRequest(formData: FormData) {
  if (String(formData.get("website") ?? "").trim()) return { ok: true as const };
  if (!(await allow(`consultation:${await clientKey()}`))) return { ok: false as const, error: "rateLimit" as const };

  const parsed = consultationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    company: String(formData.get("company") ?? "").trim() || undefined,
    service: formData.get("service"),
    details: formData.get("details"),
    preferredTime: formData.get("preferredTime"),
  });
  if (!parsed.success) return { ok: false as const, error: "validation" as const };

  const startsAt = new Date(parsed.data.preferredTime);
  if (Number.isNaN(startsAt.getTime())) return { ok: false as const, error: "validation" as const };

  await prisma.$transaction([
    prisma.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
        company: parsed.data.company ?? null,
        serviceInterest: parsed.data.service,
        subject: `Consultation request: ${parsed.data.service}`,
        message: `${parsed.data.details}\n\nPreferred time: ${parsed.data.preferredTime}`,
      },
    }),
    prisma.appointment.create({
      data: {
        title: `Consultation request — ${parsed.data.service}`,
        startsAt,
        location: "To be confirmed",
        notes: `Requested by ${parsed.data.name} (${parsed.data.email}). Confirmation is pending.`,
        status: "SCHEDULED",
      },
    }),
  ]);

  revalidatePath("/admin/appointments");
  revalidatePath("/admin/messages");
  return { ok: true as const };
}
