"use server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({ name: z.string().min(2), description: z.string().optional(), status: z.string().optional() });

export async function createProject(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const parsed = schema.safeParse({ name: formData.get("name"), description: formData.get("description") || undefined, status: formData.get("status") || undefined });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.project.create({ data: parsed.data });
  revalidatePath("/admin/projects");
  return { ok: true };
}
export async function deleteProject(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.project.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/projects");
  return { ok: true };
}
