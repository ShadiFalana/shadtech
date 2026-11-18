"use client";

import { createTicket } from "@/actions/tickets";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { translateKey } from "@/lib/dictionaries";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const draftKey = "shadtech.new-ticket.draft";

type Draft = {
  subject: string;
  category: string;
  priority: string;
  description: string;
};

type DraftField = keyof Draft;

const emptyDraft: Draft = { subject: "", category: "", priority: "MEDIUM", description: "" };

type DraftSnapshot = { values: Draft; step: number };

const draftListeners = new Set<() => void>();
let cachedDraft: DraftSnapshot | null = null;

function subscribeDraft(listener: () => void) {
  draftListeners.add(listener);
  const handleStorage = () => {
    cachedDraft = readDraft();
    listener();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  cachedDraft = readDraft();
  return () => {
    draftListeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
    if (draftListeners.size === 0) cachedDraft = null;
  };
}

function readDraft(): DraftSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(draftKey);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<Draft> & { step?: number };
    return {
      values: {
        subject: typeof saved.subject === "string" ? saved.subject : "",
        category: typeof saved.category === "string" ? saved.category : "",
        priority: priorities.includes(saved.priority as (typeof priorities)[number])
          ? (saved.priority as string)
          : "MEDIUM",
        description: typeof saved.description === "string" ? saved.description : "",
      },
      step: typeof saved.step === "number" ? Math.min(4, Math.max(0, Math.round(saved.step))) : 0,
    };
  } catch {
    // A malformed or unavailable draft must never block the form.
    return null;
  }
}

function getDraftSnapshot() {
  return cachedDraft;
}

function getDraftServerSnapshot() {
  return null;
}

function saveDraft(snapshot: DraftSnapshot) {
  cachedDraft = snapshot;
  try {
    window.sessionStorage.setItem(draftKey, JSON.stringify(snapshot));
  } catch {
    // Storage is optional; in-memory state is still preserved between steps.
  }
  draftListeners.forEach((listener) => listener());
}

function clearDraft() {
  cachedDraft = null;
  try {
    window.sessionStorage.removeItem(draftKey);
  } catch {
    // Ignore storage failures after a successful submission.
  }
  draftListeners.forEach((listener) => listener());
}

