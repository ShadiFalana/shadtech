"use client";

import { useSyncExternalStore } from "react";

const copy = {
  en: {
    title: "Something went wrong",
    body: "Please reload the page. If the problem continues, contact support.",
    action: "Try again",
  },
  ar: {
    title: "حدث خطأ ما",
    body: "يرجى إعادة تحميل الصفحة. إذا استمرت المشكلة، تواصل مع الدعم.",
    action: "حاول مرة أخرى",
  },
} as const;

function subscribeDocument(listener: () => void) {
  if (typeof document === "undefined") return () => {};
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang", "class"],
  });
  return () => observer.disconnect();
}

function getLocaleSnapshot(): "en" | "ar" {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang === "ar" ? "ar" : "en";
}

function getLocaleServerSnapshot(): "en" {
  return "en";
}

function getDarkSnapshot() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function getDarkServerSnapshot() {
  return false;
}

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = useSyncExternalStore(subscribeDocument, getLocaleSnapshot, getLocaleServerSnapshot);
  const dark = useSyncExternalStore(subscribeDocument, getDarkSnapshot, getDarkServerSnapshot);

  const text = copy[locale];
  const colors = {
    page: dark ? "#20242A" : "#F7F8FA",
    surface: dark ? "#24272D" : "#FFFFFF",
    foreground: dark ? "#FFFFFF" : "#20242A",
    muted: dark ? "#B8BEC7" : "#777F89",
  };

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: colors.page, color: colors.foreground }}>
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <div style={{ maxWidth: 520, borderRadius: 20, background: colors.surface, padding: 32, textAlign: "center", boxShadow: "0 12px 35px rgba(36,39,45,.08)" }}>
            <h1 style={{ fontSize: 22, margin: 0 }}>{text.title}</h1>
            <p style={{ color: colors.muted, lineHeight: 1.7 }}>{text.body}</p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 16, border: 0, borderRadius: 9999, background: "#F79432", color: "#20242A", padding: "10px 22px", fontWeight: 700, cursor: "pointer" }}
            >
              {text.action}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
