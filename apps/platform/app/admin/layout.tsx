import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requirePermission } from "@/lib/session";
import { getWorkspaceShellData, workspaceForRole } from "@/lib/workspace";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePermission("admin.access", "admin");
  const shellData = await getWorkspaceShellData(session.user);

  return (
    <DashboardShell workspace={workspaceForRole(session.user.role)} user={shellData.user} notifications={shellData.notifications}>
      {children}
    </DashboardShell>
  );
}
