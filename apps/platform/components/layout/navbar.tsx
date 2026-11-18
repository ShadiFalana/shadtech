"use client";

import { Logo } from "@/components/brand/logo";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  industriesCatalog,
  productCategories,
  servicesCatalog,
  solutionsCatalog,
  text,
} from "@/lib/public-catalog";
import { cn } from "cn";
import { ChevronDown, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavLink = {
  href: string;
  label: string;
  menu?: Array<{ href: string; label: string }>;
};

export function Navbar() {
  const { locale, t, dir } = useLanguage();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const links: NavLink[] = [
    { href: "/", label: t.nav.home },
    {
      href: "/services",
      label: t.nav.services,
      menu: servicesCatalog.map((service) => ({
        href: `/services/${service.slug}`,
        label: text(service.name, locale),
      })),
    },
    {
      href: "/solutions",
      label: t.nav.solutions,
      menu: solutionsCatalog.map((solution) => ({
        href: `/solutions/${solution.slug}`,
        label: text(solution.title, locale),
      })),
    },
    {
      href: "/products",
      label: t.nav.products,
      menu: productCategories.map((category) => ({
        href: `/products?category=${category.slug}`,
        label: text(category.name, locale),
      })),
    },
    {
      href: "/industries",
      label: t.nav.industries,
      menu: industriesCatalog.map((industry) => ({
        href: `/industries/${industry.slug}`,
        label: text(industry.name, locale),
      })),
    },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 rounded-full border border-black/5 bg-white/95 px-3 shadow-[0_12px_40px_rgba(32,36,42,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-[#24272D]/95 sm:px-5">
        <Link href="/" aria-label={t.brand.name} className="shrink-0 rounded-full focus-brand">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label={t.nav.main}>
          {links.map((item) =>
            item.menu ? (
              <DropdownMenu key={item.href}>
                <DropdownMenuTrigger
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-2 text-sm font-medium transition-colors hover:bg-[#F7F8FA] dark:hover:bg-[#30343B]",
                    isActive(pathname, item.href)
                      ? "text-[#F79432]"
                      : "text-secondary-foreground dark:text-white/85",
                  )}
                >
                  {item.label}
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72 p-2">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[#F79432]">{item.label}</DropdownMenuLabel>
                    <DropdownMenuLinkItem closeOnClick render={<Link href={item.href} />} className="font-medium">
                      {t.nav.viewAll}
                    </DropdownMenuLinkItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <div className="max-h-72 overflow-y-auto">
                    {item.menu.map((entry) => (
                      <DropdownMenuLinkItem key={entry.href} closeOnClick render={<Link href={entry.href} />}>
                        {entry.label}
                      </DropdownMenuLinkItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-2.5 py-2 text-sm font-medium transition-colors hover:bg-[#F7F8FA] dark:hover:bg-[#30343B]",
                  isActive(pathname, item.href)
                    ? "text-[#F79432]"
                    : "text-secondary-foreground dark:text-white/85",
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle compact />
          <LanguageToggle compact />
          <Link href="/auth/customer/login" className="hidden shrink-0 whitespace-nowrap sm:block">
            <Button className="h-10 rounded-full bg-[#F79432] px-4 text-sm font-semibold text-primary-foreground hover:bg-[#FFB15C]">
              {t.nav.customerLogin}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t.nav.teamLogin}
              className="hidden h-10 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-[#F79432] px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#FFB15C] sm:inline-flex"
            >
              <span>{t.nav.teamLogin}</span>
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[#F79432]">{t.home.teamAccessTitle}</DropdownMenuLabel>
                <DropdownMenuLinkItem closeOnClick render={<Link href="/auth/admin/login" />}>
                  {t.home.adminLogin}
                </DropdownMenuLinkItem>
                <DropdownMenuLinkItem closeOnClick render={<Link href="/auth/staff/login" />}>
                  {t.home.staffLogin}
                </DropdownMenuLinkItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className="inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-[#F7F8FA] dark:text-white dark:hover:bg-[#30343B] xl:hidden"
              aria-label={t.nav.main}
            >
              <Menu className="size-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent
              side={dir === "rtl" ? "left" : "right"}
              closeLabel={t.common.close}
              className="w-[min(88vw,22rem)] p-0"
            >
              <SheetTitle className="sr-only">{t.nav.main}</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="border-b border-border px-5 py-4">
                  <Logo />
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label={t.nav.main}>
                  {links.map((item) => {
                    const menuId = `mobile-menu-${item.href.replace(/[^a-z0-9]/gi, "")}`;
                    if (!item.menu) {
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMobile}
                          className={cn(
                            "block rounded-xl px-3 py-3 text-base font-medium transition-colors hover:bg-[#F7F8FA] dark:hover:bg-[#30343B]",
                            isActive(pathname, item.href)
                              ? "text-[#F79432]"
                              : "text-secondary-foreground dark:text-white/85",
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    }
                    return (
                      <div key={item.href} className="border-b border-border/70 py-1">
                        <div className="flex items-center gap-1">
                          <Link
                            href={item.href}
                            onClick={closeMobile}
                            className={cn(
                              "flex-1 rounded-xl px-3 py-3 text-base font-medium transition-colors hover:bg-[#F7F8FA] dark:hover:bg-[#30343B]",
                              isActive(pathname, item.href)
                                ? "text-[#F79432]"
                                : "text-secondary-foreground dark:text-white/85",
                            )}
                          >
                            {item.label}
                          </Link>
                          <button
                            type="button"
                            onClick={() => setExpanded(expanded === item.href ? null : item.href)}
                            aria-expanded={expanded === item.href}
                            aria-controls={menuId}
                            aria-label={`${t.nav.viewAll} ${item.label}`}
                            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[#F7F8FA] dark:hover:bg-[#30343B]"
                          >
                            <ChevronDown
                              className={cn(
                                "size-4 transition-transform",
                                expanded === item.href && "rotate-180",
                              )}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                        {expanded === item.href && (
                          <div id={menuId} className="space-y-1 pb-3 ps-3">
                            {item.menu.map((entry) => (
                              <Link
                                key={entry.href}
                                href={entry.href}
                                onClick={closeMobile}
                                className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-[#F7F8FA] hover:text-[#F79432] dark:text-white/60 dark:hover:bg-[#30343B]"
                              >
                                {entry.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
                <div className="space-y-2 border-t border-border p-4">
                  <Link href="/request-quote" onClick={closeMobile}>
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-full border-[#F79432] text-[#F79432] hover:bg-[#F7F8FA] hover:text-[#F79432] dark:hover:bg-[#30343B]"
                    >
                      {t.nav.requestQuote}
                    </Button>
                  </Link>
                  <Link href="/auth/customer/login" onClick={closeMobile}>
                    <Button className="h-11 w-full rounded-full bg-[#F79432] font-semibold text-primary-foreground hover:bg-[#FFB15C]">
                      {t.nav.customerLogin}
                    </Button>
                  </Link>
                  <p className="pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.home.teamAccessTitle}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/auth/admin/login" onClick={closeMobile}>
                      <Button className="h-11 w-full rounded-full border border-transparent bg-[#24272D] text-sm font-semibold text-white hover:bg-[#30343B] dark:border-white/15 dark:bg-[#30343B] dark:text-white dark:hover:bg-[#3A3F47]">
                        {t.home.adminLogin}
                      </Button>
                    </Link>
                    <Link href="/auth/staff/login" onClick={closeMobile}>
                      <Button className="h-11 w-full rounded-full border border-transparent bg-[#24272D] text-sm font-semibold text-white hover:bg-[#30343B] dark:border-white/15 dark:bg-[#30343B] dark:text-white dark:hover:bg-[#3A3F47]">
                        {t.home.staffLogin}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );

  function closeMobile() {
    setMobileOpen(false);
    setExpanded(null);
  }
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/products?")) return pathname === "/products";
  return pathname === href || pathname.startsWith(`${href}/`);
}
