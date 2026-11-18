import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasPermission, hasRole, type Permission } from "@/lib/permissions";

type LoginType = "customer" | "admin" | "staff";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireAuth(login: LoginType = "customer") {
  const session = await getSession();
  if (!session) redirect(`/auth/${login}/login`);
  return session!;
}

export async function requireRole(roles: string[], login: LoginType = "customer") {
  const session = await requireAuth(login);
  const role = (session.user as { role?: string }).role;
  if (!hasRole(role, roles as Parameters<typeof hasRole>[1])) redirect("/forbidden");
  return session;
}

export async function requirePermission(permission: Permission, login: LoginType = "customer") {
  const session = await requireAuth(login);
  const role = (session.user as { role?: string }).role;
  if (!hasPermission(role, permission)) redirect("/forbidden");
  return session;
}

export async function requireCustomerProfile() {
  const session = await requireAuth("customer");
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/forbidden");
  return { session, profile };
}
