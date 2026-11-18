import { useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { useTenancy } from '../lib/tenancy';
import { Icon } from './Icon';

interface ChatMsg { id: string; question: string; answer: string; createdAt: string; }

export function ChatbotPanel() {
  const { hasPermission } = useTenancy();
  const canUse = hasPermission('chatbot.read');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await apiRequest<{ question: string; answer: string }>('/api/v1/chatbot/ask', {
        method: 'POST',
        body: { question },
      });
      setMessages((prev) => [ { id: String(Date.now()), question: res.question, answer: res.answer, createdAt: new Date().toISOString() }, ...prev ]);
      setInput('');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر الاتصال بالمساعد.');
    } finally {
      setPending(false);
    }
  }

  if (!canUse) {
    return (
      <section className="card" aria-labelledby="chatbot-title">
        <div className="card-head"><h3 id="chatbot-title">المساعد الذكي</h3></div>
        <p className="card-note">لا تملك صلاحية استخدام المساعد (chatbot.read).</p>
      </section>
    );
  }

  return (
    <section className="card" aria-labelledby="chatbot-title">
      <div className="card-head">
        <h3 id="chatbot-title">المساعد الذكي</h3>
        <span className="tag tag-muted">{messages.length} رسالة</span>
      </div>
      <form onSubmit={handleAsk} className="inventory-form">
        <div className="inventory-form-row">
          <label className="field" style={{ flex: 1 }}>
            <span className="field-label">سؤالك</span>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="كيف أرسل تذكرة دعم؟" />
          </label>
          <button type="submit" className="button button-primary" disabled={pending}>{pending ? 'جارٍ…' : 'إرسال'}</button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
      <ul className="product-list">
        {messages.map((m) => (
          <li key={m.id} className="product-item">
            <div className="product-head">
              <div className="product-identity">
                <strong>أنت:</strong> {m.question}
              </div>
            </div>
            <div className="product-meta">
              <span>المساعد: {m.answer}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
