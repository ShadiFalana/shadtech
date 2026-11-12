import { useCallback, useEffect, useState } from 'react';

interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
}

type ApiState =
  | { kind: 'checking' }
  | { kind: 'online'; data: HealthResponse }
  | { kind: 'offline'; message: string };

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const modules = [
  { name: 'الدعم الفني', description: 'إدارة طلبات الصيانة والأجهزة والزيارات الميدانية.' },
  { name: 'إدارة العلاقات', description: 'سجل موحد للعملاء وجهات الاتصال والفرص البيعية.' },
  { name: 'التذاكر (ITSM)', description: 'تصنيف وأولوية وSLA وتتبع كامل لدورة حياة التذكرة.' },
  { name: 'المتجر الإلكتروني', description: 'كتالوج تقني، مخزون، طلبات، وشحن.' },
  { name: 'المبيعات والفوترة', description: 'عروض أسعار، أوامر بيع، فواتير، ومدفوعات.' },
  { name: 'المالية', description: 'إيرادات ومصروفات وقيود محاسبية وإقفال مالي.' },
  { name: 'المخزون', description: 'أصناف ومستودعات وحركات وجرد وتنبيهات نقص.' },
  { name: 'الموارد البشرية', description: 'موظفون، حضور، إجازات، ومهام الفريق.' },
  { name: 'الهوية والصلاحيات', description: 'أدوار وأذونات وعزل صارم لبيانات كل مؤسسة.' },
  { name: 'الأمن السيبراني', description: 'تدقيق، سياسات، وسجل غير قابل للتعديل.' },
  { name: 'الذكاء الاصطناعي', description: 'مساعد ذكي للتصنيف والتلخيص والتوصيات.' },
  { name: 'ذكاء الأعمال', description: 'لوحات مؤشرات وتقارير لدعم القرار.' },
];

const roadmap = [
  { title: 'الهيكل الأساسي', note: 'المستودع، API، الصحة، واجهة عربية RTL' },
  { title: 'قاعدة البيانات', note: 'PostgreSQL، المخططات، والهجرات' },
  { title: 'المصادقة', note: 'تسجيل الدخول، الجلسات، وكلمات المرور' },
  { title: 'الصلاحيات وتعدد المؤسسات', note: 'أدوار، أذونات، وعزل البيانات' },
  { title: 'الشركات والفروع', note: 'كيانات المؤسسة وهيكلها التنظيمي' },
  { title: 'المستخدمون', note: 'إدارة الحسابات والأدوار' },
  { title: 'العملاء', note: 'سجل العملاء وجهات الاتصال' },
  { title: 'سجل التدقيق', note: 'تتبع الأحداث الحساسة' },
  { title: 'واجهة الاستخدام', note: 'تجربة متكاملة لجميع الوحدات' },
  { title: 'الاختبارات والتوثيق', note: 'جودة، توثيق، وتكامل مستمر' },
];

