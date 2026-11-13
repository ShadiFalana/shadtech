import { useState } from 'react';
import { AuditPanel } from '../components/AuditPanel';
import { Brand } from '../components/Brand';
import { CompaniesPanel } from '../components/CompaniesPanel';
import { CustomersPanel } from '../components/CustomersPanel';
import { Icon, type IconName } from '../components/Icon';
import { MembersPanel } from '../components/MembersPanel';
import { TenantPanel } from '../components/TenantPanel';
import { TenantSwitcher } from '../components/TenantSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import type { AuthUser } from '../lib/auth';
import { useHealth } from '../lib/health';
import { useTenancy } from '../lib/tenancy';

interface DashboardPageProps {
  user: AuthUser;
  onLogout: () => Promise<void> | void;
}

interface NavItem {
  label: string;
  icon: IconName;
  active?: boolean;
  soon?: boolean;
}

const navItems: NavItem[] = [
  { label: 'لوحة التحكم', icon: 'dashboard', active: true },
  { label: 'التذاكر والدعم', icon: 'ticket' },
  { label: 'العملاء', icon: 'users', soon: false },
  { label: 'إدارة المستخدمين', icon: 'users', soon: false },
  { label: 'المبيعات والفوترة', icon: 'invoice' },
  { label: 'المخزون', icon: 'box' },
  { label: 'الشركات والفروع', icon: 'building', soon: false },
  { label: 'التقارير', icon: 'chart' },
  { label: 'الإعدادات', icon: 'settings' },
];

const stats = [
  { label: 'التذاكر المفتوحة', hint: 'بانتظار وحدة الدعم', icon: 'ticket' as IconName },
  { label: 'العملاء النشطون', hint: 'بانتظار وحدة العملاء', icon: 'users' as IconName },
  { label: 'فواتير غير مسددة', hint: 'بانتظار وحدة الفوترة', icon: 'invoice' as IconName },
  { label: 'أصناف منخفضة', hint: 'بانتظار وحدة المخزون', icon: 'box' as IconName },
];

const nextSteps = [
  { title: 'واجهة الاستخدام', note: 'شاشات الوحدات المنجزة', state: 'التالية' },
  { title: 'الاختبارات والتوثيق', note: 'اختبارات وتكامل مستمر', state: 'مقفلة' },
  { title: 'الذكاء الاصطناعي', note: 'مساعدو الذكاء الاصطناعي', state: 'مقفلة' },
];

const moduleChips = [
  'الدعم الفني',
  'إدارة العلاقات',
  'التذاكر ITSM',
  'المتجر',
  'الفوترة',
  'المالية',
  'المخزون',
  'الموارد البشرية',
  'الهوية والصلاحيات',
  'الأمن',
  'الذكاء الاصطناعي',
  'ذكاء الأعمال',
];

