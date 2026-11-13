import { Brand } from '../components/Brand';
import { CreateTenantForm } from '../components/CreateTenantForm';
import { Icon } from '../components/Icon';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../lib/auth';

/** Shown to an authenticated user who does not belong to any tenant yet. */
export function OnboardingPage() {
  const { user, logout } = useAuth();

  return (
    <div className="auth-page">
      <section className="auth-aside" aria-label="عن SHADTECH">
        <Brand />

        <div className="auth-aside-body">
          <span className="eyebrow">الخطوة 4 — الصلاحيات وتعدد المؤسسات</span>
          <h1>
            مؤسستك أولًا
            <br />
            ثم كل شيء آخر
          </h1>
          <p>
            أنشئ مؤسستك لتبدأ العمل. كل بياناتك معزولة تمامًا داخل مؤسستك، ويمكنك الانتماء إلى أكثر
            من مؤسسة والتنقل بينها لاحقًا.
          </p>

          <ul className="auth-features">
            <li>
              <Icon name="shield" />
              عزل صارم لبيانات كل مؤسسة
            </li>
            <li>
              <Icon name="building" />
              أدوار جاهزة: مالك، مدير، مشرف، وكيل، مشاهد
            </li>
            <li>
              <Icon name="spark" />
              أنت المالك الكامل لمؤسستك الجديدة
            </li>
          </ul>
        </div>

        <div className="auth-aside-footer">
          <span className="auth-hint">
            مسجّل الدخول باسم <strong dir="ltr">{user?.email}</strong>
          </span>
        </div>
      </section>

      <section className="auth-main">
        <div className="auth-theme">
          <ThemeToggle />
        </div>

        <div className="auth-card">
          <div className="auth-card-head">
            <span className="auth-icon" aria-hidden="true">
              <Icon name="building" size={22} />
            </span>
            <div>
              <h2>إنشاء مؤسسة</h2>
              <p>لم تنتمِ إلى أي مؤسسة بعد. أنشئ أول مؤسسة للبدء.</p>
            </div>
          </div>

          <div className="notice" role="note">
            <Icon name="spark" size={16} />
            <span>
              تُنشأ المؤسسة مع إعدادات افتراضية (اللغة والتوقيت)، ويمكنك إضافة أعضاء وأدوار من
              الخطوات القادمة.
            </span>
          </div>

          <CreateTenantForm />

          <button
            type="button"
            className="link-button onboarding-logout"
            onClick={() => void logout()}
          >
            تسجيل الخروج من هذا الحساب
          </button>
        </div>

        <footer className="auth-copyright">© {new Date().getFullYear()} SHADTECH — فلسطين</footer>
      </section>
    </div>
  );
}
