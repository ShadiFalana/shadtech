import { TechVisual } from "@/components/marketing/tech-visual";
import { PublicShell } from "@/components/public/public-shell";
import { Button } from "@/components/ui/button";
import { getServerDictionary } from "@/lib/server-i18n";
import Link from "next/link";

export async function generateMetadata() {
  const t = await getServerDictionary();
  return { title: t.about.title };
}

export default async function AboutPage() {
  const t = await getServerDictionary();
  const values = [
    t.about.valueClarity,
    t.about.valueFollowThrough,
    t.about.valueData,
    t.about.valuePracticality,
  ];

  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-[#24272D] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(247,148,50,0.3),transparent_36%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-20 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">{t.about.subtitle}</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">{t.about.intro}</p>
          </div>
          <TechVisual />
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-12 px-4 py-16">
        <Block title={t.about.companyTitle} body={t.about.companyBody} />
        <div className="grid gap-4 md:grid-cols-2">
          <Card title={t.about.mission} body={t.about.missionBody} />
          <Card title={t.about.vision} body={t.about.visionBody} />
        </div>
        <Block title={t.about.offerTitle} body={t.about.offerBody} />
        <Block title={t.about.approachTitle} body={t.about.approachBody} />
        <div>
          <h2 className="text-2xl font-bold text-foreground dark:text-white">{t.about.valuesTitle}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value}
                className="rounded-2xl bg-white p-4 font-semibold text-secondary-foreground shadow-sm dark:bg-[#30343B] dark:text-white"
              >
                {value}
              </div>
            ))}
          </div>
        </div>
        <Block title={t.about.whyTitle} body={t.about.whyBody} />
        <div className="rounded-3xl bg-[#24272D] p-8 text-white">
          <h2 className="text-2xl font-bold">{t.about.ctaTitle}</h2>
          <Button
            className="mt-4 h-11 rounded-full bg-[#F79432] px-6 text-primary-foreground hover:bg-[#FFB15C]"
            nativeButton={false}
            render={<Link href="/contact" />}
          >
            {t.nav.contact}
          </Button>
        </div>
      </section>
    </PublicShell>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground dark:text-white">{title}</h2>
      <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{body}</p>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#30343B]">
      <h3 className="font-semibold text-foreground dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}
