"use server";

import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  priceMonthly: z.coerce.number().min(0),
  priceYearly: z.coerce.number().min(0),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function createPlan(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const parsed = schema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    priceMonthly: formData.get("priceMonthly"),
    priceYearly: formData.get("priceYearly"),
    isPopular: formData.get("isPopular") === "on",
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.subscriptionPlan.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      priceMonthly: parsed.data.priceMonthly,
      priceYearly: parsed.data.priceYearly,
      isPopular: parsed.data.isPopular ?? false,
      isActive: parsed.data.isActive ?? true,
      features: [],
    },
  });
  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  return { ok: true };
}

export async function deletePlan(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const id = String(formData.get("id"));
  await prisma.subscriptionPlan.delete({ where: { id } });
  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  return { ok: true };
}
