"use client";

import { completeLoginAction } from "@/actions/auth";
import { AuthSubmit, AuthTextLink } from "@/components/auth/auth-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signOut } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type LoginType = "customer" | "admin" | "staff";

const demoCredentials: Record<LoginType, { email: string; password: string }> = {
  customer: { email: "customer1@demo.local", password: "ChangeMe123!" },
  admin: { email: "admin@shadtech.local", password: "ChangeMe123!" },
  staff: { email: "agent1@demo.local", password: "ChangeMe123!" },
};

export function LoginForm({ type }: { type: LoginType }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const showDemo = process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS !== "false";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    const result = await signIn.email({ email, password });
    if (result.error) {
      setPending(false);
      toast.error(t.auth.invalidCredentials);
      return;
    }

    const twoFactorRedirect = (result.data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect;
    if (twoFactorRedirect) {
      setPending(false);
      router.push("/auth/two-factor");
      return;
    }

    const resolved = await completeLoginAction(type);
    setPending(false);
    if (!resolved.ok) {
      await signOut();
      toast.error(resolved.error === "roleMismatch" ? t.auth.roleMismatch : t.errors.unauthorized);
      return;
    }

    toast.success(t.auth.redirecting);
    router.push(resolved.redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t.auth.email}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required dir="ltr" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Link href="/auth/forgot-password" className="text-xs font-medium text-[#B86600] dark:text-[#FFB15C] hover:text-[#F79432]">
              {t.auth.forgotPassword}
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required dir="ltr" />
        </div>
        <AuthSubmit pending={pending}>{pending ? t.auth.signingIn : t.auth.signIn}</AuthSubmit>
      </form>

      {showDemo && (
        <Card className="border-dashed bg-[#FFB15C]/10">
          <CardContent className="space-y-1 p-4 text-xs">
            <p className="font-semibold text-foreground dark:text-white">{t.auth.demoCredentials}</p>
            <p dir="ltr" className="text-muted-foreground">
              {demoCredentials[type].email} / {demoCredentials[type].password}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        {type === "customer" ? (
          <AuthTextLink href="/auth/customer/register">
            {t.auth.noAccount} {t.auth.signUp}
          </AuthTextLink>
        ) : (
          <AuthTextLink href="/auth/request-access">
            {type === "admin" ? t.auth.requestAdminAccess : t.auth.requestStaffAccess}
          </AuthTextLink>
        )}
        <Link href="/" className="text-sm font-medium text-[#B86600] dark:text-[#FFB15C] hover:text-[#F79432]">
          {t.common.back}
        </Link>
      </div>
    </div>
  );
}
