"use client";

import { updateProfile } from "@/actions/profile";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { translateKey } from "@/lib/dictionaries";
import { useState } from "react";
import { toast } from "sonner";

type ProfileInitial = {
  name?: string | null;
  bio?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
};

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await updateProfile(new FormData(event.currentTarget));
    setPending(false);
    if (result.ok) toast.success(t.common.success);
    else toast.error(translateKey(t, result.errorKey) ?? t.common.error);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">{t.forms.name}</Label>
        <Input id="name" name="name" defaultValue={initial.name ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">{t.portal.bio}</Label>
        <Textarea id="bio" name="bio" rows={4} maxLength={500} defaultValue={initial.bio ?? ""} />
        <p className="text-xs text-muted-foreground">{t.portal.bioHelp}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">{t.forms.phone}</Label>
        <Input id="phone" name="phone" defaultValue={initial.phone ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="company">{t.forms.company}</Label>
        <Input id="company" name="company" defaultValue={initial.company ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">{t.forms.location}</Label>
        <Input id="address" name="address" defaultValue={initial.address ?? ""} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t.common.loading : t.common.save}
      </Button>
    </form>
  );
}
