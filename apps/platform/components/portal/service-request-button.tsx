"use client";

import { requestService } from "@/actions/services";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { translateKey } from "@/lib/dictionaries";
import { useState } from "react";
import { toast } from "sonner";

export function ServiceRequestButton({ serviceId }: { serviceId: string }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState(false);

  async function request() {
    setPending(true);
    const formData = new FormData();
    formData.set("serviceId", serviceId);
    const result = await requestService(formData);
    setPending(false);
    if (result.ok) toast.success(t.common.success);
    else toast.error(translateKey(t, result.errorKey) ?? t.common.error);
  }

  return (
    <Button type="button" size="sm" disabled={pending} onClick={request}>
      {pending ? t.common.loading : t.actions.newRequest}
    </Button>
  );
}
