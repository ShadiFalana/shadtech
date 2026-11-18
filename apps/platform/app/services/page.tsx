import { PublicShell } from "@/components/public/public-shell";
import { PageHeader } from "@/components/workspace/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getServerDictionary } from "@/lib/server-i18n";
import Link from "next/link";

export async function generateMetadata() {
  const t = await getServerDictionary();
  return { title: t.nav.services };
}

export default async function ServicesPage() {
  const t = await getServerDictionary();
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: { category: true },
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <PageHeader titleKey="nav.services" />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="border-[#E4E7EC] shadow-sm dark:border-white/10">
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F79432]">
                  {service.category?.name ?? ""}
                </p>
                <CardTitle className="text-lg">{service.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  {service.shortDescription ?? service.description}
                </p>
                <Button
                  variant="link"
                  className="mt-2 px-0 text-[#F79432]"
                  nativeButton={false}
                  render={<Link href={`/services/${service.slug}`} />}
                >
                  {t.public.learnMore}
                </Button>
              </CardContent>
            </Card>
          ))}
          {services.length === 0 && <p className="text-sm text-muted-foreground">{t.common.noData}</p>}
        </div>
      </div>
    </PublicShell>
  );
}
