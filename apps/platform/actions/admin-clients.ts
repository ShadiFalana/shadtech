"use server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({ name: z.string().min(2), logoUrl: z.string().optional(), website: z.string().optional() });

export async function createClient(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const parsed = schema.safeParse({ name: formData.get("name"), logoUrl: formData.get("logoUrl") || undefined, website: formData.get("website") || undefined });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.client.create({ data: parsed.data });
  revalidatePath("/admin/clients"); revalidatePath("/");
  return { ok: true };
}
export async function deleteClient(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.client.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/clients"); revalidatePath("/");
  return { ok: true };
}
