import Link from "next/link";
import { Button } from "@/components/ui/button";
import { hasPermission } from "@/lib/permissions";
import { getSession } from "@/lib/session";
import { DemoNotice } from "@/components/workspace/demo-notice";
import { MiniChart } from "@/components/workspace/mini-chart";
import { PageHeader } from "@/components/workspace/page-header";
import { SectionCard } from "@/components/workspace/section-card";
import { StatGrid } from "@/components/workspace/stat-grid";
import { prisma } from "@/lib/db";
import { configuredIntegrationCount } from "@/lib/integrations";
import { getServerDictionary } from "@/lib/server-i18n";

export default async function SuperAdminOverviewPage() {
  const t = await getServerDictionary();
  const session = await getSession();
  const canAccessAdmin = hasPermission((session?.user as { role?: string } | undefined)?.role, "admin.access");

  const [
    organizations,
    activeOrganizations,
    demoOrganizations,
    usersByRole,
    tickets,
    openTickets,
    subscriptions,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { isActive: true } }),
    prisma.organization.count({ where: { id: { startsWith: "demo_" } } }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER"] } } }),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
  ]);

  const totalUsers = usersByRole.reduce((sum, row) => sum + row._count._all, 0);
  const integrationCount = configuredIntegrationCount();

  const roleChart = usersByRole
    .map((row) => ({ label: row.role, value: row._count._all }))
    .sort((a, b) => b.value - a.value);

  const quickLinks = [
    { href: "/super-admin/tenants", label: t.superAdmin.tenants },
    { href: "/super-admin/users", label: t.superAdmin.platformUsers },
    { href: "/super-admin/plans", label: t.superAdmin.plans },
    { href: "/super-admin/subscriptions", label: t.superAdmin.subscriptions },
    { href: "/super-admin/integrations", label: t.superAdmin.integrations },
    { href: "/super-admin/usage", label: t.superAdmin.usage },
    { href: "/super-admin/audit", label: t.superAdmin.auditLogs },
    { href: "/super-admin/settings", label: t.superAdmin.platformSettings },
    ...(canAccessAdmin ? [{ href: "/admin", label: t.nav.admin }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="superAdmin.dashboard" />

      {demoOrganizations > 0 && <DemoNotice />}

      <StatGrid
        items={[
          { labelKey: "superAdmin.tenants", value: organizations, hint: `${activeOrganizations} ${t.common.active}` },
          { labelKey: "superAdmin.platformUsers", value: totalUsers },
          { labelKey: "admin.tickets", value: tickets, hint: `${openTickets} ${t.admin.openTickets}` },
          {
            labelKey: "superAdmin.subscriptions",
            value: subscriptions,
            hint: `${activeSubscriptions} ${t.common.active}`,
          },
          { labelKey: "system.integrationCount", value: integrationCount },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <MiniChart titleKey="admin.roles" data={roleChart} />
        <SectionCard titleKey="sections.quickActions">
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Button nativeButton={false} key={link.href} variant="outline" render={<Link href={link.href} />}>
                {link.label}
              </Button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
