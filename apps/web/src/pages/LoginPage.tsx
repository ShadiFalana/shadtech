import { useState, type FormEvent } from 'react';
import { Brand } from '../components/Brand';
import { Icon } from '../components/Icon';
import { ThemeToggle } from '../components/ThemeToggle';
import { useHealth } from '../lib/health';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state: health, refresh } = useHealth();

  const statusLabel =
    health.kind === 'online' ? 'الخدمة متصلة' : health.kind === 'checking' ? 'جارٍ الفحص' : 'الخدمة متوقفة';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    setError(null);
    onLogin(normalizedEmail);
  }

  return (
    <div className="auth-page">
      <section className="auth-aside" aria-label="عن SHADTECH">
        <Brand />

        <div className="auth-aside-body">
          <span className="eyebrow">الخطوة 2 — قاعدة البيانات</span>
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
              <h2>تسجيل الدخول</h2>
              <p>أدخل بياناتك للوصول إلى مساحة العمل.</p>
            </div>
          </div>

          <div className="notice" role="note">
            <Icon name="spark" size={16} />
            <span>وضع معاينة تصميمي — المصادقة الحقيقية تُضاف في الخطوة 3.</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
                  autoComplete="current-password"
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

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <div className="auth-options">
              <label className="checkbox">
                <input type="checkbox" defaultChecked />
                <span>تذكرني</span>
              </label>
              <button
                type="button"
                className="link-button"
                onClick={() => setError('استعادة كلمة المرور ستُضاف مع وحدة المصادقة.')}
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            <button type="submit" className="button button-primary button-block">
              دخول إلى لوحة التحكم
              <Icon name="arrowLeft" size={18} />
            </button>
          </form>

          <p className="auth-foot">
            بالمتابعة أنت توافق على سياسات الاستخدام والخصوصية الخاصة بـ SHADTECH.
          </p>
        </div>

        <footer className="auth-copyright">
          © {new Date().getFullYear()} SHADTECH — فلسطين
        </footer>
      </section>
    </div>
  );
}
