"use server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const catSchema = z.object({ name: z.string().min(2), slug: z.string().min(2), description: z.string().optional() });
const prodSchema = z.object({ name: z.string().min(2), slug: z.string().min(2), description: z.string().min(3), manufacturer: z.string().optional(), categoryId: z.string().optional(), availability: z.string().optional() });

export async function createProductCategory(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const parsed = catSchema.safeParse({ name: formData.get("name"), slug: formData.get("slug"), description: formData.get("description") || undefined });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.productCategory.create({ data: parsed.data });
  revalidatePath("/admin/products"); revalidatePath("/products");
  return { ok: true };
}
export async function createProduct(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const parsed = prodSchema.safeParse({ name: formData.get("name"), slug: formData.get("slug"), description: formData.get("description"), manufacturer: formData.get("manufacturer") || undefined, categoryId: formData.get("categoryId") || undefined, availability: formData.get("availability") || undefined });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.product.create({ data: { name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description, manufacturer: parsed.data.manufacturer, categoryId: parsed.data.categoryId === "none" ? undefined : parsed.data.categoryId, availability: parsed.data.availability ?? "On Request" } });
  revalidatePath("/admin/products"); revalidatePath("/products");
  return { ok: true };
}
export async function deleteProduct(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.product.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/products"); revalidatePath("/products");
  return { ok: true };
}
