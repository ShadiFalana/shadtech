import { AccessRequestForm } from "@/components/auth/access-request-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getServerDictionary } from "@/lib/server-i18n";

export const metadata = { title: "Request access" };

export default async function RequestAccessPage() {
  const t = await getServerDictionary();
  return (
    <AuthShell title={t.auth.requestAccessTitle} subtitle={t.auth.requestAccessSubtitle}>
      <AccessRequestForm />
    </AuthShell>
  );
}
