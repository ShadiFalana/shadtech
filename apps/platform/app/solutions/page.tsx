import { PublicShell } from "@/components/public/public-shell";
import { PageHeader } from "@/components/workspace/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getServerDictionary } from "@/lib/server-i18n";
import Link from "next/link";

export async function generateMetadata() {
  const t = await getServerDictionary();
  return { title: t.nav.solutions };
}

export default async function SolutionsPage() {
  const t = await getServerDictionary();
  const solutions = await prisma.solution.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <PageHeader titleKey="nav.solutions" />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {solutions.map((solution) => (
            <Card key={solution.id} className="border-[#E4E7EC] shadow-sm dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">{solution.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{solution.description}</p>
                <Button
                  variant="link"
                  className="mt-2 px-0 text-[#F79432]"
                  nativeButton={false}
                  render={<Link href={`/solutions/${solution.slug}`} />}
                >
                  {t.public.learnMore}
                </Button>
              </CardContent>
            </Card>
          ))}
          {solutions.length === 0 && <p className="text-sm text-muted-foreground">{t.public.noSolutions}</p>}
        </div>
      </div>
    </PublicShell>
  );
}
