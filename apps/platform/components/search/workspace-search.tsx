import { SearchExperience, type SearchEntry } from "@/components/search/search-experience";
import { prisma } from "@/lib/db";
import { normaliseRole } from "@/lib/permissions";
import { getSession, requireCustomerProfile } from "@/lib/session";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function WorkspaceSearch({ basePath, searchParams }: { basePath: string; searchParams: SearchParams }) {
  const [params, session] = await Promise.all([searchParams, getSession()]);
  const rawQuery =
    typeof params.q === "string" ? params.q : Array.isArray(params.q) ? (params.q[0] ?? "") : "";
  const query = rawQuery.trim().slice(0, 80);
  const role = normaliseRole((session?.user as { role?: string } | undefined)?.role);
  const entries: SearchEntry[] = [];

  if (!session) {
    return (
      <SearchExperience
        entries={[]}
        initialQuery={query}
        basePath={basePath}
        titleKey="search.title"
        descriptionKey="shell.requiresSignIn"
        scopeKey="shell.internalScope"
        emptyKey="shell.requiresSignIn"
      />
    );
  }

  if (role === "CUSTOMER") {
    const { profile } = await requireCustomerProfile();
    const [tickets, invoices, assets, appointments, quotations, contracts, articles, services] =
      await Promise.all([
        prisma.supportTicket.findMany({
          where: { customerId: profile.id },
          select: { id: true, ticketNumber: true, subject: true, status: true },
          take: 100,
        }),
        prisma.invoice.findMany({
          where: { customerId: profile.id },
          select: { id: true, number: true, status: true },
          take: 100,
        }),
        prisma.asset.findMany({
          where: { customerId: profile.id },
          select: { id: true, name: true, assetTag: true, type: true },
          take: 100,
        }),
        prisma.appointment.findMany({
          where: { customerId: profile.id },
          select: { id: true, title: true, status: true },
          take: 100,
        }),
        prisma.quotation.findMany({
          where: { customerId: profile.id },
          select: { id: true, number: true, status: true },
          take: 100,
        }),
        prisma.contract.findMany({
          where: { customerId: profile.id },
          select: { id: true, title: true, status: true },
          take: 100,
        }),
        prisma.knowledgeArticle.findMany({
          where: { isPublished: true },
          select: { id: true, title: true, slug: true, category: true },
          take: 100,
        }),
        prisma.service.findMany({
          where: { isActive: true },
          select: { id: true, name: true, slug: true, shortDescription: true },
          take: 100,
        }),
      ]);

    entries.push(
      ...tickets.map((entry) => ({
        id: `ticket-${entry.id}`,
        title: entry.subject,
        subtitle: `${entry.ticketNumber ?? ""} ${entry.status}`.trim(),
        href: `/dashboard/tickets/${entry.id}`,
        categoryKey: "search.tickets",
      })),
      ...invoices.map((entry) => ({
        id: `invoice-${entry.id}`,
        title: entry.number,
        subtitle: entry.status,
        href: "/dashboard/invoices",
        categoryKey: "search.invoices",
      })),
      ...assets.map((entry) => ({
        id: `asset-${entry.id}`,
        title: entry.name,
        subtitle: [entry.assetTag, entry.type].filter(Boolean).join(" · "),
        href: "/dashboard/assets",
        categoryKey: "search.assets",
      })),
      ...appointments.map((entry) => ({
        id: `appointment-${entry.id}`,
        title: entry.title,
        subtitle: entry.status,
        href: "/dashboard/appointments",
        categoryKey: "navItems.appointments",
      })),
      ...quotations.map((entry) => ({
        id: `quote-${entry.id}`,
        title: entry.number,
        subtitle: entry.status,
        href: "/dashboard/quotes",
        categoryKey: "search.products",
      })),
      ...contracts.map((entry) => ({
        id: `contract-${entry.id}`,
        title: entry.title,
        subtitle: entry.status,
        href: "/dashboard/contracts",
        categoryKey: "navItems.contracts",
      })),
      ...articles.map((entry) => ({
        id: `article-${entry.id}`,
        title: entry.title,
        subtitle: entry.category ?? undefined,
        href: `/knowledge/${entry.slug}`,
        categoryKey: "search.articles",
      })),
      ...services.map((entry) => ({
        id: `service-${entry.id}`,
        title: entry.name,
        subtitle: entry.shortDescription ?? undefined,
        href: `/services/${entry.slug}`,
        categoryKey: "search.services",
      })),
    );
  } else {
    const canViewTickets = role === "ADMIN" || role === "SUPER_ADMIN" || role === "SUPPORT_AGENT";
    const canViewCustomers = canViewTickets;
    const canViewFinance = role === "ADMIN" || role === "SUPER_ADMIN";
    const [articles, services, tickets] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where: { isPublished: true },
        select: { id: true, title: true, slug: true, category: true },
        take: 100,
      }),
      prisma.service.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, shortDescription: true },
        take: 100,
      }),
      canViewTickets
        ? prisma.supportTicket.findMany({
            select: { id: true, ticketNumber: true, subject: true, status: true },
            take: 100,
          })
        : Promise.resolve([]),
    ]);

    entries.push(
      ...(canViewTickets
        ? tickets.map((entry) => ({
            id: `ticket-${entry.id}`,
            title: entry.subject,
            subtitle: `${entry.ticketNumber ?? ""} ${entry.status}`.trim(),
            href: role === "SUPPORT_AGENT" ? `/support/tickets/${entry.id}` : `/admin/tickets/${entry.id}`,
            categoryKey: "search.tickets",
          }))
        : []),
      ...articles.map((entry) => ({
        id: `article-${entry.id}`,
        title: entry.title,
        subtitle: entry.category ?? undefined,
        href: `/knowledge/${entry.slug}`,
        categoryKey: "search.articles",
      })),
      ...services.map((entry) => ({
        id: `service-${entry.id}`,
        title: entry.name,
        subtitle: entry.shortDescription ?? undefined,
        href: `/services/${entry.slug}`,
        categoryKey: "search.services",
      })),
    );

    if (canViewCustomers) {
      const [customers, organizations, assets] = await Promise.all([
        prisma.customerProfile.findMany({
          select: { id: true, company: true, user: { select: { name: true, email: true } } },
          take: 100,
        }),
        prisma.organization.findMany({
          select: { id: true, name: true, domain: true },
          take: 100,
        }),
        prisma.asset.findMany({
          select: { id: true, name: true, assetTag: true, type: true },
          take: 100,
        }),
      ]);
      entries.push(
        ...customers.map((entry) => ({
          id: `customer-${entry.id}`,
          title: entry.user.name ?? entry.user.email,
          subtitle: entry.company ?? undefined,
          href: role === "SUPPORT_AGENT" ? "/support/customers" : "/admin/customers",
          categoryKey: "search.customers",
        })),
        ...organizations.map((entry) => ({
          id: `organization-${entry.id}`,
          title: entry.name,
          subtitle: entry.domain ?? undefined,
          href: "/admin/organizations",
          categoryKey: "search.organizations",
        })),
        ...assets.map((entry) => ({
          id: `asset-${entry.id}`,
          title: entry.name,
          subtitle: [entry.assetTag, entry.type].filter(Boolean).join(" · "),
          href: "/admin/assets",
          categoryKey: "search.assets",
        })),
      );
    }

    if (canViewFinance) {
      const [invoices, projects] = await Promise.all([
        prisma.invoice.findMany({
          select: { id: true, number: true, status: true },
          take: 100,
        }),
        prisma.project.findMany({
          select: { id: true, name: true, status: true },
          take: 100,
        }),
      ]);
      entries.push(
        ...invoices.map((entry) => ({
          id: `invoice-${entry.id}`,
          title: entry.number,
          subtitle: entry.status,
          href: "/admin/invoices",
          categoryKey: "search.invoices",
        })),
        ...projects.map((entry) => ({
          id: `project-${entry.id}`,
          title: entry.name,
          subtitle: entry.status,
          href: "/admin/projects",
          categoryKey: "search.projects",
        })),
      );
    }
  }

  return (
    <SearchExperience
      entries={entries}
      initialQuery={query}
      basePath={basePath}
      titleKey="search.title"
      descriptionKey="shell.internalScope"
      scopeKey="shell.internalScope"
    />
  );
}
