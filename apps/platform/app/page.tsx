import { HomeView, type PartnerHighlight } from "@/components/marketing/home-view";
import { PublicShell } from "@/components/public/public-shell";
import { prisma } from "@/lib/db";
import { getServerDictionary } from "@/lib/server-i18n";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerDictionary();
  return {
    title: t.brand.name,
    description: t.brand.tagline,
    openGraph: {
      title: t.brand.name,
      description: t.brand.tagline,
      type: "website",
    },
  };
}

export default async function HomePage() {
  const partners = await prisma.partner.findMany({
    where: { isActive: true },
    select: { id: true, name: true, category: true, website: true, logoUrl: true },
    orderBy: { order: "asc" },
  });

  return (
    <PublicShell>
      <HomeView partners={partners satisfies PartnerHighlight[]} />
    </PublicShell>
  );
}
