import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getServerDictionary } from "@/lib/server-i18n";

export const metadata = { title: "Staff Sign In" };

export default async function StaffLoginPage() {
  const t = await getServerDictionary();
  return (
    <AuthShell title={t.auth.staffTitle} subtitle={t.auth.staffSubtitle}>
      <LoginForm type="staff" />
    </AuthShell>
  );
}
