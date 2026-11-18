"use client";

import { addTicketAttachment } from "@/actions/ticket-attachments";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AttachmentReferenceForm({ ticketId }: { ticketId: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("ticketId", ticketId);

    setPending(true);
    setError("");
    const result = await addTicketAttachment(formData);
    setPending(false);
    if (result.ok) {
      form.reset();
      router.refresh();
    } else {
      setError(result.error === "notFound" ? t.errors.notFound : t.errors.validation);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-xs text-muted-foreground">{t.forms.referenceOnly}</p>
      <div>
        <Label htmlFor="attachment-name">{t.forms.fileName}</Label>
        <Input id="attachment-name" name="fileName" required maxLength={180} />
      </div>
      <div>
        <Label htmlFor="attachment-url">{t.forms.fileUrl}</Label>
        <Input id="attachment-url" name="fileUrl" type="url" required maxLength={2000} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="attachment-mime">{t.forms.mimeType} ({t.common.optional})</Label>
          <Input id="attachment-mime" name="mimeType" maxLength={120} />
        </div>
        <div>
          <Label htmlFor="attachment-size">{t.forms.fileSize} ({t.common.optional})</Label>
          <Input id="attachment-size" name="fileSize" type="number" min={0} />
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? t.forms.submitting : t.actions.addReference}
      </Button>
    </form>
  );
}
