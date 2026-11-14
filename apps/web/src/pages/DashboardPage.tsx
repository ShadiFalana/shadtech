import { useState } from 'react';
import { AuditPanel } from '../components/AuditPanel';
import { BillingPanel } from '../components/BillingPanel';
import { Brand } from '../components/Brand';
import { CompaniesPanel } from '../components/CompaniesPanel';
import { CustomersPanel } from '../components/CustomersPanel';
import { Icon, type IconName } from '../components/Icon';
import { InventoryPanel } from '../components/InventoryPanel';
import { MembersPanel } from '../components/MembersPanel';
import { ReportsPanel } from '../components/ReportsPanel';
import { SettingsPanel } from '../components/SettingsPanel';
import { TenantPanel } from '../components/TenantPanel';
import { TenantSwitcher } from '../components/TenantSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import { TicketsPanel } from '../components/TicketsPanel';
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
  view: View;
  soon?: boolean;
}

type View =
  | 'dashboard'
  | 'tickets'
  | 'customers'
  | 'members'
  | 'billing'
  | 'inventory'
  | 'companies'
  | 'reports'
  | 'audit'
  | 'settings';

const navItems: NavItem[] = [
  { label: 'لوحة التحكم', icon: 'dashboard', view: 'dashboard' },
  { label: 'التذاكر والدعم', icon: 'ticket', view: 'tickets', soon: false },
  { label: 'العملاء', icon: 'users', view: 'customers', soon: false },
  { label: 'إدارة المستخدمين', icon: 'users', view: 'members', soon: false },
  { label: 'المبيعات والفوترة', icon: 'invoice', view: 'billing', soon: false },
  { label: 'المخزون', icon: 'box', view: 'inventory', soon: false },
  { label: 'الشركات والفروع', icon: 'building', view: 'companies', soon: false },
  { label: 'التقارير', icon: 'chart', view: 'reports', soon: false },
  { label: 'سجل التدقيق', icon: 'chart', view: 'audit', soon: false },
  { label: 'الإعدادات', icon: 'settings', view: 'settings', soon: false },
];

const stats = [
  { label: 'التذاكر المفتوحة', hint: 'بانتظار وحدة الدعم', icon: 'ticket' as IconName },
  { label: 'العملاء النشطون', hint: 'بانتظار وحدة العملاء', icon: 'users' as IconName },
  { label: 'فواتير غير مسددة', hint: 'بانتظار وحدة الفوترة', icon: 'invoice' as IconName },
  { label: 'أصناف منخفضة', hint: 'بانتظار وحدة المخزون', icon: 'box' as IconName },
];

const nextSteps = [
  { title: 'الذكاء الاصطناعي', note: 'مساعدو الذكاء الاصطناعي', state: 'مقفلة' },
  { title: 'ذكاء الأعمال', note: 'تحليلات متقدمة', state: 'مقفلة' },
  { title: 'التكاملات', note: 'API خارجية', state: 'مقفلة' },
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

const viewTitles: Record<View, string> = {
  dashboard: 'لوحة التحكم',
  tickets: 'التذاكر والدعم',
  customers: 'العملاء',
  members: 'المستخدمون',
  billing: 'الفوترة والمبيعات',
  inventory: 'المخزون',
  companies: 'الشركات والفروع',
  reports: 'التقارير',
  audit: 'سجل التدقيق',
  settings: 'الإعدادات',
};

export function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const [view, setView] = useState<View>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { state: health, refresh } = useHealth();
  const { activeTenant } = useTenancy();

  const initial = (user.fullName.trim() || user.email).slice(0, 1).toUpperCase();
  const lastLogin = user.lastLoginAt
    ? new Intl.DateTimeFormat('ar-PS', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(user.lastLoginAt),
      )
    : '—';

  async function handleLogout() {
    if (signingOut) return;
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
          <span className="sidebar-label">مساحة العمل</span>
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`nav-item${item.view === view ? ' active' : ''}`}
              aria-current={item.view === view ? 'page' : undefined}
              onClick={() => {
                setView(item.view);
                setMenuOpen(false);
              }}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.soon !== false && item.view !== view && (
                <span className="nav-badge">قريبًا</span>
              )}
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
            <h1>{viewTitles[view]}</h1>
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
          {view === 'dashboard' && (
            <>
              <section className="welcome-banner">
                <div>
                  <span className="eyebrow">
                    {activeTenant ? 'مساحة العمل · ' + activeTenant.name : 'مساحة العمل'}
                  </span>
                  <h2>مرحبًا، {user.fullName}</h2>
                  <p>
                    أنت تعمل الآن داخل مؤسستك بدور «{activeTenant?.role.name ?? '—'}». كل بيانات هذه
                    المؤسسة معزولة عن غيرها.
                  </p>
                </div>
                <div className="welcome-aside" aria-hidden="true">
                  <Icon name="spark" size={30} />
                  <span>الخطوة 10</span>
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

              <TenantPanel />
            </>
          )}

          {view === 'tickets' && <TicketsPanel />}
          {view === 'customers' && <CustomersPanel />}
          {view === 'members' && <MembersPanel />}
          {view === 'billing' && <BillingPanel />}
          {view === 'inventory' && <InventoryPanel />}
          {view === 'companies' && <CompaniesPanel />}
          {view === 'reports' && <ReportsPanel />}
          {view === 'audit' && <AuditPanel />}
          {view === 'settings' && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}
