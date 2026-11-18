"use client";

import { replyTicket } from "@/actions/ticket-messages";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    const formData = new FormData(form);
    formData.set("ticketId", ticketId);
    const result = await replyTicket(formData);
    setPending(false);
    if (result.ok) {
      toast.success(t.common.success);
      form.reset();
    } else {
      toast.error(t.common.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="body">{t.support.reply}</Label>
        <Textarea id="body" name="body" required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t.common.loading : t.support.send}
      </Button>
    </form>
  );
}
