"use client";

import {
  cancelSubscription,
  createPlan,
  createSubscription,
  createTenant,
  savePlatformSetting,
  setPlanActive,
  setTenantActive,
  updatePlan,
  updateSubscription,
  updateTenant,
} from "@/actions/super-admin";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { translateKey } from "@/lib/dictionaries";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type ActionResult = { ok: boolean; errorKey: string };
type FormAction = (formData: FormData) => Promise<ActionResult>;

const subscriptionStatuses = [
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELLED",
  "EXPIRED",
] as const;
const billingPeriods = ["MONTHLY", "YEARLY"] as const;

function useFormAction(action: FormAction) {
  const { t } = useLanguage();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function submit(form: HTMLFormElement, reset = false) {
    setPending(true);
    try {
      const result = await action(new FormData(form));
      if (!result.ok) {
        toast.error(translateKey(t, result.errorKey) ?? t.common.error);
        return;
      }
      toast.success(translateKey(t, result.errorKey) ?? t.common.success);
      if (reset) form.reset();
      router.refresh();
    } catch {
      toast.error(t.common.error);
    } finally {
      setPending(false);
    }
  }

  return { pending, submit };
}

function StatusOptions() {
  const { t } = useLanguage();
  const statuses = t.statuses as Record<string, string>;
  return (
    <>
      {subscriptionStatuses.map((status) => (
        <option key={status} value={status}>
          {statuses[status] ?? status}
        </option>
      ))}
    </>
  );
}

function PeriodOptions() {
  return (
    <>
      {billingPeriods.map((period) => (
        <option key={period} value={period}>
          {period}
        </option>
      ))}
    </>
  );
}

const selectClass =
  "flex h-9 w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function CreateTenantForm() {
  const { t } = useLanguage();
  const { pending, submit } = useFormAction(createTenant);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit(event.currentTarget, true);
      }}
      className="grid gap-4 md:grid-cols-2"
    >
      <div className="space-y-1.5">
        <Label htmlFor="tenant-name">{t.forms.name}</Label>
        <Input id="tenant-name" name="name" required minLength={2} maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tenant-slug">{t.forms.code}</Label>
        <Input
          id="tenant-slug"
          name="slug"
          required
          minLength={2}
          maxLength={80}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          dir="ltr"
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="tenant-domain">{t.forms.fileUrl}</Label>
        <Input id="tenant-domain" name="domain" maxLength={200} dir="ltr" />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending}>
          {pending ? t.forms.submitting : t.superAdmin.createTenant}
        </Button>
      </div>
    </form>
  );
}

export function TenantActions({
  id,
  name,
  slug,
  domain,
  isActive,
}: {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  isActive: boolean;
}) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const toggle = useFormAction(setTenantActive);
  const edit = useFormAction(updateTenant);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void toggle.submit(event.currentTarget);
          }}
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
          <Button type="submit" size="sm" variant="outline" disabled={toggle.pending}>
            {isActive ? t.superAdmin.suspend : t.superAdmin.activate}
          </Button>
        </form>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing((value) => !value)}>
          {t.common.edit}
        </Button>
      </div>
      {editing && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void edit.submit(event.currentTarget);
          }}
          className="grid gap-2 md:grid-cols-2"
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />
          <Input name="name" defaultValue={name} required minLength={2} maxLength={120} aria-label={t.forms.name} />
          <Input
            name="slug"
            defaultValue={slug}
            required
            minLength={2}
            maxLength={80}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            dir="ltr"
            aria-label={t.forms.code}
          />
          <Input
            name="domain"
            defaultValue={domain ?? ""}
            maxLength={200}
            dir="ltr"
            aria-label={t.forms.fileUrl}
          />
          <Button type="submit" size="sm" disabled={edit.pending}>
            {t.common.save}
          </Button>
        </form>
      )}
    </div>
  );
}

export function CreatePlanForm() {
  const { t } = useLanguage();
  const { pending, submit } = useFormAction(createPlan);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit(event.currentTarget, true);
      }}
      className="grid gap-4 md:grid-cols-2"
    >
      <div className="space-y-1.5">
        <Label htmlFor="plan-name">{t.forms.name}</Label>
        <Input id="plan-name" name="name" required minLength={2} maxLength={120} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="plan-slug">{t.forms.code}</Label>
        <Input
          id="plan-slug"
          name="slug"
          required
          minLength={2}
          maxLength={80}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          dir="ltr"
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="plan-description">{t.forms.description}</Label>
        <Textarea id="plan-description" name="description" maxLength={500} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="plan-monthly">{t.forms.value}</Label>
        <Input id="plan-monthly" name="priceMonthly" type="number" min={0} step={0.01} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="plan-yearly">{t.common.amount}</Label>
        <Input id="plan-yearly" name="priceYearly" type="number" min={0} step={0.01} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="plan-max-tickets">{t.admin.tickets}</Label>
        <Input id="plan-max-tickets" name="maxTickets" type="number" min={0} step={1} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="plan-max-users">{t.admin.users}</Label>
        <Input id="plan-max-users" name="maxUsers" type="number" min={0} step={1} />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="plan-features">{t.public.features}</Label>
        <Input id="plan-features" name="features" />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending}>
          {pending ? t.forms.submitting : t.actions.createRecord}
        </Button>
      </div>
    </form>
  );
}

