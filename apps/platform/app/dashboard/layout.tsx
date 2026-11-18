import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireCustomerProfile } from "@/lib/session";
import { getWorkspaceShellData, workspaceForRole } from "@/lib/workspace";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session } = await requireCustomerProfile();
  const shellData = await getWorkspaceShellData(session.user);

  return (
    <DashboardShell workspace={workspaceForRole(session.user.role)} user={shellData.user} notifications={shellData.notifications}>
      {children}
    </DashboardShell>
  );
}
