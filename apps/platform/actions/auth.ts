"use server";

import { getSession } from "@/lib/session";
import { canAccessLogin, dashboardForRole, normaliseRole } from "@/lib/permissions";

type LoginType = "customer" | "admin" | "staff";

export async function completeLoginAction(expected: LoginType) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "unauthorized" as const };

  const role = (session.user as { role?: string }).role;
  if (!canAccessLogin(role, expected)) {
    return { ok: false as const, error: "roleMismatch" as const };
  }

  return { ok: true as const, redirectTo: dashboardForRole(normaliseRole(role)), role: normaliseRole(role) };
}

export async function dashboardAfterAuthAction() {
  const session = await getSession();
  if (!session) return { ok: false as const };
  const role = normaliseRole((session.user as { role?: string }).role);
  return { ok: true as const, redirectTo: dashboardForRole(role), role };
}
