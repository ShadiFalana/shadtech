import { useState } from 'react';
import { Brand } from '../components/Brand';
import { Icon, type IconName } from '../components/Icon';
import { ThemeToggle } from '../components/ThemeToggle';
import { useHealth } from '../lib/health';

interface DashboardPageProps {
  email: string;
  onLogout: () => void;
}

interface NavItem {
  label: string;
  icon: IconName;
  active?: boolean;
}

const navItems: NavItem[] = [
  { label: 'لوحة التحكم', icon: 'dashboard', active: true },
  { label: 'التذاكر والدعم', icon: 'ticket' },
  { label: 'العملاء', icon: 'users' },
  { label: 'المبيعات والفوترة', icon: 'invoice' },
  { label: 'المخزون', icon: 'box' },
  { label: 'الشركات والفروع', icon: 'building' },
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
  { title: 'المصادقة', note: 'تسجيل الدخول والجلسات', state: 'التالية' },
  { title: 'الصلاحيات وتعدد المؤسسات', note: 'أدوار وعزل بيانات', state: 'مقفلة' },
  { title: 'الشركات والفروع', note: 'الهيكل التنظيمي للمؤسسة', state: 'مقفلة' },
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

export function DashboardPage({ email, onLogout }: DashboardPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { state: health, refresh } = useHealth();

  const today = new Intl.DateTimeFormat('ar-PS', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const statusLabel =
    health.kind === 'online' ? 'الخدمة متصلة' : health.kind === 'checking' ? 'جارٍ الفحص' : 'الخدمة متوقفة';
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

        <nav className="sidebar-nav">
          <span className="sidebar-label">مساحة العمل</span>
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
              {!item.active && <span className="nav-badge">قريبًا</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-card">
            <span className="avatar" aria-hidden="true">
              {email.slice(0, 1).toUpperCase()}
            </span>
            <span className="user-meta">
              <strong>مدير النظام</strong>
              <small dir="ltr">{email}</small>
            </span>
            <button type="button" className="icon-button" onClick={onLogout} aria-label="تسجيل الخروج">
              <Icon name="logout" size={18} />
            </button>
          </div>
          <p className="sidebar-version">الإصدار 0.1.0 — الخطوة 2</p>
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
              {email.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="content">
          <section className="welcome-banner">
            <div>
              <span className="eyebrow">وضع المعاينة</span>
              <h2>مرحبًا بك في SHADTECH</h2>
              <p>
                هذه لوحة التحكم التأسيسية. ستُملأ المؤشرات بالبيانات الحقيقية بعد بناء وحدات
                الأعمال.
              </p>
            </div>
            <div className="welcome-aside" aria-hidden="true">
              <Icon name="spark" size={30} />
              <span>الخطوة 2</span>
            </div>
          </section>

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
                    {health.kind === 'online' ? 'تعمل' : health.kind === 'checking' ? '...' : 'متوقفة'}
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
                    {database
                      ? database.status === 'up'
                        ? 'تعمل'
                        : 'متوقفة'
                      : '—'}
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
                  <span className="tag tag-muted">الخطوة 3</span>
                </li>
                <li>
                  <span className="status-list-label">الإصدار</span>
                  <span className="mono">{health.kind === 'online' ? health.data.version : '—'}</span>
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
                <span className="tag tag-accent">3 من 10</span>
              </div>

              <ol className="next-list">
                {nextSteps.map((step, index) => (
                  <li key={step.title}>
                    <span className="next-number">{index + 3}</span>
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
                <span className="tag tag-muted">سجل التدقيق — الخطوة 8</span>
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
