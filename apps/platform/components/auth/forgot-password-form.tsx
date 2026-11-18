"use client";

import { AuthSubmit } from "@/components/auth/auth-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const data = new FormData(event.currentTarget);
    const redirectTo = `${window.location.origin}/auth/reset-password`;
    const result = await requestPasswordReset({
      email: String(data.get("email") ?? ""),
      redirectTo,
    });
    setPending(false);
    if (result.error) {
      toast.error(t.auth.resetUnavailable);
      return;
    }
    setSent(true);
    toast.success(t.auth.resetLinkSent);
  }

  return (
    <div className="space-y-4">
      {sent && <p className="rounded-lg bg-[#FFF3E6] p-3 text-sm">{t.auth.resetLinkSent}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t.auth.email}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required dir="ltr" />
        </div>
        <AuthSubmit pending={pending}>{pending ? t.common.loading : t.auth.sendResetLink}</AuthSubmit>
      </form>
    </div>
  );
}
