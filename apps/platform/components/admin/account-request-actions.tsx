"use client";

import { reviewAccountRequest } from "@/actions/account-requests";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { translateKey } from "@/lib/dictionaries";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Decision = "APPROVED" | "REJECTED";

export function AccountRequestActions({ requestId }: { requestId: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [pending, setPending] = useState<Decision | null>(null);

  async function review(decision: Decision) {
    setPending(decision);
    const formData = new FormData();
    formData.set("requestId", requestId);
    formData.set("decision", decision);
    const result = await reviewAccountRequest(formData);
    setPending(null);
    if (!result.ok) {
      toast.error(translateKey(t, result.errorKey) ?? t.common.error);
      return;
    }
    toast.success(translateKey(t, result.errorKey) ?? t.common.success);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" disabled={pending !== null} onClick={() => review("APPROVED")}>
        {pending === "APPROVED" ? t.common.loading : t.admin.approve}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending !== null}
        onClick={() => review("REJECTED")}
      >
        {pending === "REJECTED" ? t.common.loading : t.admin.reject}
      </Button>
    </div>
  );
}
