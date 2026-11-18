import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getServerDictionary } from "@/lib/server-i18n";

export const metadata = { title: "Administrator Sign In" };

export default async function AdminLoginPage() {
  const t = await getServerDictionary();
  return (
    <AuthShell title={t.auth.adminTitle} subtitle={t.auth.adminSubtitle}>
      <LoginForm type="admin" />
    </AuthShell>
  );
}
