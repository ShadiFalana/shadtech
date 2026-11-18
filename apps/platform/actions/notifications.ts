"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

function revalidateNotificationPaths() {
  revalidatePath("/dashboard/notifications");
  revalidatePath("/support");
  revalidatePath("/admin/notifications");
}

export async function markNotificationRead(id: string) {
  const session = await getSession();
  if (!session) return { ok: false as const };
  const result = await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });
  if (result.count > 0) revalidateNotificationPaths();
  return { ok: result.count > 0 };
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session) return { ok: false as const };
  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });
  revalidateNotificationPaths();
  return { ok: true as const };
}
