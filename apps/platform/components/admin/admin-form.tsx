import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { translateKey } from "@/lib/dictionaries";
import { getServerDictionary } from "@/lib/server-i18n";

export type AdminFormField = {
  name: string;
  labelKey: string;
  type?: "text" | "number";
  required?: boolean;
  textarea?: boolean;
  checkbox?: boolean;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: string;
  options?: Array<{ value: string; labelKey?: string; label?: string }>;
};

type ServerAction = (formData: FormData) => Promise<unknown>;

/**
 * Small localized form used by the admin resource pages.
 * All visible labels come from the server dictionary; data values may be passed
 * through `options[].label` (for example a customer or agent name from Prisma).
 */
export async function AdminForm({
  action,
  fields,
  submitKey = "forms.create",
  hiddenFields,
}: {
  action: ServerAction;
  fields: AdminFormField[];
  submitKey?: string;
  hiddenFields?: Array<{ name: string; value: string }>;
}) {
  const t = await getServerDictionary();

  return (
    <form action={action as unknown as (formData: FormData) => void} className="max-w-xl space-y-3">
      {hiddenFields?.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      {fields.map((field) => {
        const label = translateKey(t, field.labelKey) ?? field.labelKey;
        if (field.checkbox) {
          return (
            <label key={field.name} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={field.name} defaultChecked={field.defaultValue === "true"} />
              <span>{label}</span>
            </label>
          );
        }
        return (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={field.name}>{label}</Label>
            {field.textarea ? (
              <Textarea id={field.name} name={field.name} required={field.required} defaultValue={field.defaultValue} />
            ) : field.options ? (
              <select
                id={field.name}
                name={field.name}
                required={field.required}
                defaultValue={field.defaultValue}
                className="flex h-9 w-full cursor-pointer rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label ?? (option.labelKey ? translateKey(t, option.labelKey) ?? option.labelKey : option.value)}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={field.name}
                name={field.name}
                type={field.type ?? "text"}
                required={field.required}
                min={field.min}
                max={field.max}
                step={field.step}
                defaultValue={field.defaultValue}
              />
            )}
          </div>
        );
      })}
      <Button type="submit">{translateKey(t, submitKey) ?? submitKey}</Button>
    </form>
  );
}

export async function AdminDeleteForm({ action, id }: { action: ServerAction; id: string }) {
  const t = await getServerDictionary();
  return (
    <form action={action as unknown as (formData: FormData) => void}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" size="sm">
        {t.common.delete}
      </Button>
    </form>
  );
}

export async function AdminActionForm({
  action,
  id,
  labelKey,
  variant = "outline",
}: {
  action: ServerAction;
  id: string;
  labelKey: string;
  variant?: "outline" | "default" | "secondary";
}) {
  const t = await getServerDictionary();
  return (
    <form action={action as unknown as (formData: FormData) => void}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant={variant} size="sm">
        {translateKey(t, labelKey) ?? labelKey}
      </Button>
    </form>
  );
}
