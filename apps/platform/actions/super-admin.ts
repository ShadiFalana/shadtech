"use server";

import { BillingPeriod, SubscriptionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/session";

/**
 * Platform-level mutations. Every action requires the super-admin console
 * permission plus the capability permission for the affected resource, so an
 * ADMIN (who holds settings.manage but not superAdmin.access) cannot call a
 * platform action directly by POST.
 */

function failure(errorKey: string) {
  return { ok: false as const, errorKey };
}

function success(errorKey = "common.success") {
  return { ok: true as const, errorKey };
}

async function requirePlatformAdmin(capability: "tenants.manage" | "settings.manage") {
  const session = await requirePermission("superAdmin.access", "admin");
  await requirePermission(capability, "admin");
  return session;
}

function revalidatePlatform(paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

const booleanField = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

// ---------------------------------------------------------------------------
// Tenants (Organization)
// ---------------------------------------------------------------------------

const tenantCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  domain: optionalText(200),
});

const tenantUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  domain: optionalText(200),
  isActive: booleanField,
});

const tenantActiveSchema = z.object({
  id: z.string().min(1),
  isActive: booleanField,
});

export async function createTenant(formData: FormData) {
  const session = await requirePlatformAdmin("tenants.manage");
  const parsed = tenantCreateSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    domain: formData.get("domain"),
  });
  if (!parsed.success) return failure("forms.validationError");

  const existing = await prisma.organization.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (existing) return failure("errors.validation");

  const created = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        domain: parsed.data.domain,
        isActive: true,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "tenant.create",
        entity: "organization",
        entityId: organization.id,
        details: `${organization.name} (${organization.slug})`,
      },
    });
    return organization;
  });
  if (!created?.id) return failure("common.error");

  revalidatePlatform(["/super-admin", "/super-admin/tenants"]);
  return success();
}

export async function updateTenant(formData: FormData) {
  const session = await requirePlatformAdmin("tenants.manage");
  const parsed = tenantUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    domain: formData.get("domain"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) return failure("forms.validationError");

  const target = await prisma.organization.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, slug: true },
  });
  if (!target) return failure("errors.notFound");
  if (target.slug !== parsed.data.slug) {
    const collision = await prisma.organization.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true },
    });
    if (collision) return failure("errors.validation");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.update({
      where: { id: target.id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        domain: parsed.data.domain,
        isActive: parsed.data.isActive,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "tenant.update",
        entity: "organization",
        entityId: organization.id,
        details: `${organization.name} (${organization.slug}); isActive=${organization.isActive}`,
      },
    });
    return organization;
  });
  if (!updated?.id) return failure("common.error");

  revalidatePlatform(["/super-admin", "/super-admin/tenants"]);
  return success();
}

export async function setTenantActive(formData: FormData) {
  const session = await requirePlatformAdmin("tenants.manage");
  const parsed = tenantActiveSchema.safeParse({
    id: formData.get("id"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) return failure("forms.validationError");

  const updated = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.update({
      where: { id: parsed.data.id },
      data: { isActive: parsed.data.isActive },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: parsed.data.isActive ? "tenant.activate" : "tenant.suspend",
        entity: "organization",
        entityId: organization.id,
        details: `isActive=${organization.isActive}`,
      },
    });
    return organization;
  });
  if (!updated?.id || updated.isActive !== parsed.data.isActive) return failure("common.error");

  revalidatePlatform(["/super-admin", "/super-admin/tenants"]);
  return success();
}

// ---------------------------------------------------------------------------
// Plans (SubscriptionPlan)
// ---------------------------------------------------------------------------

const featuresField = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

const planCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  description: z.string().trim().max(500).optional(),
  priceMonthly: z.coerce.number().min(0).max(1000000),
  priceYearly: z.coerce.number().min(0).max(10000000),
  maxTickets: z.coerce.number().int().min(0).max(1000000).optional(),
  maxUsers: z.coerce.number().int().min(0).max(1000000).optional(),
  features: featuresField,
});

const planUpdateSchema = planCreateSchema.extend({
  id: z.string().min(1),
  isActive: booleanField,
});

const planActiveSchema = z.object({
  id: z.string().min(1),
  isActive: booleanField,
});

