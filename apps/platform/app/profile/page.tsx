import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AvatarUpload } from "@/components/portal/avatar-upload";
import { PasswordForm } from "@/components/portal/password-form";
import { ProfileForm } from "@/components/portal/profile-form";
import { SessionControls } from "@/components/portal/session-controls";
import { DetailsGrid, type DetailItem } from "@/components/workspace/details-grid";
import { SectionCard } from "@/components/workspace/section-card";
import { prisma } from "@/lib/db";
import { translateKey } from "@/lib/dictionaries";
import { formatDate } from "@/lib/format";
import { integrationIsConfigured } from "@/lib/integrations";
import { normaliseRole } from "@/lib/permissions";
import { getServerDictionary, getServerLocale } from "@/lib/server-i18n";
import { requireAuth } from "@/lib/session";
import { getWorkspaceShellData, workspaceForRole } from "@/lib/workspace";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await requireAuth();
  const role = normaliseRole((session.user as { role?: string }).role);
  const locale = await getServerLocale();
  const t = await getServerDictionary();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      bio: true,
      role: true,
      emailVerified: true,
      twoFactorEnabled: true,
      createdAt: true,
      customerProfile: {
        select: {
          phone: true,
          company: true,
          address: true,
          city: true,
          country: true,
        },
      },
    },
  });
  if (!user) redirect("/auth/customer/login");

  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase();
  const location = [user.customerProfile?.address, user.customerProfile?.city, user.customerProfile?.country]
    .filter(Boolean)
    .join(", ");
  const details: DetailItem[] = [
    { labelKey: "forms.email", value: user.email },
    { labelKey: "forms.role", value: translateKey(t, `roles.${user.role}`) ?? user.role },
    { labelKey: "portal.memberSince", value: formatDate(user.createdAt, locale) },
    { labelKey: "portal.emailVerified", value: user.emailVerified ? t.common.yes : t.common.no },
    { labelKey: "auth.twoFactorTitle", value: user.twoFactorEnabled ? t.common.yes : t.common.no },
    { labelKey: "forms.phone", value: user.customerProfile?.phone ?? "—" },
    { labelKey: "forms.company", value: user.customerProfile?.company ?? "—" },
    { labelKey: "forms.location", value: location || "—" },
  ];
  const fileStorageConfigured = integrationIsConfigured("fileStorage");
  const shellData = await getWorkspaceShellData(session.user);

  return (
    <DashboardShell
      workspace={workspaceForRole(role)}
      titleKey="portal.profile"
      user={shellData.user}
      notifications={shellData.notifications}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#E4E7EC] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#30343B] sm:flex-row sm:items-center">
          <Avatar className="size-16 text-lg">
            {user.image ? <AvatarImage src={user.image} alt={t.portal.profilePhoto} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground dark:text-white">
              {user.name ?? t.portal.profile}
            </h1>
            <p className="text-sm text-muted-foreground">{user.bio ?? "—"}</p>
          </div>
          {fileStorageConfigured ? (
            <AvatarUpload hasImage={Boolean(user.image)} />
          ) : (
            <div className="max-w-sm text-xs leading-5 text-muted-foreground">
              <p>{t.portal.uploadNotConfigured}</p>
              <p>{t.portal.uploadSetup}</p>
            </div>
          )}
        </div>

        <SectionCard titleKey="sections.details">
          <DetailsGrid items={details} />
        </SectionCard>

        <SectionCard titleKey="sections.details" descriptionKey="portal.bioHelp">
          <ProfileForm
            initial={{
              name: user.name,
              bio: user.bio,
              phone: user.customerProfile?.phone,
              company: user.customerProfile?.company,
              address: user.customerProfile?.address,
            }}
          />
        </SectionCard>

        <SectionCard titleKey="portal.accountControls">
          <div className="space-y-8">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-foreground dark:text-white">
                {t.portal.changePassword}
              </h2>
              <PasswordForm />
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold text-foreground dark:text-white">
                {t.portal.activeSessions}
              </h2>
              <SessionControls />
            </div>
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