export function PlanActions({
  id,
  name,
  slug,
  description,
  priceMonthly,
  priceYearly,
  maxTickets,
  maxUsers,
  features,
  isActive,
}: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  maxTickets: number | null;
  maxUsers: number | null;
  features: string[];
  isActive: boolean;
}) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const toggle = useFormAction(setPlanActive);
  const edit = useFormAction(updatePlan);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void toggle.submit(event.currentTarget);
          }}
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
          <Button type="submit" size="sm" variant="outline" disabled={toggle.pending}>
            {isActive ? t.superAdmin.suspend : t.superAdmin.activate}
          </Button>
        </form>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing((value) => !value)}>
          {t.common.edit}
        </Button>
      </div>
      {editing && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void edit.submit(event.currentTarget);
          }}
          className="grid gap-2 md:grid-cols-2"
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="isActive" value={isActive ? "true" : "false"} />
          <Input name="name" defaultValue={name} required minLength={2} maxLength={120} aria-label={t.forms.name} />
          <Input
            name="slug"
            defaultValue={slug}
            required
            minLength={2}
            maxLength={80}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            dir="ltr"
            aria-label={t.forms.code}
          />
          <Input
            name="description"
            defaultValue={description ?? ""}
            maxLength={500}
            className="md:col-span-2"
            aria-label={t.forms.description}
          />
          <Input
            name="priceMonthly"
            type="number"
            min={0}
            step={0.01}
            defaultValue={priceMonthly}
            required
            aria-label={t.forms.value}
          />
          <Input
            name="priceYearly"
            type="number"
            min={0}
            step={0.01}
            defaultValue={priceYearly}
            required
            aria-label={t.common.amount}
          />
          <Input
            name="maxTickets"
            type="number"
            min={0}
            step={1}
            defaultValue={maxTickets ?? ""}
            aria-label={t.admin.tickets}
          />
          <Input
            name="maxUsers"
            type="number"
            min={0}
            step={1}
            defaultValue={maxUsers ?? ""}
            aria-label={t.admin.users}
          />
          <Input
            name="features"
            defaultValue={features.join(", ")}
            className="md:col-span-2"
            aria-label={t.public.features}
          />
          <Button type="submit" size="sm" disabled={edit.pending}>
            {t.common.save}
          </Button>
        </form>
      )}
    </div>
  );
}

export function CreateSubscriptionForm({
  customers,
  plans,
}: {
  customers: Array<{ id: string; label: string }>;
  plans: Array<{ id: string; label: string }>;
}) {
  const { t } = useLanguage();
  const { pending, submit } = useFormAction(createSubscription);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit(event.currentTarget, true);
      }}
      className="grid gap-4 md:grid-cols-2"
    >
      <div className="space-y-1.5">
        <Label htmlFor="subscription-customer">{t.forms.customer}</Label>
        <select id="subscription-customer" name="customerId" required className={selectClass} defaultValue="">
          <option value="" disabled>
            {t.common.customer}
          </option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subscription-plan">{t.superAdmin.plans}</Label>
        <select id="subscription-plan" name="planId" required className={selectClass} defaultValue="">
          <option value="" disabled>
            {t.superAdmin.plans}
          </option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subscription-status">{t.forms.status}</Label>
        <select id="subscription-status" name="status" className={selectClass} defaultValue="ACTIVE">
          <StatusOptions />
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subscription-period">{t.sections.billing}</Label>
        <select id="subscription-period" name="period" className={selectClass} defaultValue="MONTHLY">
          <PeriodOptions />
        </select>
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending || customers.length === 0 || plans.length === 0}>
          {pending ? t.forms.submitting : t.actions.createRecord}
        </Button>
      </div>
    </form>
  );
}

export function SubscriptionActions({
  id,
  status,
  period,
  endDate,
}: {
  id: string;
  status: string;
  period: string;
  endDate: Date | null;
}) {
  const { t } = useLanguage();
  const update = useFormAction(updateSubscription);
  const cancel = useFormAction(cancelSubscription);

  return (
    <div className="flex flex-wrap gap-2">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void update.submit(event.currentTarget);
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="id" value={id} />
        <select name="status" className={selectClass} defaultValue={status} aria-label={t.forms.status}>
          <StatusOptions />
        </select>
        <select name="period" className={selectClass} defaultValue={period} aria-label={t.sections.billing}>
          <PeriodOptions />
        </select>
        <Input
          name="endDate"
          type="date"
          defaultValue={endDate ? endDate.toISOString().slice(0, 10) : ""}
          aria-label={t.forms.endDate}
          className="w-auto"
        />
        <Button type="submit" size="sm" disabled={update.pending}>
          {t.common.save}
        </Button>
      </form>
      {status !== "CANCELLED" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void cancel.submit(event.currentTarget);
          }}
        >
          <input type="hidden" name="id" value={id} />
          <Button type="submit" size="sm" variant="outline" disabled={cancel.pending}>
            {t.statuses.CANCELLED}
          </Button>
        </form>
      )}
    </div>
  );
}

export function PlatformSettingForm({ settingKey, value }: { settingKey?: string; value?: string }) {
  const { t } = useLanguage();
  const { pending, submit } = useFormAction(savePlatformSetting);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit(event.currentTarget, !settingKey);
      }}
      className="grid gap-4 md:grid-cols-2"
    >
      <div className="space-y-1.5">
        <Label htmlFor="setting-key">{t.forms.code}</Label>
        <select
          id="setting-key"
          name="key"
          className={selectClass}
          defaultValue={settingKey ?? "company_name"}
          disabled={Boolean(settingKey)}
        >
          <option value="company_name">{t.forms.company}</option>
          <option value="company_email">{t.forms.email}</option>
          <option value="company_phone">{t.forms.phone}</option>
          <option value="openrouter_model">{t.integrations.openRouter}</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="setting-value">{t.forms.value}</Label>
        <Input id="setting-value" name="value" required maxLength={2000} defaultValue={value ?? ""} />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending}>
          {pending ? t.forms.submitting : t.common.save}
        </Button>
      </div>
    </form>
  );
}
