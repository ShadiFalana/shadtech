"use client";

import { changeUserRole, createUserByAdmin } from "@/actions/admin-users";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translateKey } from "@/lib/dictionaries";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const roleValues = ["SUPER_ADMIN", "ADMIN", "SUPPORT_AGENT", "CONTENT_MANAGER", "CUSTOMER"] as const;
type RoleValue = (typeof roleValues)[number];

function RoleOptions({ canGrantSuperAdmin }: { canGrantSuperAdmin: boolean }) {
  const { t } = useLanguage();
  const labels = t.roles as Record<string, string>;
  return (
    <>
      {roleValues
        .filter((role) => role !== "SUPER_ADMIN" || canGrantSuperAdmin)
        .map((role) => (
          <option key={role} value={role}>
            {labels[role] ?? role}
          </option>
        ))}
    </>
  );
}

export function CreateUserForm({ canGrantSuperAdmin }: { canGrantSuperAdmin: boolean }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    const result = await createUserByAdmin(new FormData(form));
    setPending(false);
    if (!result.ok) {
      toast.error(translateKey(t, result.errorKey) ?? t.common.error);
      return;
    }
    toast.success(translateKey(t, result.errorKey) ?? t.common.success);
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="new-name">{t.auth.fullName}</Label>
        <Input id="new-name" name="name" required minLength={2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-email">{t.auth.email}</Label>
        <Input id="new-email" name="email" type="email" required dir="ltr" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">{t.admin.initialPassword}</Label>
        <Input
          id="new-password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          dir="ltr"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-role">{t.forms.role}</Label>
        <select
          id="new-role"
          name="role"
          required
          defaultValue="CUSTOMER"
          className="flex h-9 w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <RoleOptions canGrantSuperAdmin={canGrantSuperAdmin} />
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-title">{t.admin.jobTitle}</Label>
        <Input id="new-title" name="title" maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-department">{t.admin.department}</Label>
        <Input id="new-department" name="department" maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-phone">{t.forms.phone}</Label>
        <Input id="new-phone" name="phone" maxLength={50} dir="ltr" />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending}>
          {pending ? t.forms.submitting : t.admin.createUser}
        </Button>
      </div>
    </form>
  );
}

export function ChangeUserRoleForm({
  userId,
  role,
  canGrantSuperAdmin,
  disabled,
}: {
  userId: string;
  role: RoleValue;
  canGrantSuperAdmin: boolean;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await changeUserRole(new FormData(event.currentTarget));
    setPending(false);
    if (!result.ok) {
      toast.error(translateKey(t, result.errorKey) ?? t.common.error);
      return;
    }
    toast.success(translateKey(t, result.errorKey) ?? t.common.success);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={role}
        disabled={disabled || pending}
        className="flex h-9 cursor-pointer rounded-lg border border-input bg-transparent px-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
      >
        <RoleOptions canGrantSuperAdmin={canGrantSuperAdmin} />
      </select>
      <Button type="submit" size="sm" disabled={disabled || pending}>
        {pending ? t.common.loading : t.common.save}
      </Button>
    </form>
  );
}
