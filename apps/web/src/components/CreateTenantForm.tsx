import { useState, type FormEvent } from 'react';
import { ApiError } from '../lib/api';
import { useTenancy, type TenantMembership } from '../lib/tenancy';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface CreateTenantFormProps {
  /** Compact renders a tighter form for the sidebar panel. */
  compact?: boolean;
  onCreated?: (tenant: TenantMembership) => void;
  onCancel?: () => void;
}

export function CreateTenantForm({ compact = false, onCreated, onCancel }: CreateTenantFormProps) {
  const { createTenant } = useTenancy();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setError('يرجى إدخال اسم المؤسسة (حرفان على الأقل).');
      return;
    }
    if (trimmedSlug && !SLUG_PATTERN.test(trimmedSlug)) {
      setError('المعرّف يقبل الأحرف اللاتينية الصغيرة والأرقام والشرطات فقط.');
      return;
    }

    setError(null);
    setPending(true);
    try {
      const created = await createTenant({ name: trimmedName, slug: trimmedSlug || undefined });
      setName('');
      setSlug('');
      onCreated?.(created);
    } catch (caught) {
      setError(describeCreateError(caught));
      setPending(false);
    }
  }

  return (
    <form
      className={`create-tenant${compact ? ' is-compact' : ''}`}
      onSubmit={handleSubmit}
      noValidate
    >
      <label className="field">
        <span className="field-label">اسم المؤسسة</span>
        <input
          type="text"
          name="name"
          placeholder="مثال: مؤسسة النور"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          required
        />
      </label>

      <label className="field">
        <span className="field-label">المعرّف (اختياري)</span>
        <input
          type="text"
          name="slug"
          placeholder="al-noor"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          maxLength={40}
          dir="ltr"
        />
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="create-tenant-actions">
        <button type="submit" className="button button-primary button-block" disabled={pending}>
          {pending ? 'جارٍ الإنشاء…' : 'إنشاء المؤسسة'}
        </button>
        {onCancel && (
          <button type="button" className="button" onClick={onCancel} disabled={pending}>
            إلغاء
          </button>
        )}
      </div>

      <p className="auth-hint">
        ستكون مالكًا لهذه المؤسسة بصلاحيات كاملة. المعرّف يُستخدم في الروابط ولن يتغير لاحقًا.
      </p>
    </form>
  );
}

function describeCreateError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 409:
        return 'هذا المعرّف مستخدم بالفعل. جرّب معرّفًا آخر.';
      case 400:
        return 'تحقق من صحة البيانات: الاسم حرفان على الأقل والمعرّف أحرف لاتينية صغيرة.';
      case 403:
        return 'الحساب غير متاح لإنشاء مؤسسة.';
      case 429:
        return 'محاولات كثيرة. يرجى الانتظار قليلًا ثم المحاولة مجددًا.';
      default:
        return error.message;
    }
  }
  if (error instanceof TypeError) {
    return 'تعذر الاتصال بالخدمة. تأكد من تشغيل الخادم.';
  }
  return 'حدث خطأ غير متوقع أثناء إنشاء المؤسسة.';
}
