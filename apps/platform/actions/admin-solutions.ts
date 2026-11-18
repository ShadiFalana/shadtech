"use server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({ title: z.string().min(2), slug: z.string().min(2), description: z.string().min(3), content: z.string().optional(), icon: z.string().optional() });

export async function createSolution(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const parsed = schema.safeParse({ title: formData.get("title"), slug: formData.get("slug"), description: formData.get("description"), content: formData.get("content") || undefined, icon: formData.get("icon") || undefined });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.solution.create({ data: parsed.data });
  revalidatePath("/admin/solutions"); revalidatePath("/solutions");
  return { ok: true };
}
export async function deleteSolution(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.solution.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/solutions"); revalidatePath("/solutions");
  return { ok: true };
}
