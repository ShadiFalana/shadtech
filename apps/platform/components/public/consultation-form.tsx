"use client";

import { submitConsultationRequest } from "@/actions/public-forms";
import { Honeypot, TextAreaField, TextField } from "@/components/public/form-field";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function ConsultationForm() {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setDone(false);
    try {
      const result = await submitConsultationRequest(new FormData(form));
      if (result.ok) {
        form.reset();
        setDone(true);
        toast.success(t.public.consultationSubmitted);
      } else {
        toast.error(
          result.error === "rateLimit"
            ? t.forms.rateLimitError
            : result.error === "validation"
              ? t.forms.validationError
              : t.forms.unexpectedError,
        );
      }
    } catch {
      toast.error(t.forms.unexpectedError);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t.forms.name} name="name" required autoComplete="name" />
        <TextField label={t.forms.email} name="email" type="email" required autoComplete="email" />
        <TextField label={t.forms.phone} name="phone" autoComplete="tel" />
        <TextField label={t.forms.company} name="company" autoComplete="organization" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t.forms.service} name="service" required />
        <TextField
          label={t.public.preferredTime}
          name="preferredTime"
          type="datetime-local"
          required
        />
      </div>
      <TextAreaField label={t.forms.details} name="details" required minLength={10} />
      {done && (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t.public.consultationSubmitted}
        </p>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-full bg-[#F79432] px-6 text-primary-foreground hover:bg-[#FFB15C]"
      >
        {pending ? t.public.sending : t.public.sendRequest}
      </Button>
    </form>
  );
}
