"use server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({ assetTag: z.string().min(2), name: z.string().min(2), type: z.string().min(2), manufacturer: z.string().optional(), model: z.string().optional(), serialNumber: z.string().optional(), status: z.string().optional() });

export async function createAsset(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"]);
  const parsed = schema.safeParse({ assetTag: formData.get("assetTag"), name: formData.get("name"), type: formData.get("type"), manufacturer: formData.get("manufacturer") || undefined, model: formData.get("model") || undefined, serialNumber: formData.get("serialNumber") || undefined, status: formData.get("status") || undefined });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  await prisma.asset.create({ data: { assetTag: parsed.data.assetTag, name: parsed.data.name, type: parsed.data.type, manufacturer: parsed.data.manufacturer, model: parsed.data.model, serialNumber: parsed.data.serialNumber, status: (parsed.data.status as never) ?? "RECEIVED" } });
  revalidatePath("/admin/assets");
  return { ok: true };
}
export async function deleteAsset(formData: FormData) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.asset.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/assets");
  return { ok: true };
}
