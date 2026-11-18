"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { listSessions, revokeOtherSessions } from "@/lib/auth-client";
import { formatDate } from "@/lib/format";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type SessionRow = {
  id: string;
  createdAt: string | Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export function SessionControls() {
  const { t, locale } = useLanguage();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    listSessions()
      .then((result) => {
        if (!active) return;
        setSessions((result.data as SessionRow[] | null | undefined) ?? []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function revokeOthers() {
    setPending(true);
    const result = await revokeOtherSessions();
    setPending(false);
    if (result.error) {
      toast.error(t.common.error);
      return;
    }
    const refreshed = await listSessions();
    setSessions((refreshed.data as SessionRow[] | null | undefined) ?? []);
    toast.success(t.portal.sessionsRevoked);
  }

  return (
    <div className="space-y-4">
      <Button type="button" variant="outline" disabled={pending || loading} onClick={revokeOthers}>
        {pending ? t.common.loading : t.portal.revokeOtherSessions}
      </Button>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t.common.loading}</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.portal.noSessions}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {sessions.map((session) => (
            <li key={session.id} className="rounded-lg border border-[#E4E7EC] p-3 dark:border-white/10">
              <p className="font-medium">{formatDate(session.createdAt, locale)}</p>
              <p className="text-xs text-muted-foreground">
                {session.ipAddress ?? "—"} · {session.userAgent ?? "—"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