export async function createPlan(formData: FormData) {
  const session = await requirePlatformAdmin("settings.manage");
  const parsed = planCreateSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    priceMonthly: formData.get("priceMonthly"),
    priceYearly: formData.get("priceYearly"),
    maxTickets: formData.get("maxTickets") || undefined,
    maxUsers: formData.get("maxUsers") || undefined,
    features: formData.get("features"),
  });
  if (!parsed.success) return failure("forms.validationError");

  const existing = await prisma.subscriptionPlan.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (existing) return failure("errors.validation");

  const created = await prisma.$transaction(async (tx) => {
    const plan = await tx.subscriptionPlan.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        priceMonthly: parsed.data.priceMonthly,
        priceYearly: parsed.data.priceYearly,
        maxTickets: parsed.data.maxTickets ?? null,
        maxUsers: parsed.data.maxUsers ?? null,
        features: parsed.data.features,
        isActive: true,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "plan.create",
        entity: "subscriptionPlan",
        entityId: plan.id,
        details: `${plan.name} (${plan.slug})`,
      },
    });
    return plan;
  });
  if (!created?.id) return failure("common.error");

  revalidatePlatform(["/super-admin", "/super-admin/plans", "/admin/plans", "/pricing"]);
  return success();
}

export async function updatePlan(formData: FormData) {
  const session = await requirePlatformAdmin("settings.manage");
  const parsed = planUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    priceMonthly: formData.get("priceMonthly"),
    priceYearly: formData.get("priceYearly"),
    maxTickets: formData.get("maxTickets") || undefined,
    maxUsers: formData.get("maxUsers") || undefined,
    features: formData.get("features"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) return failure("forms.validationError");

  const target = await prisma.subscriptionPlan.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, slug: true },
  });
  if (!target) return failure("errors.notFound");
  if (target.slug !== parsed.data.slug) {
    const collision = await prisma.subscriptionPlan.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true },
    });
    if (collision) return failure("errors.validation");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const plan = await tx.subscriptionPlan.update({
      where: { id: target.id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        priceMonthly: parsed.data.priceMonthly,
        priceYearly: parsed.data.priceYearly,
        maxTickets: parsed.data.maxTickets ?? null,
        maxUsers: parsed.data.maxUsers ?? null,
        features: parsed.data.features,
        isActive: parsed.data.isActive,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "plan.update",
        entity: "subscriptionPlan",
        entityId: plan.id,
        details: `${plan.name} (${plan.slug}); isActive=${plan.isActive}`,
      },
    });
    return plan;
  });
  if (!updated?.id) return failure("common.error");

  revalidatePlatform(["/super-admin", "/super-admin/plans", "/admin/plans", "/pricing"]);
  return success();
}

export async function setPlanActive(formData: FormData) {
  const session = await requirePlatformAdmin("settings.manage");
  const parsed = planActiveSchema.safeParse({
    id: formData.get("id"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) return failure("forms.validationError");

  const updated = await prisma.$transaction(async (tx) => {
    const plan = await tx.subscriptionPlan.update({
      where: { id: parsed.data.id },
      data: { isActive: parsed.data.isActive },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: parsed.data.isActive ? "plan.activate" : "plan.suspend",
        entity: "subscriptionPlan",
        entityId: plan.id,
        details: `isActive=${plan.isActive}`,
      },
    });
    return plan;
  });
  if (!updated?.id || updated.isActive !== parsed.data.isActive) return failure("common.error");

  revalidatePlatform(["/super-admin", "/super-admin/plans", "/admin/plans", "/pricing"]);
  return success();
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

const subscriptionCreateSchema = z.object({
  customerId: z.string().min(1),
  planId: z.string().min(1),
  status: z.nativeEnum(SubscriptionStatus),
  period: z.nativeEnum(BillingPeriod),
});

const subscriptionUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(SubscriptionStatus),
  period: z.nativeEnum(BillingPeriod),
  endDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? new Date(value) : null))
    .refine((value) => !value || !Number.isNaN(value.getTime()), "Invalid date"),
});

const subscriptionIdSchema = z.object({ id: z.string().min(1) });

