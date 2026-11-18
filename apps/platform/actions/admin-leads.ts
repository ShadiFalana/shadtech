"use server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({ name: z.string().min(2), email: z.string().optional(), phone: z.string().optional(), company: z.string().optional(), source: z.string().optional(), status: z.string().optional() });

export async function createLead(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const parsed = schema.safeParse({ name: formData.get("name"), email: formData.get("email") || undefined, phone: formData.get("phone") || undefined, company: formData.get("company") || undefined, source: formData.get("source") || undefined, status: formData.get("status") || undefined });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.lead.create({ data: parsed.data });
  revalidatePath("/admin/leads");
  return { ok: true };
}
export async function deleteLead(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.lead.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/leads");
  return { ok: true };
}
