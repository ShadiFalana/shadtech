import { hasPermission, type AppRole, type Permission } from "@/lib/permissions";

export type NavIcon =
  | "layout"
  | "ticket"
  | "plus"
  | "wrench"
  | "message"
  | "calendar"
  | "box"
  | "file"
  | "credit"
  | "repeat"
  | "book"
  | "help"
  | "sparkles"
  | "bell"
  | "mail"
  | "user"
  | "shield"
  | "settings"
  | "users"
  | "building"
  | "inbox"
  | "alert"
  | "clock"
  | "chart"
  | "briefcase"
  | "layers"
  | "server"
  | "activity"
  | "workflow"
  | "plug"
  | "search"
  | "globe";

export type NavItem = {
  href: string;
  labelKey: string;
  icon: NavIcon;
  permission?: Permission;
  unavailable?: boolean;
};

export type NavGroup = {
  id: string;
  labelKey: string;
  items: NavItem[];
};

export type Workspace = "customer" | "support" | "admin" | "superAdmin";

export type WorkspaceMeta = {
  titleKey: string;
  login: "customer" | "admin" | "staff";
  searchHref: string;
  notificationsHref: string;
  homeHref: string;
  role: AppRole[];
};

export const workspaceMeta: Record<Workspace, WorkspaceMeta> = {
  customer: {
    titleKey: "portal.title",
    login: "customer",
    searchHref: "/dashboard/search",
    notificationsHref: "/dashboard/notifications",
    homeHref: "/dashboard",
    role: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"],
  },
  support: {
    titleKey: "support.title",
    login: "staff",
    searchHref: "/support/search",
    notificationsHref: "/support",
    homeHref: "/support",
    role: ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT"],
  },
  admin: {
    titleKey: "admin.title",
    login: "admin",
    searchHref: "/admin/search",
    notificationsHref: "/admin/notifications",
    homeHref: "/admin",
    role: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
  },
  superAdmin: {
    titleKey: "superAdmin.title",
    login: "admin",
    searchHref: "/super-admin/search",
    notificationsHref: "/admin/notifications",
    homeHref: "/super-admin",
    role: ["SUPER_ADMIN"],
  },
};

const item = (
  href: string,
  labelKey: string,
  icon: NavIcon,
  options: Pick<NavItem, "permission" | "unavailable"> = {},
): NavItem => ({ href, labelKey, icon, ...options });

