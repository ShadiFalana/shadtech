"use server";

import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// FAQ
const faqSchema = z.object({
  question: z.string().min(3),
  answer: z.string().min(3),
  category: z.string().optional(),
});

export async function createFaq(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const parsed = faqSchema.safeParse({
    question: formData.get("question"),
    answer: formData.get("answer"),
    category: formData.get("category") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.fAQ.create({ data: parsed.data });
  revalidatePath("/admin/faqs");
  revalidatePath("/faq");
  return { ok: true };
}

export async function deleteFaq(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const id = String(formData.get("id"));
  await prisma.fAQ.delete({ where: { id } });
  revalidatePath("/admin/faqs");
  revalidatePath("/faq");
  return { ok: true };
}

// Testimonial
const testimonialSchema = z.object({
  name: z.string().min(2),
  role: z.string().optional(),
  company: z.string().optional(),
  content: z.string().min(3),
  rating: z.coerce.number().min(1).max(5).optional(),
});

export async function createTestimonial(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const parsed = testimonialSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role") || undefined,
    company: formData.get("company") || undefined,
    content: formData.get("content"),
    rating: formData.get("rating") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.testimonial.create({ data: { ...parsed.data, rating: parsed.data.rating ?? 5 } });
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteTestimonial(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const id = String(formData.get("id"));
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  return { ok: true };
}

// Contact messages (read + mark read)
export async function markMessageRead(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"]);
  const id = String(formData.get("id"));
  await prisma.contactMessage.update({ where: { id }, data: { isRead: true } });
  revalidatePath("/admin/messages");
  return { ok: true };
}
