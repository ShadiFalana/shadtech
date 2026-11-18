"use server";

import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  ticketId: z.string().min(1),
  fileName: z.string().trim().min(1).max(180),
  fileUrl: z.string().trim().url().max(2000),
  mimeType: z.string().trim().max(120).optional(),
  fileSize: z.coerce.number().int().nonnegative().optional(),
});

export async function addTicketAttachment(formData: FormData) {
  await requirePermission("tickets.manage", "staff");
  const parsed = schema.safeParse({
    ticketId: formData.get("ticketId"),
    fileName: formData.get("fileName"),
    fileUrl: formData.get("fileUrl"),
    mimeType: String(formData.get("mimeType") ?? "").trim() || undefined,
    fileSize: String(formData.get("fileSize") ?? "").trim() || undefined,
  });
  if (!parsed.success) return { ok: false as const, error: "validation" as const };

  const ticket = await prisma.supportTicket.findUnique({ where: { id: parsed.data.ticketId } });
  if (!ticket) return { ok: false as const, error: "notFound" as const };

  await prisma.ticketAttachment.create({
    data: {
      ticketId: parsed.data.ticketId,
      fileName: parsed.data.fileName,
      fileUrl: parsed.data.fileUrl,
      mimeType: parsed.data.mimeType ?? null,
      fileSize: parsed.data.fileSize ?? null,
    },
  });
  await prisma.ticketActivityLog.create({
    data: {
      ticketId: parsed.data.ticketId,
      action: "ATTACHMENT_REFERENCE_ADDED",
      details: parsed.data.fileName,
    },
  });

  revalidatePath(`/support/tickets/${parsed.data.ticketId}`);
  revalidatePath(`/admin/tickets/${parsed.data.ticketId}`);
  revalidatePath(`/dashboard/tickets/${parsed.data.ticketId}`);
  return { ok: true as const };
}
