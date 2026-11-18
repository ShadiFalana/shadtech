"use client";

import { Logo } from "@/components/brand/logo";
import { useLanguage } from "@/components/providers/language-provider";
import { servicesCatalog, solutionsCatalog, text } from "@/lib/public-catalog";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const { locale, t } = useLanguage();
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE;
  const address = process.env.NEXT_PUBLIC_CONTACT_ADDRESS;
  const socials = [
    { label: "LinkedIn", href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN },
    { label: "X", href: process.env.NEXT_PUBLIC_SOCIAL_X },
    { label: "Instagram", href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM },
  ].filter((social): social is { label: string; href: string } => Boolean(social.href));

  return (
    <footer className="bg-[#24272D] text-white">
      <div className="section-shell grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo light />
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">
            {t.footer.description}
          </p>
          <p className="mt-6 border-s-2 border-[#F79432] ps-4 text-sm font-semibold leading-6 text-[#FFB15C]">
            {t.brand.tagline}
          </p>
        </div>

        <FooterLinks
          title={t.nav.main}
          links={[
            { href: "/", label: t.nav.home },
            { href: "/services", label: t.nav.services },
            { href: "/solutions", label: t.nav.solutions },
            { href: "/products", label: t.nav.products },
            { href: "/industries", label: t.nav.industries },
            { href: "/about", label: t.nav.about },
            { href: "/contact", label: t.nav.contact },
            { href: "/auth/customer/login", label: t.nav.customerLogin },
            { href: "/auth/admin/login", label: t.home.adminLogin },
            { href: "/auth/staff/login", label: t.home.staffLogin },
          ]}
        />

        <FooterLinks
          title={t.footer.services}
          links={servicesCatalog.slice(0, 6).map((service) => ({
            href: `/services/${service.slug}`,
            label: text(service.name, locale),
          }))}
        />

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#FFB15C]">
            {t.footer.solutions}
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-white/65">
            {solutionsCatalog.slice(0, 4).map((solution) => (
              <li key={solution.slug}>
                <Link href={`/solutions/${solution.slug}`} className="hover:text-white">
                  {text(solution.title, locale)}
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#FFB15C]">
            {t.footer.contact}
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-white/65">
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-[#F79432]" aria-hidden="true" />
              {email ? (
                <a href={`mailto:${email}`} className="hover:text-white">
                  {email}
                </a>
              ) : (
                <span>{t.footer.emailPending}</span>
              )}
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-[#F79432]" aria-hidden="true" />
              {phone ? (
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="hover:text-white">
                  {phone}
                </a>
              ) : (
                <span>{t.footer.phonePending}</span>
              )}
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[#F79432]" aria-hidden="true" />
              <span>{address || t.footer.addressPending}</span>
            </li>
          </ul>
          {socials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#FFB15C] hover:text-white"
                  >
                    {social.label}
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="section-shell flex flex-col gap-3 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {t.brand.name}. {t.footer.rights}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-white">
              {t.nav.privacy}
            </Link>
            <Link href="/terms" className="hover:text-white">
              {t.nav.terms}
            </Link>
            <Link href="/faq" className="hover:text-white">
              {t.nav.faq}
            </Link>
            <Link href="/status" className="hover:text-white">
              {t.nav.status}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#FFB15C]">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm text-white/65">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
