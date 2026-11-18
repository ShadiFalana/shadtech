"use server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({ title: z.string().min(2), slug: z.string().min(2), category: z.string().optional(), content: z.string().min(3), isPublished: z.boolean().optional() });

export async function createArticle(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const parsed = schema.safeParse({ title: formData.get("title"), slug: formData.get("slug"), category: formData.get("category") || undefined, content: formData.get("content"), isPublished: formData.get("isPublished") === "on" });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.knowledgeArticle.create({ data: { title: parsed.data.title, slug: parsed.data.slug, category: parsed.data.category, content: parsed.data.content, isPublished: parsed.data.isPublished ?? false } });
  revalidatePath("/admin/knowledge"); revalidatePath("/knowledge");
  return { ok: true };
}
export async function deleteArticle(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  await prisma.knowledgeArticle.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/knowledge"); revalidatePath("/knowledge");
  return { ok: true };
}
