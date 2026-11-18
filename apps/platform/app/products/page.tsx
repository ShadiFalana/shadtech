import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/workspace/page-header";
import { prisma } from "@/lib/db";
import {
  productCategories,
  productCatalog,
  text,
} from "@/lib/public-catalog";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import Link from "next/link";

type ProductsPageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

export async function generateMetadata() {
  const t = await getServerDictionary();
  return { title: t.nav.products };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [t, locale, params] = await Promise.all([
    getServerDictionary(),
    getServerLocale(),
    searchParams,
  ]);

  const rawCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const category = productCategories.find((item) => item.slug === rawCategory);

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { category: { slug: category.slug } } : {}),
    },
    include: { category: true },
    orderBy: { order: "asc" },
  });

  return (
    <PublicShell>
      <div className="section-shell py-16">
        <PageHeader titleKey="nav.products">
          {category ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#F79432]/15 px-3 py-1.5 text-sm font-semibold text-[#F79432]">
                {t.forms.category}: {text(category.name, locale)}
              </span>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href="/products" />}
              >
                {t.public.clearFilter}
              </Button>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{t.public.filterByCategory}</span>
          )}
        </PageHeader>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const catalog = productCatalog.find((item) => item.slug === product.slug);
            const categoryCatalog = productCategories.find(
              (item) => item.slug === product.category?.slug,
            );
            const englishOnly = locale === "ar" && (!catalog || !categoryCatalog);
            const name = catalog ? text(catalog.name, locale) : product.name;
            const description = catalog ? text(catalog.description, locale) : product.description;
            const categoryName = categoryCatalog
              ? text(categoryCatalog.name, locale)
              : (product.category?.name ?? "");

            return (
              <Card
                key={product.id}
                className="st-card-lift flex flex-col overflow-hidden border-[#777F89]/25 bg-white shadow-sm dark:bg-[#30343B]/40"
              >
                <CardHeader>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#F79432]">
                    {categoryName}
                  </p>
                  <CardTitle className="text-lg text-foreground dark:text-white">{name}</CardTitle>
                  {englishOnly && <EnglishBadge label={t.public.englishOnly} />}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted-foreground dark:text-white/65">
                  <p className="leading-6">{description}</p>

                  <details className="rounded-2xl border border-[#777F89]/25 bg-[#F7F8FA] p-4 dark:bg-[#24272D]/60">
                    <summary className="cursor-pointer text-sm font-semibold text-foreground dark:text-white">
                      {t.public.productDetails}
                    </summary>
                    <div className="mt-3 space-y-3">
                      {product.manufacturer && (
                        <p>
                          <span className="font-semibold text-secondary-foreground dark:text-white">
                            {t.forms.company}:{" "}
                          </span>
                          {product.manufacturer}
                        </p>
                      )}
                      {product.specifications.length > 0 && (
                        <ul className="list-disc space-y-1 ps-5">
                          {product.specifications.map((spec, index) => (
                            <li key={`${spec}-${index}`}>{spec}</li>
                          ))}
                        </ul>
                      )}
                      {product.availability && (
                        <p>
                          <span className="font-semibold text-secondary-foreground dark:text-white">
                            {t.public.availability}:{" "}
                          </span>
                          {product.availability}
                        </p>
                      )}
                      <p className="leading-6">{t.public.productInquiryNote}</p>
                    </div>
                  </details>

                  <Button
                    className="mt-auto w-full rounded-full bg-[#F79432] font-semibold text-primary-foreground hover:bg-[#FFB15C]"
                    nativeButton={false}
                    render={<Link href={`/request-quote?product=${product.slug}`} />}
                  >
                    {t.public.productInquiry}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          {products.length === 0 && <p className="text-sm text-muted-foreground">{t.public.noProducts}</p>}
        </div>
      </div>
    </PublicShell>
  );
}

function EnglishBadge({ label }: { label: string }) {
  return (
    <span className="w-fit rounded-full bg-[#F7F8FA] px-2.5 py-1 text-xs font-semibold text-muted-foreground dark:bg-[#24272D] dark:text-white/70">
      {label}
    </span>
  );
}
