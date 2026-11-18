"use server";

import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/** Only these keys may be written through the settings form. */
const EDITABLE_SETTING_KEYS = [
  "company_name",
  "company_email",
  "company_phone",
  "openrouter_model",
] as const;

const allowedKeys = new Set<string>(EDITABLE_SETTING_KEYS);
const MODEL_PATTERN = /^[A-Za-z0-9._:/-]{1,120}$/;

export async function saveSetting(formData: FormData) {
  const session = await requirePermission("settings.manage", "admin");
  const key = String(formData.get("key") ?? "");
  const value = String(formData.get("value") ?? "").trim();

  if (!allowedKeys.has(key)) {
    return { ok: false as const, errorKey: "errors.forbidden" };
  }
  if (!value || value.length > 500) {
    return { ok: false as const, errorKey: "forms.validationError" };
  }
  if (key === "openrouter_model" && !MODEL_PATTERN.test(value)) {
    return { ok: false as const, errorKey: "forms.validationError" };
  }

  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  await writeAudit({
    actorId: session.user.id,
    action: "settings.update",
    entity: "systemSetting",
    entityId: key,
    details: `key=${key}`,
  });

  revalidatePath("/admin/settings");
  return { ok: true as const };
}
