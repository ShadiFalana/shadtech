import { PublicShell } from "@/components/public/public-shell";
import { PageHeader } from "@/components/workspace/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getServerDictionary } from "@/lib/server-i18n";
import Link from "next/link";

export async function generateMetadata() {
  const t = await getServerDictionary();
  return { title: t.nav.industries };
}

export default async function IndustriesPage() {
  const t = await getServerDictionary();
  const industries = await prisma.industry.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <PageHeader titleKey="nav.industries" />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => (
            <Card key={industry.id} className="border-[#E4E7EC] shadow-sm dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">{industry.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{industry.description}</p>
                <Button
                  variant="link"
                  className="mt-2 px-0 text-[#F79432]"
                  nativeButton={false}
                  render={<Link href={`/industries/${industry.slug}`} />}
                >
                  {t.public.learnMore}
                </Button>
              </CardContent>
            </Card>
          ))}
          {industries.length === 0 && <p className="text-sm text-muted-foreground">{t.public.noIndustries}</p>}
        </div>
      </div>
    </PublicShell>
  );
}
