"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  serviceId: z.string(),
  message: z.string().optional(),
});

export async function requestService(formData: FormData) {
  const session = await getSession();
  if (!session) return { ok: false as const, errorKey: "errors.unauthorized" as const };
  const profile = await prisma.customerProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return { ok: false as const, errorKey: "errors.noProfile" as const };
  const parsed = schema.safeParse({
    serviceId: formData.get("serviceId"),
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) return { ok: false as const, errorKey: "forms.validationError" as const };
  const service = await prisma.service.findUnique({
    where: { id: parsed.data.serviceId },
    select: { id: true, isActive: true },
  });
  if (!service?.isActive) return { ok: false as const, errorKey: "errors.notFound" as const };
  await prisma.serviceRequest.create({
    data: {
      customerId: profile.id,
      serviceId: parsed.data.serviceId,
      message: parsed.data.message,
    },
  });
  revalidatePath("/dashboard/services");
  return { ok: true };
}
