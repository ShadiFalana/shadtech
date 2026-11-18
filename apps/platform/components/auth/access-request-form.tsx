"use client";

import { submitAccountRequest } from "@/actions/account-requests";
import { AuthFooterLinks, AuthSubmit, AuthTextLink } from "@/components/auth/auth-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { signUp } from "@/lib/auth-client";
import { translateKey } from "@/lib/dictionaries";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const requestableRoles = ["ADMIN", "SUPPORT_AGENT", "CONTENT_MANAGER"] as const;

export function AccessRequestForm() {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const roleLabels = t.roles as Record<string, string>;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const data = new FormData(event.currentTarget);

    const signUpResult = await signUp.email({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
    if (signUpResult.error) {
      setPending(false);
      toast.error(
        signUpResult.error.status === 429 ? t.forms.rateLimitError : t.forms.validationError,
      );
      return;
    }

    const requestResult = await submitAccountRequest(data);
    setPending(false);
    if (!requestResult.ok) {
      toast.error(translateKey(t, requestResult.errorKey) ?? t.common.error);
      return;
    }
    toast.success(t.auth.requestSubmitted);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{t.auth.requestSubmitted}</p>
        <AuthFooterLinks>
          <AuthTextLink href="/dashboard">{t.auth.continueAs}</AuthTextLink>
          <AuthTextLink href="/auth/customer/login">{t.auth.signIn}</AuthTextLink>
        </AuthFooterLinks>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="rounded-lg bg-[#FFB15C]/10 p-3 text-xs leading-5 text-muted-foreground">
        {t.auth.requestAccessIntro}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="name">{t.auth.fullName}</Label>
        <Input id="name" name="name" required minLength={2} autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" dir="ltr" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{t.auth.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          dir="ltr"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="requestedRole">{t.auth.requestedRole}</Label>
        <select
          id="requestedRole"
          name="requestedRole"
          required
          className="flex h-11 w-full cursor-pointer rounded-xl border border-input bg-transparent px-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {requestableRoles.map((role) => (
            <option key={role} value={role}>
              {roleLabels[role] ?? role}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">{t.auth.requestNoSuperAdmin}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">{t.auth.requestNote}</Label>
        <Textarea id="note" name="note" maxLength={500} rows={3} />
      </div>
      <AuthSubmit pending={pending}>{pending ? t.forms.submitting : t.auth.requestSubmit}</AuthSubmit>
      <Link href="/auth/customer/login" className="text-sm font-medium text-[#B86600] dark:text-[#FFB15C] hover:text-[#F79432]">
        {t.auth.hasAccount} {t.auth.signIn}
      </Link>
    </form>
  );
}
