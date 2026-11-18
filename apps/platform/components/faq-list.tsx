"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type FAQ = { id: string; question: string; answer: string; category: string | null };

export function FaqList({ faqs }: { faqs: FAQ[] }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const filtered = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(query.toLowerCase()) ||
      faq.answer.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <Input
        aria-label={t.public.faqSearchPlaceholder}
        placeholder={t.public.faqSearchPlaceholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mb-6"
      />
      <div className="space-y-4">
        {filtered.map((faq) => (
          <Card key={faq.id} className="border-[#E4E7EC] dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-base">{faq.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">{t.empty.search}</p>}
      </div>
    </div>
  );
}
