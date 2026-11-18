import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getServerDictionary } from "@/lib/server-i18n";

export const metadata = { title: "Reset password" };

export default async function ForgotPasswordPage() {
  const t = await getServerDictionary();
  return (
    <AuthShell title={t.auth.resetTitle} subtitle={t.auth.resetSubtitle}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
