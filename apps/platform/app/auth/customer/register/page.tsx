import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getServerDictionary } from "@/lib/server-i18n";

export const metadata = { title: "Create Account" };

export default async function RegisterPage() {
  const t = await getServerDictionary();
  return (
    <AuthShell title={t.auth.signUp} subtitle={t.auth.customerSubtitle}>
      <RegisterForm />
    </AuthShell>
  );
}
