"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

const optionalText = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

/** Absent fields are left out so a partial form cannot wipe stored values (notably city/country). */
const submitted = (formData: FormData, name: string) =>
  formData.has(name) ? optionalText(formData.get(name)) : undefined;

const schema = z.object({
  name: z.string().trim().min(2).max(120).nullish(),
  bio: z.string().trim().max(500).nullish(),
  phone: z.string().trim().max(50).nullish(),
  company: z.string().trim().max(120).nullish(),
  address: z.string().trim().max(200).nullish(),
  city: z.string().trim().max(120).nullish(),
  country: z.string().trim().max(120).nullish(),
});

export async function updateProfile(formData: FormData) {
  const session = await getSession();
  if (!session) return { ok: false as const, errorKey: "errors.unauthorized" };

  const parsed = schema.safeParse({
    name: submitted(formData, "name"),
    bio: submitted(formData, "bio"),
    phone: submitted(formData, "phone"),
    company: submitted(formData, "company"),
    address: submitted(formData, "address"),
    city: submitted(formData, "city"),
    country: submitted(formData, "country"),
  });
  if (!parsed.success) return { ok: false as const, errorKey: "forms.validationError" };

  const userData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) userData.name = parsed.data.name;
  if (parsed.data.bio !== undefined) userData.bio = parsed.data.bio;

  const profileData: Record<string, unknown> = {};
  const profileFields = ["phone", "company", "address", "city", "country"] as const;
  for (const field of profileFields) {
    const value = parsed.data[field];
    if (value === undefined) continue;
    // An empty city/country submission is also ignored: the current form does not
    // render those fields, so a blank value must never erase a stored location.
    if ((field === "city" || field === "country") && value === null) continue;
    profileData[field] = value;
  }

  await prisma.$transaction([
    ...(Object.keys(userData).length > 0
      ? [
          prisma.user.update({
            where: { id: session.user.id },
            data: userData as never,
          }),
        ]
      : []),
    prisma.customerProfile.upsert({
      where: { userId: session.user.id },
      update: profileData as never,
      create: {
        userId: session.user.id,
        phone: parsed.data.phone ?? null,
        company: parsed.data.company ?? null,
        address: parsed.data.address ?? null,
        city: parsed.data.city ?? null,
        country: parsed.data.country ?? null,
      },
    }),
  ]);

  revalidatePath("/profile");
  revalidatePath("/dashboard/profile");
  return { ok: true as const };
}

export async function removeAvatar() {
  const session = await getSession();
  if (!session) return { ok: false as const, errorKey: "errors.unauthorized" };
  await prisma.user.update({ where: { id: session.user.id }, data: { image: null } });
  revalidatePath("/profile");
  revalidatePath("/dashboard/profile");
  return { ok: true as const, messageKey: "common.success" };
}
