"use client";

import { submitContact } from "@/actions/contact";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { translateKey } from "@/lib/dictionaries";
import { servicesCatalog, text } from "@/lib/public-catalog";
import { useState } from "react";
import { toast } from "sonner";

export function ContactForm({ interest }: { interest?: string }) {
  const { locale, t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setDone(false);
    const formData = new FormData(form);
    const result = await submitContact(formData);
    setPending(false);

    if (result.ok) {
      setDone(true);
      toast.success(t.public.contactSent);
      form.reset();
      return;
    }
    toast.error(translateKey(t, result.error) ?? t.forms.unexpectedError);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t.auth.fullName} name="name" required />
        <Field label={t.forms.email} name="email" type="email" required />
        <Field label={t.forms.phone} name="phone" />
        <Field label={`${t.forms.company} (${t.common.optional})`} name="company" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="serviceInterest">{t.forms.service}</Label>
          <select
            id="serviceInterest"
            name="serviceInterest"
            defaultValue={interest ?? ""}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="">{t.forms.selectService}</option>
            {servicesCatalog.map((service) => (
              <option key={service.slug} value={service.slug}>
                {text(service.name, locale)}
              </option>
            ))}
            <option value="consultation">{t.forms.itConsultation}</option>
            <option value="other">{t.forms.other}</option>
          </select>
        </div>
        <Field label={t.forms.subject} name="subject" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">{t.forms.message}</Label>
        <Textarea id="message" name="message" required minLength={10} rows={5} />
      </div>
      {done && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          {t.public.contactReceived}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-11 bg-[#F79432] px-6 text-primary-foreground hover:bg-[#FFB15C]">
        {pending ? t.forms.submitting : t.forms.sendMessage}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}
