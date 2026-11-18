"use client";

import { replyTicket } from "@/actions/ticket-messages";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { translateKey } from "@/lib/dictionaries";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

export function ReplyForm({
  ticketId,
  allowInternal = false,
  mode = "reply",
}: {
  ticketId: string;
  allowInternal?: boolean;
  /** "internal" posts a staff-only note using the existing isInternal field. */
  mode?: "reply" | "internal" | "customer";
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const id = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [bodyError, setBodyError] = useState("");

  const internalOnly = mode === "internal";
  const showInternalToggle = allowInternal && mode !== "internal" && mode !== "customer";
  const label = internalOnly ? t.support.internalNote : t.support.reply;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = String(formData.get("body") ?? "").trim();
    if (body.length === 0 || body.length > 8000) {
      setBodyError(t.errors.validation);
      document.getElementById(`${id}-body`)?.focus();
      return;
    }
    setBodyError("");
    formData.set("ticketId", ticketId);
    if (internalOnly) formData.set("isInternal", "on");
    setPending(true);
    setError("");
    const result = await replyTicket(formData);
    setPending(false);
    if (result.ok) {
      form.reset();
      router.refresh();
    } else {
      setError(translateKey(t, result.errorKey) ?? t.common.error);
    }
  }

  return (
    <form onSubmit={onSubmit} aria-busy={pending} className="space-y-3">
      {internalOnly && <input type="hidden" name="isInternal" value="on" />}
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-body`}>{label}</Label>
        <Textarea
          id={`${id}-body`}
          name="body"
          rows={5}
          required
          maxLength={8000}
          placeholder={label}
          aria-invalid={Boolean(bodyError)}
          aria-describedby={bodyError ? `${id}-body-error` : undefined}
        />
        {bodyError && (
          <p id={`${id}-body-error`} role="alert" className="text-xs text-destructive">
            {bodyError}
          </p>
        )}
      </div>
      {showInternalToggle && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isInternal" className="size-4 accent-[var(--primary)]" />
          {t.support.internalNote}
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{t.common.required}</p>
      <Button type="submit" disabled={pending}>
        {pending ? t.forms.submitting : internalOnly ? t.support.addNote : t.support.send}
      </Button>
    </form>
  );
}
