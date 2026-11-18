import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getServerDictionary } from "@/lib/server-i18n";

export const metadata = { title: "Customer Sign In" };

export default async function CustomerLoginPage() {
  const t = await getServerDictionary();
  return (
    <AuthShell title={t.auth.customerTitle} subtitle={t.auth.customerSubtitle}>
      <LoginForm type="customer" />
    </AuthShell>
  );
}
