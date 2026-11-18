"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="surface-card w-full max-w-lg p-8 text-center" role="alert">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          {t.common.error}
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{t.errors.generic}</p>
        <Button variant="brand" size="xl" className="mt-6" onClick={reset}>
          <RotateCcw className="me-2 size-4" />
          {t.common.refresh}
        </Button>
      </div>
    </div>
  );
}
