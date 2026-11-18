"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

export function AiChat() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || pending) return;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, conversationId }),
      });
      const data = await response.json();
      if (!response.ok) {
        const message = t.errors.aiUnavailable;
        setError(message);
        toast.error(message);
        return;
      }
      setMessages([...next, { role: "assistant", content: data.reply as string }]);
      if (data.conversationId) setConversationId(data.conversationId as string);
    } catch {
      const message = t.errors.aiUnavailable;
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-3">
      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={t.portal.messages}
        aria-busy={pending}
        className="h-96 space-y-3 overflow-y-auto rounded-md border p-3"
      >
        {messages.length === 0 && <p className="text-sm text-muted-foreground">{t.common.noData}</p>}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
            className={`rounded-md p-2 text-sm ${
              message.role === "user" ? "ms-8 bg-primary/10" : "me-8 bg-muted"
            }`}
          >
            <p className="mb-1 text-xs font-semibold">
              {message.role === "user" ? t.common.customer : t.brand.name}
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
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <form onSubmit={send} aria-busy={pending} className="flex gap-2">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t.forms.message}
          aria-label={t.forms.message}
        />
        <Button type="submit" disabled={pending}>
          {pending ? t.common.loading : t.forms.send}
        </Button>
      </form>
    </div>
  );
}
