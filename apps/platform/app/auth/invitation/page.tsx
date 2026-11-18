import { AuthShell } from "@/components/auth/auth-shell";
import { getServerDictionary } from "@/lib/server-i18n";

export const metadata = { title: "Accept invitation" };

export default async function InvitationPage() {
  const t = await getServerDictionary();
  return (
    <AuthShell title={t.auth.invitationTitle} subtitle={t.auth.invitationUnavailable}>
      <div className="rounded-xl border border-dashed bg-[#F7F8FA] p-4 text-sm text-muted-foreground dark:bg-[#30343B]">
        {t.auth.invitationUnavailable}
      </div>
    </AuthShell>
  );
}
