export type AppRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SUPPORT_AGENT"
  | "CONTENT_MANAGER"
  | "CUSTOMER";

export type Permission =
  | "portal.access"
  | "support.access"
  | "admin.access"
  | "superAdmin.access"
  | "tickets.view"
  | "tickets.manage"
  | "customers.view"
  | "content.manage"
  | "assets.manage"
  | "reports.view"
  | "settings.manage"
  | "users.manage"
  | "tenants.manage"
  | "audit.view";

const allPermissions: Permission[] = [
  "portal.access",
  "support.access",
  "admin.access",
  "superAdmin.access",
  "tickets.view",
  "tickets.manage",
  "customers.view",
  "content.manage",
  "assets.manage",
  "reports.view",
  "settings.manage",
  "users.manage",
  "tenants.manage",
  "audit.view",
];

const permissionsByRole: Record<AppRole, Permission[]> = {
  SUPER_ADMIN: allPermissions,
  ADMIN: allPermissions.filter((permission) => permission !== "tenants.manage"),
  SUPPORT_AGENT: [
    "portal.access",
    "support.access",
    "tickets.view",
    "tickets.manage",
    "customers.view",
    "assets.manage",
    "reports.view",
  ],
  CONTENT_MANAGER: ["portal.access", "admin.access", "content.manage", "reports.view"],
  CUSTOMER: ["portal.access", "tickets.view"],
};

export const staffRoles: AppRole[] = ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT", "CONTENT_MANAGER"];
export const supportRoles: AppRole[] = ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"];
export const adminRoles: AppRole[] = ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"];
export const superAdminRoles: AppRole[] = ["SUPER_ADMIN"];

export function normaliseRole(role: string | null | undefined): AppRole {
  return role && role in permissionsByRole ? (role as AppRole) : "CUSTOMER";
}

export function hasRole(role: string | null | undefined, roles: AppRole[]): boolean {
  return roles.includes(normaliseRole(role));
}

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  return permissionsByRole[normaliseRole(role)].includes(permission);
}

export function dashboardForRole(role: string | null | undefined): string {
  switch (normaliseRole(role)) {
    case "SUPER_ADMIN":
      return "/super-admin";
    case "ADMIN":
      return "/admin";
    case "SUPPORT_AGENT":
      return "/support";
    case "CONTENT_MANAGER":
      return "/admin/blog";
    default:
      return "/dashboard";
  }
}

export function canAccessLogin(role: string | null | undefined, login: "customer" | "admin" | "staff"): boolean {
  const normalised = normaliseRole(role);
  if (login === "customer") return normalised === "CUSTOMER";
  if (login === "admin") return hasRole(normalised, ["SUPER_ADMIN", "ADMIN"]);
  return hasRole(normalised, ["SUPPORT_AGENT", "ADMIN", "SUPER_ADMIN"]);
}
