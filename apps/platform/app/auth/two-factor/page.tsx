import { AuthShell } from "@/components/auth/auth-shell";
import { TwoFactorForm } from "@/components/auth/two-factor-form";
import { getServerDictionary } from "@/lib/server-i18n";

export const metadata = { title: "Two-factor verification" };

export default async function TwoFactorPage() {
  const t = await getServerDictionary();
  return (
    <AuthShell title={t.auth.twoFactorTitle} subtitle={t.auth.twoFactorSubtitle}>
      <TwoFactorForm />
    </AuthShell>
  );
}
