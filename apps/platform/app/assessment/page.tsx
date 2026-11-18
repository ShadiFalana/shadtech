"use client";

import { submitAssessment } from "@/actions/assessment";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { translateKey } from "@/lib/dictionaries";
import { useState } from "react";
import { toast } from "sonner";

export default function AssessmentPage() {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const result = await submitAssessment(formData);
    setPending(false);

    if (result.ok) {
      setScore(result.score ?? null);
      toast.success(t.assessment.submitted);
      return;
    }
    toast.error(translateKey(t, result.errorKey) ?? t.errors.generic);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA] text-foreground dark:bg-[#20242A] dark:text-white">
      <Navbar />
      <main className="container mx-auto max-w-2xl flex-1 px-4 py-16">
        <h1 className="text-4xl font-bold">{t.assessment.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.assessment.subtitle}</p>

        {score !== null && (
          <Card className="mt-6 border-[#E4E7EC] dark:border-white/10">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-[#F79432]">
                {t.assessment.score.replace("{score}", String(score))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.assessment.scoreNote}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6 border-[#E4E7EC] dark:border-white/10">
          <CardHeader>
            <CardTitle>{t.assessment.formTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <Field id="companyName" label={t.assessment.companyName}>
                <Input id="companyName" name="companyName" />
              </Field>
              <Field id="email" label={t.forms.email}>
                <Input id="email" name="email" type="email" />
              </Field>
              <Field id="companySize" label={t.assessment.companySize}>
                <Input id="companySize" name="companySize" placeholder={t.assessment.sizePlaceholder} />
              </Field>
              <Field id="employees" label={t.assessment.employees}>
                <Input id="employees" name="employees" type="number" min="0" />
              </Field>
              <Field id="computers" label={t.assessment.computers}>
                <Input id="computers" name="computers" type="number" min="0" />
              </Field>
              <Field id="infrastructure" label={t.assessment.infrastructure}>
                <Input id="infrastructure" name="infrastructure" />
              </Field>
              <Field id="backup" label={t.assessment.backup}>
                <Input id="backup" name="backup" placeholder={t.assessment.yesNoPlaceholder} />
              </Field>
              <Field id="cybersecurity" label={t.assessment.cybersecurity}>
                <Input id="cybersecurity" name="cybersecurity" placeholder={t.assessment.yesNoPlaceholder} />
              </Field>
              <Field id="cloud" label={t.assessment.cloud}>
                <Input id="cloud" name="cloud" placeholder={t.assessment.yesNoPlaceholder} />
              </Field>
              <Field id="support" label={t.assessment.support}>
                <Input id="support" name="support" placeholder={t.assessment.yesNoPlaceholder} />
              </Field>
              <Field id="challenges" label={t.assessment.challenges}>
                <Textarea id="challenges" name="challenges" rows={4} />
              </Field>
              <Button type="submit" disabled={pending} className="w-full bg-[#F79432] text-primary-foreground hover:bg-[#FFB15C]">
                {pending ? t.forms.submitting : t.assessment.submit}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
