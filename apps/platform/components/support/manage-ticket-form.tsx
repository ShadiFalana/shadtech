"use client";

import { updateTicket } from "@/actions/admin-tickets";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translateKey } from "@/lib/dictionaries";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";

const statuses = ["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"];
const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

type Agent = { id: string; name: string | null; email: string };

export function ManageTicketForm({
  ticketId,
  status,
  priority,
  assignedToId,
  agents,
}: {
  ticketId: string;
  status: string;
  priority: string;
  assignedToId: string | null;
  agents: Agent[];
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const id = useId();
  const [nextStatus, setNextStatus] = useState(status);
  const [nextPriority, setNextPriority] = useState(priority);
  const [nextAssignee, setNextAssignee] = useState(assignedToId ?? "none");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const statusLabels = t.statuses as Record<string, string>;
  const priorityLabels = t.priorities as Record<string, string>;
  const statusField = `${id}-status`;
  const priorityField = `${id}-priority`;
  const assigneeField = `${id}-assignee`;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("ticketId", ticketId);
    formData.set("status", nextStatus);
    formData.set("priority", nextPriority);
    if (nextAssignee && nextAssignee !== "none") formData.set("assignedToId", nextAssignee);

    setPending(true);
    setError("");
    setSaved(false);
    const result = await updateTicket(formData);
    setPending(false);
    if (result.ok) {
      setSaved(true);
      toast.success(t.common.success);
      router.refresh();
    } else {
      const friendly =
        "errorKey" in result && typeof result.errorKey === "string"
          ? translateKey(t, result.errorKey) ?? t.common.error
          : t.common.error;
      setError(friendly);
    }
  }

  return (
    <form onSubmit={onSubmit} aria-busy={pending} className="space-y-4">
      <div className="space-y-1.5">
        <Label id={`${statusField}-label`} htmlFor={statusField}>
          {t.support.changeStatus}
        </Label>
        <Select value={nextStatus} onValueChange={(value) => setNextStatus(value ?? status)}>
          <SelectTrigger
            id={statusField}
            className="w-full"
            aria-labelledby={`${statusField}-label`}
            aria-describedby={`${statusField}-help`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((value) => (
              <SelectItem key={value} value={value}>
                {statusLabels[value] ?? value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p id={`${statusField}-help`} className="text-xs text-muted-foreground">
          {t.common.required}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label id={`${priorityField}-label`} htmlFor={priorityField}>
          {t.support.changePriority}
        </Label>
        <Select value={nextPriority} onValueChange={(value) => setNextPriority(value ?? priority)}>
          <SelectTrigger
            id={priorityField}
            className="w-full"
            aria-labelledby={`${priorityField}-label`}
            aria-describedby={`${priorityField}-help`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorities.map((value) => (
              <SelectItem key={value} value={value}>
                {priorityLabels[value] ?? value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p id={`${priorityField}-help`} className="text-xs text-muted-foreground">
          {t.common.required}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label id={`${assigneeField}-label`} htmlFor={assigneeField}>
          {t.support.assignTo}
        </Label>
        <Select value={nextAssignee} onValueChange={(value) => setNextAssignee(value ?? "none")}>
          <SelectTrigger
            id={assigneeField}
            className="w-full"
            aria-labelledby={`${assigneeField}-label`}
            aria-describedby={`${assigneeField}-help`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" disabled>
              {t.support.assignTo}
            </SelectItem>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name ?? agent.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p id={`${assigneeField}-help`} className="text-xs text-muted-foreground">
          {t.common.optional}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
          {t.common.success}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? t.forms.submitting : t.common.save}
      </Button>
    </form>
  );
}
