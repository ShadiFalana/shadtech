"use server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({ title: z.string().min(2), slug: z.string().min(2), excerpt: z.string().optional(), content: z.string().min(3), isPublished: z.boolean().optional() });

export async function createBlogPost(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  const parsed = schema.safeParse({ title: formData.get("title"), slug: formData.get("slug"), excerpt: formData.get("excerpt") || undefined, content: formData.get("content"), isPublished: formData.get("isPublished") === "on" });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.blogPost.create({ data: { title: parsed.data.title, slug: parsed.data.slug, excerpt: parsed.data.excerpt, content: parsed.data.content, isPublished: parsed.data.isPublished ?? false, publishedAt: parsed.data.isPublished ? new Date() : null } });
  revalidatePath("/admin/blog"); revalidatePath("/blog");
  return { ok: true };
}
export async function deleteBlogPost(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]);
  await prisma.blogPost.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/blog"); revalidatePath("/blog");
  return { ok: true };
}
