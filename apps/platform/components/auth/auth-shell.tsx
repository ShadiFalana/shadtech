"use client";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col bg-[#F7F8FA] p-5 dark:bg-[#20242A] sm:p-8">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
              className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-white dark:hover:bg-[#30343B]"
              aria-label={t.common.language}
            >
              {locale === "ar" ? "EN" : "عربي"}
            </button>
            <ThemeToggle compact />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground">{t.auth.securityNotice}</p>
      </div>
      <div className="brand-gradient relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -end-24 -top-24 size-96 rounded-full bg-[#F79432]/20 blur-3xl" />
        <div className="absolute -bottom-32 -start-20 size-[28rem] rounded-full bg-[#FFB15C]/10 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FFB15C]">ShadTech</p>
        </div>
        <div className="relative max-w-lg">
          <p className="text-4xl font-bold leading-tight">{t.brand.tagline}</p>
          <p className="mt-6 text-white/70">{t.footer.description}</p>
        </div>
        <div className="relative flex flex-wrap gap-3 text-sm text-white/70">
          <Link href="/privacy" className="hover:text-white">{t.nav.privacy}</Link>
          <Link href="/terms" className="hover:text-white">{t.nav.terms}</Link>
          <Link href="/" className="hover:text-white">{t.nav.home}</Link>
        </div>
      </div>
    </div>
  );
}

export function AuthFooterLinks({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex flex-wrap gap-4 text-sm">{children}</div>;
}

export function AuthTextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-[#B86600] hover:text-[#F79432] dark:text-[#FFB15C]">
      {children}
    </Link>
  );
}

export function AuthSubmit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-xl bg-[#F79432] font-semibold text-primary-foreground hover:bg-[#FFB15C]"
    >
      {children}
    </Button>
  );
}
