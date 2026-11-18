"use server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(3),
  challenges: z.string().optional(),
  solutions: z.string().optional(),
});

export async function createIndustry(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const parsed = schema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    challenges: formData.get("challenges") || undefined,
    solutions: formData.get("solutions") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.industry.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      challenges: parsed.data.challenges ? parsed.data.challenges.split("\n").map((s) => s.trim()).filter(Boolean) : [],
      solutions: parsed.data.solutions ? parsed.data.solutions.split("\n").map((s) => s.trim()).filter(Boolean) : [],
    },
  });
  revalidatePath("/admin/industries"); revalidatePath("/industries");
  return { ok: true };
}
export async function deleteIndustry(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.industry.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/industries"); revalidatePath("/industries");
  return { ok: true };
}
