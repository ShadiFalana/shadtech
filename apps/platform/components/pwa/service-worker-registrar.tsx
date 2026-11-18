"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // PWA support is optional; registration failures must not affect the app.
    });
  }, []);

  return null;
}
