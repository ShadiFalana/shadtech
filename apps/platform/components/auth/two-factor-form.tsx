"use client";

import { dashboardAfterAuthAction } from "@/actions/auth";
import { AuthSubmit } from "@/components/auth/auth-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { twoFactor } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function TwoFactorForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    const result = await twoFactor.verifyTotp({ code: String(data.get("code") ?? "") });
    if (result.error) {
      setPending(false);
      toast.error(result.error.message ?? t.errors.validation);
      return;
    }
    const resolved = await dashboardAfterAuthAction();
    setPending(false);
    if (!resolved.ok) {
      toast.error(t.errors.unauthorized);
      return;
    }
    router.push(resolved.redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">{t.auth.code}</Label>
        <Input id="code" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required dir="ltr" />
      </div>
      <AuthSubmit pending={pending}>{pending ? t.common.loading : t.auth.verify}</AuthSubmit>
    </form>
  );
}
