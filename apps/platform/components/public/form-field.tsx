"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TextField({
  label,
  name,
  type = "text",
  required = false,
  autoComplete,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  min?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        min={min}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  required = false,
  minLength,
  rows = 5,
}: {
  label: string;
  name: string;
  required?: boolean;
  minLength?: number;
  rows?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        name={name}
        required={required}
        minLength={minLength}
        rows={rows}
      />
    </div>
  );
}

export function Honeypot() {
  return (
    <input
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="hidden"
    />
  );
}