export function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { state: health, refresh } = useHealth();
  const { activeTenant } = useTenancy();

  const initial = (user.fullName.trim() || user.email).slice(0, 1).toUpperCase();
  const lastLogin = user.lastLoginAt
    ? new Intl.DateTimeFormat('ar-PS', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(user.lastLoginAt))
    : '—';

  async function handleLogout() {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await onLogout();
    } finally {
      setSigningOut(false);
    }
  }

  const today = new Intl.DateTimeFormat('ar-PS', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const statusLabel =
    health.kind === 'online'
      ? 'الخدمة متصلة'
      : health.kind === 'checking'
        ? 'جارٍ الفحص'
        : 'الخدمة متوقفة';
  const database = health.kind === 'online' ? health.data.checks.database : null;

  return (
    <div className="app-shell">
      <aside className={`sidebar${menuOpen ? ' is-open' : ''}`} aria-label="القائمة الرئيسية">
        <div className="sidebar-head">
          <Brand />
          <button
            type="button"
            className="icon-button sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="إغلاق القائمة"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <TenantSwitcher />

        <nav className="sidebar-nav">
          <span className="sidebar-label">مساحة العمل</span>{' '}
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`nav-item${item.active ? ' active' : ''}`}
              aria-current={item.active ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {!item.active && item.soon !== false && <span className="nav-badge">قريبًا</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-card">
            <span className="avatar" aria-hidden="true">
              {initial}
            </span>
            <span className="user-meta">
              <strong>{user.fullName}</strong>
              <small dir="ltr">{user.email}</small>
              {activeTenant && <small className="user-role">{activeTenant.role.name}</small>}
            </span>
            <button
              type="button"
              className="icon-button"
              onClick={() => void handleLogout()}
              disabled={signingOut}
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
          <p className="sidebar-version">الإصدار 0.1.0 — الخطوة 10</p>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label="إغلاق القائمة"
        />
      )}

      <div className="app-main">
        <header className="topbar">
          <button
            type="button"
            className="icon-button menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="فتح القائمة"
          >
            <Icon name="menu" size={20} />
          </button>

          <div className="topbar-title">
            <h1>لوحة التحكم</h1>
            <p>{today}</p>
          </div>

          <div className="topbar-actions">
            <div className={`status-pill status-${health.kind}`} role="status" aria-live="polite">
              <span className="status-dot" aria-hidden="true" />
              {statusLabel}
            </div>
            <ThemeToggle />
            <div className="topbar-avatar" aria-hidden="true">
              {initial}
            </div>
          </div>
        </header>

        <main className="content">
          <section className="welcome-banner">
            <div>
              <span className="eyebrow">
                {activeTenant ? `مساحة العمل · ${activeTenant.name}` : 'مساحة العمل'}
              </span>
              <h2>مرحبًا، {user.fullName}</h2>
              <p>
                أنت تعمل الآن داخل مؤسستك بدور «{activeTenant?.role.name ?? '—'}». كل بيانات هذه
                المؤسسة معزولة عن غيرها، وستُملأ المؤشرات بعد بناء وحدات الأعمال.
              </p>
            </div>
            <div className="welcome-aside" aria-hidden="true">
              <Icon name="spark" size={30} />
              <span>الخطوة 10</span>
            </div>
          </section>

          <TenantPanel />

          <CompaniesPanel />

          <MembersPanel />

          <CustomersPanel />

          <AuditPanel />

          <section className="stats-grid" aria-label="المؤشرات">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <span className="stat-icon">
                  <Icon name={stat.icon} size={19} />
                </span>
                <div>
                  <p className="stat-label">{stat.label}</p>
                  <p className="stat-value">—</p>
                  <p className="stat-hint">{stat.hint}</p>
                </div>
              </article>
            ))}
          </section>

          <div className="content-grid">
            <section className="card" aria-labelledby="system-title">
              <div className="card-head">
                <h3 id="system-title">حالة النظام</h3>
                <button type="button" className="link-button" onClick={refresh}>
                  إعادة الفحص
                </button>
              </div>

              <ul className="status-list">
                <li>
                  <span className="status-list-label">
                    <Icon name="spark" size={17} />
                    خدمة API
                  </span>
                  <span className={`tag ${health.kind === 'online' ? 'tag-ok' : 'tag-off'}`}>
                    {health.kind === 'online'
                      ? 'تعمل'
                      : health.kind === 'checking'
                        ? '...'
                        : 'متوقفة'}
                  </span>
                </li>
                <li>
                  <span className="status-list-label">
                    <Icon name="database" size={17} />
                    قاعدة البيانات
                  </span>
                  <span
                    className={`tag ${
                      database?.status === 'up' ? 'tag-ok' : database ? 'tag-off' : 'tag-muted'
                    }`}
                  >
                    {database ? (database.status === 'up' ? 'تعمل' : 'متوقفة') : '—'}
                  </span>
                </li>
                <li>
                  <span className="status-list-label">
                    <Icon name="spark" size={17} />
                    استجابة القاعدة
                  </span>
                  <span className="mono">
                    {database?.status === 'up' ? `${database.latencyMs} ms` : '—'}
                  </span>
                </li>
                <li>
                  <span className="status-list-label">
                    <Icon name="shield" size={17} />
                    المصادقة
                  </span>
                  <span className="tag tag-ok">مفعّلة</span>
                </li>
                <li>
                  <span className="status-list-label">
                    <Icon name="users" size={17} />
                    آخر دخول
                  </span>
                  <span className="mono">{lastLogin}</span>
                </li>
                <li>
                  <span className="status-list-label">الإصدار</span>
                  <span className="mono">
                    {health.kind === 'online' ? health.data.version : '—'}
                  </span>
                </li>
                <li>
                  <span className="status-list-label">مدة التشغيل</span>
                  <span className="mono">
                    {health.kind === 'online' ? `${health.data.uptimeSeconds} ثانية` : '—'}
                  </span>
                </li>
              </ul>

              <p className="card-note">
                {health.kind === 'offline'
                  ? `تعذر الاتصال: ${health.message}`
                  : health.kind === 'online'
                    ? 'الاتصال بين الواجهة وخدمة API سليم.'
                    : 'جارٍ التحقق من الاتصال بالخدمة.'}
              </p>
            </section>

            <section className="card" aria-labelledby="next-title">
              <div className="card-head">
                <h3 id="next-title">الخطوات القادمة</h3>
                <span className="tag tag-accent">10 من 10</span>
              </div>

              <ol className="next-list">
                {nextSteps.map((step, index) => (
                  <li key={step.title}>
                    <span className="next-number">{index + 9}</span>
                    <div>
                      <p className="next-title">{step.title}</p>
                      <p className="next-note">{step.note}</p>
                    </div>
                    <span className={`tag ${index === 0 ? 'tag-accent' : 'tag-muted'}`}>
                      {step.state}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="card-note">لن تبدأ أي خطوة قبل اعتماد الخطوة السابقة.</p>
            </section>
          </div>

          <div className="content-grid">
            <section className="card" aria-labelledby="activity-title">
              <div className="card-head">
                <h3 id="activity-title">أحدث النشاطات</h3>
                <span className="tag tag-muted">سجل التدقيق — الخطوة 10</span>
              </div>
              <div className="empty-state">
                <span className="empty-icon">
                  <Icon name="chart" size={26} />
                </span>
                <p className="empty-title">لا توجد أحداث بعد</p>
                <p className="empty-note">
                  ستظهر هنا عمليات الدخول والتغييرات الحساسة بعد إضافة سجل التدقيق.
                </p>
              </div>
            </section>

            <section className="card" aria-labelledby="modules-title">
              <div className="card-head">
                <h3 id="modules-title">وحدات المنصة</h3>
                <span className="tag tag-muted">12 وحدة</span>
              </div>
              <ul className="chip-list">
                {moduleChips.map((module) => (
                  <li key={module}>{module}</li>
                ))}
              </ul>
              <p className="card-note">تُبنى الوحدات تدريجيًا فوق النواة نفسها.</p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
