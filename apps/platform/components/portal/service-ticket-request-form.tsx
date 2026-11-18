"use client";

import { requestServiceTicket } from "@/actions/service-tickets";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { translateKey } from "@/lib/dictionaries";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ServiceTicketRequestForm({ serviceId }: { serviceId: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    const data = new FormData(form);
    data.set("serviceId", serviceId);
    const result = await requestServiceTicket(data);
    setPending(false);
    if (!result.ok) {
      toast.error(translateKey(t, result.errorKey) ?? t.common.error);
      return;
    }
    toast.success(translateKey(t, result.messageKey) ?? t.common.success);
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={`service-note-${serviceId}`}>{t.portal.serviceTicketNote}</Label>
        <Textarea id={`service-note-${serviceId}`} name="note" rows={2} maxLength={1000} />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? t.common.loading : t.portal.requestAsTicket}
      </Button>
    </form>
  );
}
