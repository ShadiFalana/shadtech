import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getServerDictionary } from "@/lib/server-i18n";

export const metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const t = await getServerDictionary();
  const params = await searchParams;
  return (
    <AuthShell title={t.auth.resetTitle} subtitle={t.auth.newPassword}>
      <ResetPasswordForm token={params.token ?? ""} />
    </AuthShell>
  );
}
