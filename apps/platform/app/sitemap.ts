import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const routes = [
    "",
    "/about",
    "/services",
    "/solutions",
    "/products",
    "/industries",
    "/pricing",
    "/knowledge",
    "/blog",
    "/faq",
    "/contact",
    "/request-quote",
    "/book-consultation",
    "/assessment",
    "/careers",
    "/privacy",
    "/terms",
    "/status",
    "/auth/customer/login",
    "/auth/admin/login",
    "/auth/staff/login",
  ];
  return routes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() }));
}
