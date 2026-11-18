"use server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const problemSchema = z.object({ title: z.string().min(2), description: z.string().min(3), rootCause: z.string().optional(), workaround: z.string().optional(), priority: z.string().optional() });
const changeSchema = z.object({ title: z.string().min(2), description: z.string().min(3), risk: z.string().optional(), implementationPlan: z.string().optional(), rollbackPlan: z.string().optional() });
const slaSchema = z.object({ name: z.string().min(2), responseMinutes: z.coerce.number().min(1), resolutionMinutes: z.coerce.number().min(1) });

export async function createProblem(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"]);
  const parsed = problemSchema.safeParse({ title: formData.get("title"), description: formData.get("description"), rootCause: formData.get("rootCause") || undefined, workaround: formData.get("workaround") || undefined, priority: formData.get("priority") || undefined });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.problem.create({ data: parsed.data });
  revalidatePath("/admin/problems");
  return { ok: true };
}
export async function deleteProblem(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.problem.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/problems");
  return { ok: true };
}
export async function createChange(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const parsed = changeSchema.safeParse({ title: formData.get("title"), description: formData.get("description"), risk: formData.get("risk") || undefined, implementationPlan: formData.get("implementationPlan") || undefined, rollbackPlan: formData.get("rollbackPlan") || undefined });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.changeRequest.create({ data: parsed.data });
  revalidatePath("/admin/changes");
  return { ok: true };
}
export async function deleteChange(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.changeRequest.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/changes");
  return { ok: true };
}
export async function createSLA(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const parsed = slaSchema.safeParse({ name: formData.get("name"), responseMinutes: formData.get("responseMinutes"), resolutionMinutes: formData.get("resolutionMinutes") });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.sLAPolicy.create({ data: parsed.data });
  revalidatePath("/admin/sla");
  return { ok: true };
}
export async function deleteSLA(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.sLAPolicy.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/sla");
  return { ok: true };
}