function App() {
  const [api, setApi] = useState<ApiState>({ kind: 'checking' });

  const checkApi = useCallback(async () => {
    setApi({ kind: 'checking' });
    try {
      const response = await fetch(`${API_BASE}/api/v1/health`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as HealthResponse;
      setApi({ kind: 'online', data });
    } catch (error) {
      setApi({
        kind: 'offline',
        message: error instanceof Error ? error.message : 'تعذر الوصول إلى الخدمة',
      });
    }
  }, []);

  useEffect(() => {
    void checkApi();
  }, [checkApi]);

  const statusLabel =
    api.kind === 'online' ? 'الخدمة متصلة' : api.kind === 'checking' ? 'جارٍ الفحص' : 'الخدمة متوقفة';

  return (
    <div className="page">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="SHADTECH — الصفحة الرئيسية">
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span className="brand-text">
            <strong>SHADTECH</strong>
            <small>منصة الأعمال التقنية</small>
          </span>
        </a>

        <nav className="nav" aria-label="التنقل الرئيسي">
          <a href="#platform">المنصة</a>
          <a href="#modules">الوحدات</a>
          <a href="#roadmap">خارطة الطريق</a>
        </nav>

        <div className={`status-pill status-${api.kind}`} role="status" aria-live="polite">
          <span className="status-dot" aria-hidden="true" />
          {statusLabel}
        </div>
      </header>

      <main id="top">
        <section className="hero" id="platform">
          <div className="hero-copy">
            <span className="eyebrow">الخطوة 1 — الأساس</span>
            <h1>
              منصة واحدة
              <br />
              تدير أعمالك التقنية
            </h1>
            <p>
              SHADTECH تجمع الدعم الفني، إدارة العملاء، التذاكر، المبيعات، الفوترة، والمخزون في
              نظام واحد مصمم للشركات الصغيرة والمتوسطة — بدقة، وأمان، وواجهة عربية أصلية.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#modules">
                استكشف الوحدات
              </a>
              <a className="button button-ghost" href="#roadmap">
                خارطة الطريق
              </a>
            </div>
          </div>

          <div className="hero-panel" aria-label="حالة النظام">
            <div className="panel-head">
              <h2>حالة النظام</h2>
              <button type="button" className="link-button" onClick={() => void checkApi()}>
                إعادة الفحص
              </button>
            </div>

            <dl className="panel-rows">
              <div>
                <dt>خدمة API</dt>
                <dd className={api.kind === 'online' ? 'ok' : api.kind === 'offline' ? 'bad' : ''}>
                  {api.kind === 'online' ? 'تعمل' : api.kind === 'checking' ? '...' : 'متوقفة'}
                </dd>
              </div>
              <div>
                <dt>الإصدار</dt>
                <dd>{api.kind === 'online' ? api.data.version : '—'}</dd>
              </div>
              <div>
                <dt>مدة التشغيل</dt>
                <dd>{api.kind === 'online' ? `${api.data.uptimeSeconds} ثانية` : '—'}</dd>
              </div>
              <div>
                <dt>المسار</dt>
                <dd className="mono">/api/v1/health</dd>
              </div>
            </dl>

            <p className="panel-note">
              {api.kind === 'offline'
                ? `تعذر الاتصال: ${api.message}`
                : api.kind === 'online'
                  ? 'الاتصال بين الواجهة والخدمة سليم.'
                  : 'جارٍ التحقق من الاتصال بين الواجهة والخدمة.'}
            </p>
          </div>
        </section>

        <section className="section" id="modules">
          <div className="section-head">
            <span className="eyebrow">وحدة مترابطة</span>
            <h2>كل ما تحتاجه إدارة أعمالك</h2>
            <p>
              تُبنى المنصة تدريجيًا كوحدات مترابطة فوق نواة موثوقة واحدة، بدل أنظمة منفصلة
              ومتباعدة.
            </p>
          </div>

          <div className="module-grid">
            {modules.map((module, index) => (
              <article className="module-card" key={module.name}>
                <span className="module-index">{String(index + 1).padStart(2, '0')}</span>
                <h3>{module.name}</h3>
                <p>{module.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="roadmap">
          <div className="section-head">
            <span className="eyebrow">بناء متدرج</span>
            <h2>خارطة الطريق</h2>
            <p>كل خطوة تُنجز وتُختبر وتُعتمد قبل الانتقال إلى التي تليها.</p>
          </div>

          <ol className="roadmap">
            {roadmap.map((step, index) => {
              const state = index === 0 ? 'current' : 'next';
              return (
                <li className={`roadmap-item ${state}`} key={step.title}>
                  <span className="roadmap-number">{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.note}</p>
                  </div>
                  <span className="roadmap-badge">
                    {state === 'current' ? 'قيد الإنجاز' : 'قادم'}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      </main>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} SHADTECH — فلسطين</span>
        <span className="footer-note">الإصدار 0.1.0 — الخطوة 1</span>
      </footer>
    </div>
  );
}

export default App;
