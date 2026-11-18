import { prisma } from "@/lib/db";
import { normaliseRole } from "@/lib/permissions";
import type { Workspace } from "@/lib/navigation";

type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};

export type ShellIdentity = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};

export type ShellNotification = {
  id: string;
  title: string;
  body?: string | null;
  href?: string | null;
  isRead: boolean;
  createdAt: string;
};

export function workspaceForRole(role: string | null | undefined): Workspace {
  switch (normaliseRole(role)) {
    case "SUPER_ADMIN":
      return "superAdmin";
    case "ADMIN":
    case "CONTENT_MANAGER":
      return "admin";
    case "SUPPORT_AGENT":
      return "support";
    default:
      return "customer";
  }
}

export async function getWorkspaceShellData(sessionUser: SessionUser): Promise<{
  user: ShellIdentity;
  notifications: ShellNotification[];
}> {
  const notifications = await prisma.notification.findMany({
    where: { userId: sessionUser.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      body: true,
      link: true,
      isRead: true,
      createdAt: true,
    },
  });

  return {
    user: {
      name: sessionUser.name,
      email: sessionUser.email,
      image: sessionUser.image,
      role: sessionUser.role,
    },
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      href: notification.link,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    })),
  };
}