export function NewTicketForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const savedDraft = useSyncExternalStore(subscribeDraft, getDraftSnapshot, getDraftServerSnapshot);
  const [appliedDraft, setAppliedDraft] = useState<DraftSnapshot | null>(null);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Partial<Record<DraftField, string>>>({});
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);

  if (savedDraft && savedDraft !== appliedDraft) {
    setAppliedDraft(savedDraft);
    setValues(savedDraft.values);
    setStep(savedDraft.step);
  }

  const stepLabels = [
    t.forms.subject,
    t.forms.category,
    t.forms.priority,
    t.forms.description,
    t.sections.summary,
  ];
  const currentField: DraftField | null = (["subject", "category", "priority", "description"] as const)[step] ?? null;
  const fieldIds: Record<DraftField, string> = {
    subject: "new-ticket-subject",
    category: "new-ticket-category",
    priority: "new-ticket-priority",
    description: "new-ticket-description",
  };

  function update(field: DraftField, value: string) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    saveDraft({ values: nextValues, step });
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError("");
  }

  function validateStep(): boolean {
    if (!currentField) return true;
    const nextErrors: Partial<Record<DraftField, string>> = {};
    if (currentField === "subject" && values.subject.trim().length < 3) {
      nextErrors.subject = t.errors.validation;
    }
    if (currentField === "description" && values.description.trim().length < 5) {
      nextErrors.description = t.errors.validation;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      document.getElementById(fieldIds[currentField])?.focus();
      return false;
    }
    return true;
  }

  function goNext() {
    if (!validateStep()) return;
    const nextStep = Math.min(4, step + 1);
    setStep(nextStep);
    saveDraft({ values, step: nextStep });
  }

  function goBack() {
    setErrors({});
    setServerError("");
    const nextStep = Math.max(0, step - 1);
    setStep(nextStep);
    saveDraft({ values, step: nextStep });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 4) {
      goNext();
      return;
    }
    setPending(true);
    setServerError("");
    const formData = new FormData();
    formData.set("subject", values.subject.trim());
    formData.set("category", values.category.trim());
    formData.set("priority", values.priority);
    formData.set("description", values.description.trim());
    const result = await createTicket(formData);
    setPending(false);
    if (result.ok) {
      clearDraft();
      toast.success(t.common.success);
      router.push(`/dashboard/tickets/${result.id}`);
      router.refresh();
    } else {
      const message = translateKey(t, result.errorKey) ?? t.common.error;
      setServerError(message);
      toast.error(message);
    }
  }

  function fieldHelp(field: DraftField) {
    return field === "category" ? t.common.optional : t.common.required;
  }

  function errorFor(field: DraftField) {
    return errors[field] ? (
      <p id={`${fieldIds[field]}-error`} className="text-xs text-destructive" role="alert">
        {errors[field]}
      </p>
    ) : null;
  }

  function describedBy(field: DraftField) {
    return `${fieldIds[field]}-help${errors[field] ? ` ${fieldIds[field]}-error` : ""}`;
  }

  return (
    <form onSubmit={onSubmit} aria-busy={pending} className="max-w-2xl space-y-4">
      <nav aria-label={t.common.timeline}>
        <ol className="flex flex-wrap gap-2 text-xs">
          {stepLabels.map((label, index) => (
            <li
              key={label}
              aria-current={index === step ? "step" : undefined}
              className={`rounded-full border px-2.5 py-1 ${
                index === step
                  ? "border-brand-orange bg-brand-orange/10 font-semibold text-brand-ink dark:text-[#FFB15C]"
                  : "border-[#E4E7EC] text-muted-foreground dark:border-white/10"
              }`}
            >
              <span className="me-1 tabular-nums">{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      </nav>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {step + 1} / {stepLabels.length} · {stepLabels[step]}
      </p>

      {step === 0 && (
        <div className="space-y-1.5">
          <Label htmlFor={fieldIds.subject}>{t.forms.subject}</Label>
          <Input
            id={fieldIds.subject}
            name="subject"
            value={values.subject}
            onChange={(event) => update("subject", event.target.value)}
            required
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={describedBy("subject")}
          />
          <p id={`${fieldIds.subject}-help`} className="text-xs text-muted-foreground">
            {fieldHelp("subject")}
          </p>
          {errorFor("subject")}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-1.5">
          <Label htmlFor={fieldIds.category}>{t.forms.category}</Label>
          <Input
            id={fieldIds.category}
            name="category"
            value={values.category}
            onChange={(event) => update("category", event.target.value)}
            aria-describedby={describedBy("category")}
          />
          <p id={`${fieldIds.category}-help`} className="text-xs text-muted-foreground">
            {fieldHelp("category")}
          </p>
          {errorFor("category")}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-1.5">
          <Label id={`${fieldIds.priority}-label`} htmlFor={fieldIds.priority}>
            {t.forms.priority}
          </Label>
          <Select value={values.priority} onValueChange={(value) => update("priority", value ?? "MEDIUM")}>
            <SelectTrigger
              id={fieldIds.priority}
              aria-labelledby={`${fieldIds.priority}-label`}
              aria-describedby={`${fieldIds.priority}-help`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((value) => (
                <SelectItem key={value} value={value}>
                  {(t.priorities as Record<string, string>)[value] ?? value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p id={`${fieldIds.priority}-help`} className="text-xs text-muted-foreground">
            {t.common.required}
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-1.5">
          <Label htmlFor={fieldIds.description}>{t.forms.description}</Label>
          <Textarea
            id={fieldIds.description}
            name="description"
            rows={6}
            value={values.description}
            onChange={(event) => update("description", event.target.value)}
            required
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describedBy("description")}
          />
          <p id={`${fieldIds.description}-help`} className="text-xs text-muted-foreground">
            {fieldHelp("description")}
          </p>
          {errorFor("description")}
        </div>
      )}

      {step === 4 && (
        <dl className="grid gap-3 rounded-xl border border-[#E4E7EC] p-4 text-sm dark:border-white/10">
          {([
            ["subject", t.forms.subject, values.subject],
            ["category", t.forms.category, values.category || "—"],
            ["priority", t.forms.priority, (t.priorities as Record<string, string>)[values.priority] ?? values.priority],
            ["description", t.forms.description, values.description],
          ] as const).map(([field, label, value]) => (
            <div key={field}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={goBack} disabled={pending}>
            {t.common.back}
          </Button>
        )}
        {step < 4 ? (
          <Button type="submit">{t.common.next}</Button>
        ) : (
          <Button type="submit" disabled={pending}>
            {pending ? t.forms.submitting : t.common.submit}
          </Button>
        )}
      </div>
    </form>
  );
}
