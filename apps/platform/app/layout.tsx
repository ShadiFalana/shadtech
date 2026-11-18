import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Cairo, IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { getDirection, isLocale, localeCookieName, type Locale } from "@/lib/dictionaries";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-arabic",
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic", "latin"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "ShadTech — Technology That Works. Support You Can Trust.",
    template: "%s | ShadTech",
  },
  description:
    "ShadTech delivers reliable IT services, technical support, and technology solutions for individuals, students, and businesses.",
  applicationName: "ShadTech",
  openGraph: {
    title: "ShadTech",
    description: "Technology That Works. Support You Can Trust.",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(localeCookieName)?.value;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en";
  const dir = getDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${inter.variable} ${ibmPlexArabic.variable} ${cairo.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
          <Toaster richColors position={dir === "rtl" ? "top-left" : "top-right"} />
          <ServiceWorkerRegistrar />
        </ThemeProvider>
      </body>
    </html>
  );
}