export const workspaceNav: Record<Workspace, NavGroup[]> = {
  customer: [
    {
      id: "overview",
      labelKey: "navGroups.overview",
      items: [item("/dashboard", "navItems.dashboard", "layout")],
    },
    {
      id: "support",
      labelKey: "navGroups.support",
      items: [
        item("/dashboard/tickets", "navItems.myTickets", "ticket"),
        item("/dashboard/tickets/new", "navItems.createTicket", "plus"),
        item("/dashboard/services", "navItems.serviceRequests", "wrench"),
        item("/dashboard/chat", "navItems.liveChat", "message", { unavailable: true }),
        item("/dashboard/appointments", "navItems.appointments", "calendar"),
      ],
    },
    {
      id: "myBusiness",
      labelKey: "navGroups.myBusiness",
      items: [
        item("/dashboard/assets", "navItems.myAssets", "box"),
        item("/dashboard/contracts", "navItems.contracts", "file"),
        item("/dashboard/projects", "navItems.projects", "briefcase", { unavailable: true }),
        item("/dashboard/quotes", "navItems.quotations", "file"),
        item("/dashboard/invoices", "navItems.invoices", "file"),
        item("/dashboard/payments", "navItems.payments", "credit"),
        item("/dashboard/subscriptions", "navItems.subscriptions", "repeat"),
      ],
    },
    {
      id: "resources",
      labelKey: "navGroups.resources",
      items: [
        item("/dashboard/knowledge", "navItems.knowledgeBase", "book"),
        item("/dashboard/faq", "navItems.faq", "help", { unavailable: true }),
        item("/dashboard/ai", "navItems.aiAssistant", "sparkles"),
      ],
    },
    {
      id: "account",
      labelKey: "navGroups.account",
      items: [
        item("/dashboard/notifications", "navItems.notifications", "bell"),
        item("/dashboard/messages", "navItems.messages", "mail", { unavailable: true }),
        item("/profile", "navItems.profile", "user"),
        item("/dashboard/security", "navItems.security", "shield", { unavailable: true }),
        item("/dashboard/settings", "navItems.settings", "settings"),
      ],
    },
  ],
  support: [
    {
      id: "workspace",
      labelKey: "navGroups.workspace",
      items: [
        item("/support", "navItems.overview", "layout"),
        item("/support/my-queue", "navItems.myQueue", "user"),
        item("/support/tickets", "navItems.allTickets", "ticket"),
        item("/support/urgent", "navItems.urgentTickets", "alert"),
        item("/support/unassigned", "navItems.unassignedTickets", "inbox"),
      ],
    },
    {
      id: "customerSupport",
      labelKey: "navGroups.customerSupport",
      items: [
        item("/support/customers", "navItems.customers", "users", { permission: "customers.view" }),
        item("/support/organizations", "navItems.organizations", "building", { unavailable: true }),
        item("/support/conversations", "navItems.conversations", "message", { unavailable: true }),
        item("/support/chat", "navItems.liveChat", "message", { unavailable: true }),
      ],
    },
    {
      id: "serviceManagement",
      labelKey: "navGroups.serviceManagement",
      items: [
        item("/support/service-requests", "navItems.serviceRequests", "wrench", { unavailable: true }),
        item("/support/sla", "navItems.slaManagement", "clock", { unavailable: true }),
        item("/support/knowledge", "navItems.knowledgeBase", "book"),
        item("/support/appointments", "navItems.appointments", "calendar", { unavailable: true }),
      ],
    },
    {
      id: "tools",
      labelKey: "navGroups.tools",
      items: [
        item("/support/ai", "navItems.aiAssistant", "sparkles"),
        item("/support/saved-responses", "navItems.savedResponses", "file", { unavailable: true }),
        item("/support/reports", "navItems.reports", "chart", { permission: "reports.view" }),
        item("/support/schedule", "navItems.mySchedule", "calendar"),
      ],
    },
  ],
  admin: [
    {
      id: "overview",
      labelKey: "navGroups.overview",
      items: [
        item("/admin", "navItems.overview", "layout"),
        item("/admin/analytics", "navItems.analytics", "chart", { permission: "reports.view" }),
      ],
    },
    {
      id: "customerManagement",
      labelKey: "navGroups.customerManagement",
      items: [
        item("/admin/customers", "navItems.customers", "users", { permission: "customers.view" }),
        item("/admin/organizations", "navItems.organizations", "building", { permission: "customers.view" }),
        item("/admin/contacts", "navItems.contacts", "mail", { permission: "customers.view", unavailable: true }),
        item("/admin/leads", "navItems.leads", "users", { permission: "customers.view" }),
      ],
    },
    {
      id: "supportManagement",
      labelKey: "navGroups.supportManagement",
      items: [
        item("/admin/tickets", "navItems.tickets", "ticket", { permission: "tickets.view" }),
        item("/admin/incidents", "navItems.incidents", "alert", { unavailable: true }),
        item("/admin/problems", "navItems.problems", "activity"),
        item("/admin/changes", "navItems.changes", "workflow"),
        item("/admin/service-requests", "navItems.serviceRequests", "wrench", { unavailable: true }),
        item("/admin/sla", "navItems.sla", "clock"),
      ],
    },
    {
      id: "serviceCatalog",
      labelKey: "navGroups.serviceCatalog",
      items: [
        item("/admin/services", "navItems.services", "wrench", { permission: "content.manage" }),
        item("/admin/categories", "navItems.categories", "layers", { permission: "content.manage", unavailable: true }),
        item("/admin/products", "navItems.products", "box", { permission: "content.manage" }),
        item("/admin/industries", "navItems.industries", "globe", { permission: "content.manage" }),
      ],
    },
    {
      id: "itManagement",
      labelKey: "navGroups.itManagement",
      items: [
        item("/admin/assets", "navItems.assets", "box", { permission: "assets.manage" }),
        item("/admin/cmdb", "navItems.cmdb", "server", { permission: "assets.manage" }),
        item("/admin/maintenance", "navItems.maintenance", "wrench", { permission: "assets.manage", unavailable: true }),
        item("/admin/software-licenses", "navItems.softwareLicenses", "file", { permission: "assets.manage", unavailable: true }),
        item("/admin/contracts", "navItems.contracts", "file", { permission: "customers.view" }),
      ],
    },
    {
      id: "businessManagement",
      labelKey: "navGroups.businessManagement",
      items: [
        item("/admin/crm", "navItems.crm", "users", { permission: "customers.view", unavailable: true }),
        item("/admin/sales-pipeline", "navItems.salesPipeline", "chart", { permission: "reports.view", unavailable: true }),
        item("/admin/quotations", "navItems.quotations", "file", { permission: "customers.view" }),
        item("/admin/invoices", "navItems.invoices", "file", { permission: "customers.view" }),
        item("/admin/payments", "navItems.payments", "credit", { permission: "customers.view" }),
        item("/admin/expenses", "navItems.expenses", "credit", { permission: "customers.view" }),
        item("/admin/subscriptions", "navItems.subscriptions", "repeat", { permission: "customers.view" }),
      ],
    },
    {
      id: "operations",
      labelKey: "navGroups.operations",
      items: [
        item("/admin/projects", "navItems.projects", "briefcase", { permission: "customers.view" }),
        item("/admin/tasks", "navItems.tasks", "inbox", { permission: "customers.view" }),
        item("/admin/appointments", "navItems.appointments", "calendar", { permission: "customers.view" }),
        item("/admin/teams", "navItems.teams", "users", { permission: "customers.view", unavailable: true }),
        item("/admin/employees", "navItems.employees", "user", { permission: "customers.view", unavailable: true }),
      ],
    },
    {
      id: "content",
      labelKey: "navGroups.content",
      items: [
        item("/admin/knowledge", "navItems.knowledgeBase", "book", { permission: "content.manage" }),
        item("/admin/blog", "navItems.blog", "file", { permission: "content.manage" }),
        item("/admin/faqs", "navItems.faqs", "help", { permission: "content.manage" }),
        item("/admin/messages", "navItems.contactMessages", "mail", { permission: "content.manage" }),
      ],
    },
    {
      id: "automation",
      labelKey: "navGroups.automation",
      items: [
        item("/admin/workflows", "navItems.workflows", "workflow", { permission: "content.manage" }),
        item("/admin/notifications", "navItems.notifications", "bell", { permission: "content.manage" }),
        item("/admin/integrations", "navItems.integrations", "plug", { permission: "settings.manage" }),
        item("/admin/ai-settings", "navItems.aiSettings", "sparkles", { permission: "settings.manage" }),
      ],
    },
    {
      id: "system",
      labelKey: "navGroups.system",
      items: [
        item("/admin/users", "navItems.users", "users", { permission: "users.manage" }),
        item("/admin/account-requests", "navItems.accountRequests", "inbox", { permission: "users.manage" }),
        item("/admin/reports", "navItems.reports", "chart", { permission: "reports.view" }),
        item("/admin/audit-logs", "navItems.auditLogs", "activity", { permission: "audit.view" }),
        item("/admin/system-health", "navItems.systemHealth", "server", { permission: "settings.manage" }),
        item("/admin/settings", "navItems.settings", "settings", { permission: "settings.manage" }),
        item("/profile", "navItems.profile", "user"),
      ],
    },
  ],
  superAdmin: [
    {
      id: "overview",
      labelKey: "navGroups.overview",
      items: [
        item("/super-admin", "navItems.overview", "layout"),
        item("/super-admin/usage", "navItems.usage", "chart"),
      ],
    },
    {
      id: "platform",
      labelKey: "navGroups.platform",
      items: [
        item("/super-admin/tenants", "navItems.tenants", "building", { permission: "tenants.manage" }),
        item("/super-admin/users", "navItems.platformUsers", "users", { permission: "users.manage" }),
        item("/super-admin/plans", "navItems.plans", "layers"),
        item("/super-admin/subscriptions", "navItems.subscriptions", "repeat"),
        item("/super-admin/integrations", "navItems.integrations", "plug", { permission: "settings.manage" }),
      ],
    },
    {
      id: "system",
      labelKey: "navGroups.system",
      items: [
        item("/super-admin/system-health", "navItems.systemHealth", "server", { permission: "settings.manage" }),
        item("/super-admin/audit", "navItems.auditLogs", "activity", { permission: "audit.view" }),
        item("/super-admin/settings", "navItems.platformSettings", "settings", { permission: "settings.manage" }),
        item("/admin/account-requests", "navItems.accountRequests", "inbox", { permission: "users.manage" }),
        item("/profile", "navItems.profile", "user"),
      ],
    },
  ],
};

export function getWorkspaceNav(workspace: Workspace, role?: string | null): NavGroup[] {
  return workspaceNav[workspace]
    .map((group) => ({
      ...group,
      items: group.items.filter((entry) => !entry.permission || hasPermission(role, entry.permission)),
    }))
    .filter((group) => group.items.length > 0);
}

export function findNavItem(workspace: Workspace, pathname: string, role?: string | null): NavItem | undefined {
  return getWorkspaceNav(workspace, role)
    .flatMap((group) => group.items)
    .filter((entry) => entry.href !== "/dashboard" && entry.href !== "/admin" && entry.href !== "/support" && entry.href !== "/super-admin")
    .sort((a, b) => b.href.length - a.href.length)
    .find((entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`));
}
