"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getServerDictionary } from "@/lib/server-i18n";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  companyName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  companySize: z.string().optional(),
  employees: z.coerce.number().optional(),
  computers: z.coerce.number().optional(),
  infrastructure: z.string().optional(),
  backup: z.string().optional(),
  cybersecurity: z.string().optional(),
  cloud: z.string().optional(),
  support: z.string().optional(),
  challenges: z.string().optional(),
});

function withScore(template: string, score: number): string {
  return template.replace("{score}", String(score));
}

export async function submitAssessment(formData: FormData) {
  const t = await getServerDictionary();
  const session = await getSession();
  const parsed = schema.safeParse({
    companyName: formData.get("companyName") || undefined,
    email: formData.get("email") || undefined,
    companySize: formData.get("companySize") || undefined,
    employees: formData.get("employees") || undefined,
    computers: formData.get("computers") || undefined,
    infrastructure: formData.get("infrastructure") || undefined,
    backup: formData.get("backup") || undefined,
    cybersecurity: formData.get("cybersecurity") || undefined,
    cloud: formData.get("cloud") || undefined,
    support: formData.get("support") || undefined,
    challenges: formData.get("challenges") || undefined,
  });
  if (!parsed.success) return { ok: false as const, errorKey: "forms.validationError" };

  let score = 0;
  if (parsed.data.backup?.toLowerCase().includes("yes")) score += 20;
  if (parsed.data.backup?.toLowerCase().includes("نعم")) score += 20;
  if (parsed.data.cybersecurity?.toLowerCase().includes("yes")) score += 20;
  if (parsed.data.cybersecurity?.toLowerCase().includes("نعم")) score += 20;
  if (parsed.data.cloud?.toLowerCase().includes("yes")) score += 20;
  if (parsed.data.cloud?.toLowerCase().includes("نعم")) score += 20;
  if (parsed.data.support?.toLowerCase().includes("yes")) score += 20;
  if (parsed.data.support?.toLowerCase().includes("نعم")) score += 20;
  if ((parsed.data.employees ?? 0) > 0) score += 20;

  const customerProfile = session
    ? await prisma.customerProfile.findUnique({ where: { userId: session.user.id } })
    : null;

  const assessment = await prisma.iTAssessment.create({
    data: {
      customerId: customerProfile?.id,
      email: parsed.data.email || undefined,
      companyName: parsed.data.companyName,
      companySize: parsed.data.companySize,
      employees: parsed.data.employees,
      computers: parsed.data.computers,
      score,
      summary: withScore(t.assessment.summary, score),
    },
  });

  const answers: Array<[string, string | undefined]> = [
    [t.assessment.questionCompanySize, parsed.data.companySize],
    [t.assessment.questionEmployees, parsed.data.employees === undefined ? undefined : String(parsed.data.employees)],
    [t.assessment.questionComputers, parsed.data.computers === undefined ? undefined : String(parsed.data.computers)],
    [t.assessment.questionInfrastructure, parsed.data.infrastructure],
    [t.assessment.questionBackup, parsed.data.backup],
    [t.assessment.questionCybersecurity, parsed.data.cybersecurity],
    [t.assessment.questionCloud, parsed.data.cloud],
    [t.assessment.questionSupport, parsed.data.support],
    [t.assessment.questionChallenges, parsed.data.challenges],
  ];
  for (const [question, answer] of answers) {
    if (answer) {
      await prisma.iTAssessmentAnswer.create({
        data: { assessmentId: assessment.id, question, answer },
      });
    }
  }

  revalidatePath("/assessment");
  return { ok: true as const, score };
}
