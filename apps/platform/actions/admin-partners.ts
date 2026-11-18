"use server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({ name: z.string().min(2), logoUrl: z.string().optional(), website: z.string().optional(), category: z.string().optional() });

export async function createPartner(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const parsed = schema.safeParse({ name: formData.get("name"), logoUrl: formData.get("logoUrl") || undefined, website: formData.get("website") || undefined, category: formData.get("category") || undefined });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.partner.create({ data: parsed.data });
  revalidatePath("/admin/partners"); revalidatePath("/");
  return { ok: true };
}
export async function deletePartner(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.partner.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/partners"); revalidatePath("/");
  return { ok: true };
}
