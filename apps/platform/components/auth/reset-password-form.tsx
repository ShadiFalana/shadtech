"use client";

import { AuthSubmit } from "@/components/auth/auth-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");
    if (password !== confirmation) {
      toast.error(t.errors.validation);
      return;
    }
    setPending(true);
    const result = await resetPassword({ newPassword: password, token });
    setPending(false);
    if (result.error) {
      toast.error(result.error.message ?? t.errors.generic);
      return;
    }
    toast.success(t.common.success);
    router.push("/auth/customer/login");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!token && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{t.errors.validation}</p>}
      <div className="space-y-2">
        <Label htmlFor="password">{t.auth.newPassword}</Label>
        <Input id="password" name="password" type="password" minLength={8} required dir="ltr" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmation">{t.auth.confirmPassword}</Label>
        <Input id="confirmation" name="confirmation" type="password" minLength={8} required dir="ltr" />
      </div>
      <AuthSubmit pending={pending}>{pending ? t.common.loading : t.auth.resetTitle}</AuthSubmit>
    </form>
  );
}
