import type { Metadata } from "next";
import { PublicShell } from "@/components/public/public-shell";
import { SearchExperience, type SearchEntry } from "@/components/search/search-experience";
import { prisma } from "@/lib/db";
import {
  industriesCatalog,
  productCatalog,
  servicesCatalog,
  solutionsCatalog,
  text,
} from "@/lib/public-catalog";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerDictionary();
  return { title: t.search.title };
}

export default async function SearchPage({ searchParams }: Props) {
  const [locale, params] = await Promise.all([getServerLocale(), searchParams]);
  const rawQuery =
    typeof params.q === "string" ? params.q : Array.isArray(params.q) ? (params.q[0] ?? "") : "";
  const query = rawQuery.trim().slice(0, 80);

  const [dbServices, dbProducts, articles] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, shortDescription: true },
      take: 100,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, description: true },
      take: 100,
    }),
    prisma.knowledgeArticle.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, slug: true, category: true },
      take: 100,
    }),
  ]);

  const entries: SearchEntry[] = [];

  for (const service of servicesCatalog) {
    entries.push({
      id: `catalog-service-${service.slug}`,
      title: text(service.name, locale),
      subtitle: text(service.short, locale),
      href: `/services/${service.slug}`,
      categoryKey: "search.services",
      keywords: [text(service.category, locale), ...service.problems.map((problem) => text(problem, locale))].join(" "),
    });
  }
  for (const service of dbServices) {
    const catalog = servicesCatalog.find((entry) => entry.slug === service.slug);
    if (catalog) continue;
    entries.push({
      id: `service-${service.id}`,
      title: service.name,
      subtitle: service.shortDescription ?? undefined,
      href: `/services/${service.slug}`,
      categoryKey: "search.services",
    });
  }

  for (const solution of solutionsCatalog) {
    entries.push({
      id: `solution-${solution.slug}`,
      title: text(solution.title, locale),
      subtitle: text(solution.description, locale),
      href: `/solutions/${solution.slug}`,
      categoryKey: "nav.solutions",
    });
  }

  for (const industry of industriesCatalog) {
    entries.push({
      id: `industry-${industry.slug}`,
      title: text(industry.name, locale),
      subtitle: text(industry.description, locale),
      href: `/industries/${industry.slug}`,
      categoryKey: "nav.industries",
    });
  }

  for (const product of productCatalog) {
    entries.push({
      id: `catalog-product-${product.slug}`,
      title: text(product.name, locale),
      subtitle: text(product.description, locale),
      href: `/products?category=${encodeURIComponent(product.categorySlug)}`,
      categoryKey: "search.products",
    });
  }
  for (const product of dbProducts) {
    const catalog = productCatalog.find((entry) => entry.slug === product.slug);
    if (catalog) continue;
    entries.push({
      id: `product-${product.id}`,
      title: product.name,
      subtitle: product.description.slice(0, 160),
      href: "/products",
      categoryKey: "search.products",
    });
  }

  for (const article of articles) {
    entries.push({
      id: `article-${article.id}`,
      title: article.title,
      subtitle: article.category ?? undefined,
      href: `/knowledge/${article.slug}`,
      categoryKey: "search.articles",
    });
  }

  for (const service of servicesCatalog) {
    for (const faq of service.faqs) {
      entries.push({
        id: `faq-${service.slug}-${text(faq.q, locale).slice(0, 24)}`,
        title: text(faq.q, locale),
        subtitle: text(service.name, locale),
        href: `/services/${service.slug}#faq`,
        categoryKey: "public.faq",
        keywords: text(faq.a, locale),
      });
    }
  }

  return (
    <PublicShell>
      <SearchExperience
        entries={entries}
        initialQuery={query}
        basePath="/search"
        titleKey="search.title"
        descriptionKey="shell.publicScope"
        scopeKey="shell.publicScope"
      />
    </PublicShell>
  );
}
