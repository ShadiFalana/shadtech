import { useState, type FormEvent } from 'react';
import { Brand } from '../components/Brand';
import { Icon } from '../components/Icon';
import { ThemeToggle } from '../components/ThemeToggle';
import { ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useHealth } from '../lib/health';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const { initialized, login, register } = useAuth();
  const bootstrap = initialized === false;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { state: health, refresh } = useHealth();

  const statusLabel =
    health.kind === 'online'
      ? 'الخدمة متصلة'
      : health.kind === 'checking'
        ? 'جارٍ الفحص'
        : 'الخدمة متوقفة';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }

    const normalizedEmail = email.trim();
    const trimmedName = fullName.trim();

    if (bootstrap && trimmedName.length < 2) {
      setError('يرجى إدخال الاسم الكامل (حرفان على الأقل).');
      return;
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }
    if (bootstrap && password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي حرفًا ورقمًا.');
      return;
    }
    if (!bootstrap && password.length === 0) {
      setError('يرجى إدخال كلمة المرور.');
      return;
    }
    if (bootstrap && password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setError(null);
    setPending(true);
    try {
      if (bootstrap) {
        await register({ fullName: trimmedName, email: normalizedEmail, password });
      } else {
        await login(normalizedEmail, password);
      }
    } catch (caught) {
      setError(describeAuthError(caught, bootstrap));
      setPending(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-aside" aria-label="عن SHADTECH">
        <Brand />

        <div className="auth-aside-body">
          <span className="eyebrow">الخطوة 3 — المصادقة</span>
          <h1>
            نواة واحدة
            <br />
            لكل عملياتك التقنية
          </h1>
          <p>
            دعم فني، عملاء، تذاكر، مبيعات، فوترة، ومخزون — في منصة عربية مصممة للشركات الصغيرة
            والمتوسطة.
          </p>

          <ul className="auth-features">
            <li>
              <Icon name="shield" />
              عزل صارم لبيانات كل مؤسسة
            </li>
            <li>
              <Icon name="spark" />
              بنية modular قابلة للتوسع
            </li>
            <li>
              <Icon name="chart" />
              تقارير ولوحات قرار
            </li>
          </ul>
        </div>

        <div className="auth-aside-footer">
          <div className={`status-pill status-${health.kind}`} role="status" aria-live="polite">
            <span className="status-dot" aria-hidden="true" />
            {statusLabel}
          </div>
          <button type="button" className="link-button" onClick={refresh}>
            إعادة الفحص
          </button>
        </div>
      </section>

      <section className="auth-main">
        <div className="auth-theme">
          <ThemeToggle />
        </div>
        <div className="auth-card">
          <div className="auth-card-head">
            <span className="auth-icon" aria-hidden="true">
              <Icon name="shield" size={22} />
            </span>
            <div>
              <h2>{bootstrap ? 'تهيئة حساب المسؤول' : 'تسجيل الدخول'}</h2>
              <p>
                {bootstrap
                  ? 'أول تشغيل للمنصة: أنشئ حساب المسؤول الأول.'
                  : 'أدخل بياناتك للوصول إلى مساحة العمل.'}
              </p>
            </div>
          </div>

          <div className="notice" role="note">
            <Icon name="spark" size={16} />
            <span>
              {bootstrap
                ? 'هذا النموذج متاح مرة واحدة فقط. بعد إنشاء الحساب يُغلق التسجيل العام.'
                : 'جلسة آمنة: رمز وصول قصير الأجل ورمز تحديث مُخزَّن في كوكي محمي.'}
            </span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {bootstrap && (
              <label className="field">
                <span className="field-label">الاسم الكامل</span>
                <input
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  placeholder="مثال: مدير النظام"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  maxLength={120}
                  required
                />
              </label>
            )}

            <label className="field">
              <span className="field-label">البريد الإلكتروني</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="name@company.ps"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                dir="ltr"
                required
              />
            </label>

            <label className="field">
              <span className="field-label">كلمة المرور</span>
              <span className="field-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete={bootstrap ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </span>
            </label>

            {bootstrap && (
              <label className="field">
                <span className="field-label">تأكيد كلمة المرور</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </label>
            )}

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <div className="auth-options">
              {bootstrap ? (
                <span className="auth-hint">8 أحرف على الأقل، مع حرف واحد ورقم واحد.</span>
              ) : (
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setError('استعادة كلمة المرور ستُضاف في خطوة لاحقة.')}
                >
                  نسيت كلمة المرور؟
                </button>
              )}
            </div>

            <button type="submit" className="button button-primary button-block" disabled={pending}>
              {pending
                ? bootstrap
                  ? 'جارٍ إنشاء الحساب…'
                  : 'جارٍ التحقق…'
                : bootstrap
                  ? 'إنشاء حساب المسؤول'
                  : 'دخول إلى لوحة التحكم'}
              {!pending && <Icon name="arrowLeft" size={18} />}
            </button>
          </form>

          <p className="auth-foot">
            بالمتابعة أنت توافق على سياسات الاستخدام والخصوصية الخاصة بـ SHADTECH.
          </p>
        </div>

        <footer className="auth-copyright">© {new Date().getFullYear()} SHADTECH — فلسطين</footer>
      </section>
    </div>
  );
}

function describeAuthError(error: unknown, bootstrap: boolean): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return bootstrap
          ? 'انتهت صلاحية الطلب. أعد المحاولة.'
          : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      case 403:
        return 'التسجيل مغلق: يوجد حساب مسؤول بالفعل.';
      case 409:
        return 'هذا البريد الإلكتروني مسجّل مسبقًا.';
      case 429:
        return 'محاولات كثيرة جدًا. يرجى الانتظار دقيقة ثم المحاولة مجددًا.';
      case 400:
        return bootstrap
          ? 'تحقق من صحة البيانات: كلمة المرور 8 أحرف على الأقل وتحتوي حرفًا ورقمًا.'
          : 'تحقق من صيغة البريد الإلكتروني وكلمة المرور.';
      default:
        return 'تعذر إكمال الطلب. يرجى المحاولة مرة أخرى.';
    }
  }

  if (error instanceof TypeError) {
    return 'تعذر الاتصال بالخدمة. تأكد من تشغيل الخادم ثم أعد المحاولة.';
  }

  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}
