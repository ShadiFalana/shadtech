"use server";

import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(5),
  shortDescription: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function createService(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const parsed = schema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    shortDescription: formData.get("shortDescription") || undefined,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.service.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      shortDescription: parsed.data.shortDescription,
      isActive: parsed.data.isActive ?? true,
    },
  });
  revalidatePath("/admin/services");
  revalidatePath("/services");
  return { ok: true };
}

export async function deleteService(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const id = String(formData.get("id"));
  await prisma.service.delete({ where: { id } });
  revalidatePath("/admin/services");
  revalidatePath("/services");
  return { ok: true };
}

export async function toggleService(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const id = String(formData.get("id"));
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) return { ok: false };
  await prisma.service.update({ where: { id }, data: { isActive: !service.isActive } });
  revalidatePath("/admin/services");
  revalidatePath("/services");
  return { ok: true };
}
