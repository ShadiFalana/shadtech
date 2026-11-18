"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export function AIChat() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || pending) return;

    const nextMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!response.ok) {
        setError(t.errors.aiUnavailable);
        return;
      }
      const data = (await response.json()) as { reply?: string };
      if (typeof data.reply !== "string") {
        setError(t.errors.aiUnavailable);
        return;
      }
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setError(t.errors.aiUnavailable);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={t.support.aiAssistant}
        aria-busy={pending}
        className="h-80 space-y-3 overflow-y-auto rounded-lg border border-[#E4E7EC] p-3 dark:border-white/10"
      >
        {messages.length === 0 && <p className="text-sm text-muted-foreground">{t.common.noData}</p>}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
            className={`rounded-lg p-3 text-sm ${
              message.role === "user"
                ? "ms-8 bg-[#F7F8FA] dark:bg-white/10"
                : "me-8 bg-[#FFF3E6] dark:bg-[#F79432]/10"
            }`}
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {message.role === "user" ? t.support.reply : t.support.aiAssistant}
            </p>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
        {pending && (
          <p role="status" className="text-sm text-muted-foreground">
            {t.common.loading}
          </p>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <form onSubmit={onSubmit} aria-busy={pending} className="flex gap-2">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t.forms.message}
          aria-label={t.forms.message}
        />
        <Button type="submit" disabled={pending || !input.trim()}>
          {t.forms.send}
        </Button>
      </form>
    </div>
  );
}
