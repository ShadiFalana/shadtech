"use client";

import { completeLoginAction } from "@/actions/auth";
import { AuthSubmit } from "@/components/auth/auth-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const data = new FormData(event.currentTarget);
    const result = await signUp.email({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
    if (result.error) {
      setPending(false);
      toast.error(result.error.message ?? t.errors.generic);
      return;
    }
    const resolved = await completeLoginAction("customer");
    setPending(false);
    if (!resolved.ok) {
      toast.success(t.auth.verifyEmailTitle);
      router.push("/auth/verify-email");
      return;
    }
    router.push(resolved.redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t.auth.fullName}</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required dir="ltr" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t.auth.password}</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required dir="ltr" />
      </div>
      <AuthSubmit pending={pending}>{pending ? t.common.loading : t.auth.signUp}</AuthSubmit>
      <p className="text-sm text-muted-foreground">
        {t.auth.hasAccount}{" "}
        <Link href="/auth/customer/login" className="font-medium text-[#B86600] dark:text-[#FFB15C] hover:text-[#F79432]">
          {t.auth.signIn}
        </Link>
      </p>
    </form>
  );
}
