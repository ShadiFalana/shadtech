import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { getServerDictionary } from "@/lib/server-i18n";

export const metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const t = await getServerDictionary();
  const params = await searchParams;
  return (
    <AuthShell title={t.auth.verifyEmailTitle}>
      <VerifyEmailForm token={params.token ?? ""} />
    </AuthShell>
  );
}