export async function createSubscription(formData: FormData) {
  const session = await requirePlatformAdmin("settings.manage");
  const parsed = subscriptionCreateSchema.safeParse({
    customerId: formData.get("customerId"),
    planId: formData.get("planId"),
    status: formData.get("status"),
    period: formData.get("period"),
  });
  if (!parsed.success) return failure("forms.validationError");

  const [customer, plan] = await Promise.all([
    prisma.customerProfile.findUnique({
      where: { id: parsed.data.customerId },
      select: { id: true },
    }),
    prisma.subscriptionPlan.findUnique({
      where: { id: parsed.data.planId },
      select: { id: true },
    }),
  ]);
  if (!customer || !plan) return failure("errors.notFound");

  const created = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({
      data: {
        customerId: customer.id,
        planId: plan.id,
        status: parsed.data.status,
        period: parsed.data.period,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "subscription.create",
        entity: "subscription",
        entityId: subscription.id,
        details: `${customer.id} -> ${plan.id}; ${subscription.status}/${subscription.period}`,
      },
    });
    return subscription;
  });
  if (!created?.id) return failure("common.error");

  revalidatePlatform(["/super-admin", "/super-admin/subscriptions", "/admin/subscriptions"]);
  return success();
}

export async function updateSubscription(formData: FormData) {
  const session = await requirePlatformAdmin("settings.manage");
  const parsed = subscriptionUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    period: formData.get("period"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) return failure("forms.validationError");

  const target = await prisma.subscription.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!target) return failure("errors.notFound");

  const updated = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.update({
      where: { id: target.id },
      data: {
        status: parsed.data.status,
        period: parsed.data.period,
        endDate: parsed.data.endDate,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "subscription.update",
        entity: "subscription",
        entityId: subscription.id,
        details: `${subscription.status}/${subscription.period}`,
      },
    });
    return subscription;
  });
  if (!updated?.id || updated.status !== parsed.data.status) return failure("common.error");

  revalidatePlatform(["/super-admin", "/super-admin/subscriptions", "/admin/subscriptions"]);
  return success();
}

export async function cancelSubscription(formData: FormData) {
  const session = await requirePlatformAdmin("settings.manage");
  const parsed = subscriptionIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return failure("forms.validationError");

  const target = await prisma.subscription.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, status: true },
  });
  if (!target) return failure("errors.notFound");
  if (target.status === SubscriptionStatus.CANCELLED) return failure("errors.validation");

  const cancelledAt = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.update({
      where: { id: target.id },
      data: { status: SubscriptionStatus.CANCELLED, endDate: cancelledAt },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "subscription.cancel",
        entity: "subscription",
        entityId: subscription.id,
        details: `${target.status} -> ${subscription.status}`,
      },
    });
    return subscription;
  });
  if (!updated?.id || updated.status !== SubscriptionStatus.CANCELLED) return failure("common.error");

  revalidatePlatform(["/super-admin", "/super-admin/subscriptions", "/admin/subscriptions"]);
  return success();
}

// ---------------------------------------------------------------------------
// Platform settings (SystemSetting)
// ---------------------------------------------------------------------------

const platformSettingKeys = [
  "company_name",
  "company_email",
  "company_phone",
  "openrouter_model",
] as const;

const platformSettingSchema = z
  .object({
    key: z.enum(platformSettingKeys),
    value: z.string().trim().max(2000),
  });

export async function savePlatformSetting(formData: FormData) {
  const session = await requirePlatformAdmin("settings.manage");
  const parsed = platformSettingSchema.safeParse({
    key: formData.get("key"),
    value: formData.get("value"),
  });
  if (!parsed.success) return failure("forms.validationError");

  const saved = await prisma.$transaction(async (tx) => {
    const setting = await tx.systemSetting.upsert({
      where: { key: parsed.data.key },
      update: { value: parsed.data.value },
      create: { key: parsed.data.key, value: parsed.data.value },
    });
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "platformSetting.save",
        entity: "systemSetting",
        entityId: setting.id,
        details: `${setting.key} updated`,
      },
    });
    return setting;
  });
  if (!saved?.id || saved.value !== parsed.data.value) return failure("common.error");

  revalidatePlatform(["/super-admin/settings", "/admin/settings"]);
  return success();
}
