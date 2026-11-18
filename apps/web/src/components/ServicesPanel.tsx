import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { useTenancy } from '../lib/tenancy';
import { Icon } from './Icon';

interface Service {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  durationMin: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = { name: '', description: '', category: '', price: '', durationMin: '', isActive: true };

export function ServicesPanel() {
  const { hasPermission } = useTenancy();
  const canRead = hasPermission('services.read');
  const canWrite = hasPermission('services.write');

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  const load = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);
    try {
      const path = search.trim()
        ? `/api/v1/services?q=${encodeURIComponent(search.trim())}`
        : '/api/v1/services';
      const data = await apiRequest<Service[]>(path);
      setServices(data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر تحميل الخدمات.');
    } finally {
      setLoading(false);
    }
  }, [canRead, search]);

  useEffect(() => { void load(); }, [load]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createPending) return;
    const name = createForm.name.trim();
    if (name.length < 2) { setCreateError('اسم الخدمة يجب أن يكون حرفين على الأقل.'); return; }
    setCreatePending(true);
    setCreateError(null);
    try {
      await apiRequest('/api/v1/services', {
        method: 'POST',
        body: {
          name,
          description: createForm.description.trim() || undefined,
          category: createForm.category.trim() || undefined,
          price: createForm.price ? Number(createForm.price) : undefined,
          durationMin: createForm.durationMin ? Number(createForm.durationMin) : undefined,
          isActive: createForm.isActive,
        },
      });
      setCreateForm(emptyForm);
      setCreating(false);
      await load();
    } catch (caught) {
      setCreateError(caught instanceof ApiError ? caught.message : 'تعذر إنشاء الخدمة.');
    } finally {
      setCreatePending(false);
    }
  }

  async function handleDelete(service: Service) {
    if (!window.confirm(`حذف الخدمة «${service.name}»؟`)) return;
    try {
      await apiRequest(`/api/v1/services/${service.id}`, { method: 'DELETE' });
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر حذف الخدمة.');
    }
  }

  if (!canRead) {
    return (
      <section className="card" aria-labelledby="services-title">
        <div className="card-head"><h3 id="services-title">خدمات IT</h3></div>
        <p className="card-note">لا تملك صلاحية عرض الخدمات (services.read).</p>
      </section>
    );
  }

  return (
    <section className="card" aria-labelledby="services-title">
      <div className="card-head">
        <h3 id="services-title">خدمات IT</h3>
        <span className="tag tag-muted">{services.length} خدمة</span>
      </div>
      <div className="inventory-toolbar">
        <label className="field inventory-search">
          <span className="field-label">بحث</span>
          <input type="search" placeholder="اسم، فئة…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        {canWrite && (
          <button type="button" className="button" onClick={() => { setCreating((p) => !p); setCreateForm(emptyForm); setCreateError(null); }}>
            <Icon name="plus" size={16} /> خدمة جديدة
          </button>
        )}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {creating && canWrite && (
        <form className="inventory-form" onSubmit={handleCreate} noValidate>
          <div className="inventory-form-row">
            <label className="field">
              <span className="field-label">اسم الخدمة</span>
              <input type="text" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} maxLength={200} />
            </label>
            <label className="field">
              <span className="field-label">الفئة</span>
              <input type="text" value={createForm.category} onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))} />
            </label>
          </div>
          <div className="inventory-form-row">
            <label className="field">
              <span className="field-label">السعر</span>
              <input type="number" value={createForm.price} onChange={(e) => setCreateForm((p) => ({ ...p, price: e.target.value }))} min="0" step="0.01" />
            </label>
            <label className="field">
              <span className="field-label">المدة (دقائق)</span>
              <input type="number" value={createForm.durationMin} onChange={(e) => setCreateForm((p) => ({ ...p, durationMin: e.target.value }))} min="0" />
            </label>
          </div>
          <label className="field">
            <span className="field-label">الوصف</span>
            <textarea value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
          </label>
          {createError && <p className="form-error" role="alert">{createError}</p>}
          <div className="inventory-form-actions">
            <button type="submit" className="button button-primary" disabled={createPending}>{createPending ? 'جارٍ الإنشاء…' : 'إنشاء خدمة'}</button>
            <button type="button" className="button" onClick={() => { setCreating(false); setCreateForm(emptyForm); setCreateError(null); }} disabled={createPending}>إلغاء</button>
          </div>
        </form>
      )}
      {loading ? (
        <p className="card-note">جارٍ تحميل الخدمات…</p>
      ) : services.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon"><Icon name="spark" size={26} /></span>
          <p className="empty-title">لا توجد خدمات</p>
          <p className="empty-note">{canWrite ? 'أضف أول خدمة.' : 'لا تملك صلاحية إضافة خدمات.'}</p>
        </div>
      ) : (
        <ul className="product-list">
          {services.map((service) => (
            <li key={service.id} className="product-item">
              <div className="product-head">
                <div className="product-identity">
                  <strong>{service.name}</strong>
                  {service.category && <span className="tag tag-muted">{service.category}</span>}
                  {!service.isActive && <span className="tag tag-off">غير نشط</span>}
                </div>
                <div className="product-stock">
                  <span className="tag tag-ok">{Number(service.price).toFixed(2)}</span>
                </div>
                {canWrite && (
                  <div className="product-actions">
                    <button type="button" className="icon-button" onClick={() => handleDelete(service)} aria-label="حذف">
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="product-meta">
                {service.description && <span>{service.description}</span>}
                {service.durationMin && <span>المدة: {service.durationMin} دقيقة</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
