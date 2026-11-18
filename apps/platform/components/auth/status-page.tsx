"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react";

export function StatusPage({ kind }: { kind: "forbidden" | "notFound" | "unauthorized" }) {
  const { t } = useLanguage();
  const title =
    kind === "forbidden"
      ? t.errors.forbidden
      : kind === "notFound"
        ? t.errors.notFound
        : t.errors.unauthorized;
  const Icon = kind === "notFound" ? ShieldCheck : AlertTriangle;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-4">
      <Card className="w-full max-w-md border-[#E4E7EC] shadow-lg">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="mt-4 flex items-center gap-2 text-xl">
            <Icon className="size-5 text-[#F79432]" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-center">
          <Button nativeButton={false}
            render={<Link href="/" />}
            className="rounded-full bg-[#F79432] text-primary-foreground hover:bg-[#FFB15C]"
          >
            <ArrowLeft className="me-2 size-4" /> {t.common.back}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
