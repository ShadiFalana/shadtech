"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";

export function PasswordForm() {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");
    if (newPassword !== confirmPassword) {
      toast.error(t.forms.validationError);
      return;
    }

    setPending(true);
    const result = await changePassword({
      currentPassword: String(data.get("currentPassword") ?? ""),
      newPassword,
      revokeOtherSessions: true,
    });
    setPending(false);
    if (result.error) {
      toast.error(t.auth.invalidCredentials);
      return;
    }
    toast.success(t.portal.passwordChanged);
    form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">{t.portal.currentPassword}</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required dir="ltr" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">{t.auth.newPassword}</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          maxLength={128}
          dir="ltr"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">{t.portal.confirmPassword}</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required dir="ltr" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t.forms.submitting : t.portal.changePassword}
      </Button>
    </form>
  );
}
