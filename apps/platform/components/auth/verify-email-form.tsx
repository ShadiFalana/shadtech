"use client";

import { AuthSubmit } from "@/components/auth/auth-shell";
import { useLanguage } from "@/components/providers/language-provider";
import { verifyEmail } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function VerifyEmailForm({ token }: { token: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await verifyEmail({ query: { token } });
    setPending(false);
    if (result.error) {
      toast.error(result.error.message ?? t.errors.generic);
      return;
    }
    toast.success(t.common.success);
    router.push("/auth/customer/login");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!token && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{t.errors.validation}</p>}
      <AuthSubmit pending={pending || !token}>{pending ? t.common.loading : t.auth.verifyEmailTitle}</AuthSubmit>
    </form>
  );
}
