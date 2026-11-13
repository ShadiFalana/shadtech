export interface TenantRoleSummary {
  key: string;
  name: string;
}

/** Everything a request needs to know about the active tenant. */
export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  role: TenantRoleSummary;
  permissions: string[];
}

export interface TenantMembershipSummary extends TenantContext {
  isActive: boolean;
}
