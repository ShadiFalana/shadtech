"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export function SupportChat() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);

  const suggestions = [
    t.chat.suggestion1,
    t.chat.suggestion2,
    t.chat.suggestion3,
  ];

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          response.status === 503
            ? t.chat.unavailable
            : response.status === 429
              ? t.forms.rateLimitError
              : response.status === 400
                ? t.forms.validationError
                : t.chat.replyError,
        );
        return;
      }
      setMessages([...next, { role: "assistant", content: data?.reply ?? t.chat.replyError }]);
    } catch {
      setError(t.chat.connectionError);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed bottom-4 z-50 ltr:right-4 rtl:left-4">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl dark:border-white/10 dark:bg-[#30343B]">
          <div className="flex items-center justify-between bg-[#24272D] px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">{t.chat.assistantName}</p>
              <p className="text-xs text-white/70">{t.chat.assistantSubtitle}</p>
            </div>
            <button type="button" onClick={() => setMessages([])} className="text-xs text-[#FFB15C]">
              {t.chat.clear}
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground">{t.chat.intro}</p>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="block w-full rounded-lg bg-muted px-3 py-2 text-start text-foreground hover:bg-[#FFF4E8] dark:hover:bg-white/10"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[90%] rounded-xl px-3 py-2 ${message.role === "user" ? "ms-auto bg-[#24272D] text-white" : "bg-muted text-foreground"}`}
              >
                {message.content}
              </div>
            ))}
            {pending && <p className="text-muted-foreground">{t.chat.thinking}</p>}
            {error && <p className="text-red-700 dark:text-red-300">{error}</p>}
          </div>
          <form
            className="flex gap-2 border-t p-3"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={4000}
              className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
              placeholder={t.chat.placeholder}
            />
            <Button type="submit" disabled={pending} className="bg-[#F79432] text-primary-foreground hover:bg-[#FFB15C]">
              {t.chat.send}
            </Button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F79432] text-primary-foreground shadow-lg"
        aria-label={t.chat.open}
      >
        {open ? <X /> : <MessageCircle />}
      </button>
    </div>
  );
}
