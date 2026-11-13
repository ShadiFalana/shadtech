import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { useTenancy } from '../lib/tenancy';
import { Icon } from './Icon';

interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = { name: '', email: '', phone: '', company: '', notes: '' };

export function CustomersPanel() {
  const { hasPermission } = useTenancy();
  const canRead = hasPermission('customers.read');
  const canWrite = hasPermission('customers.write');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, setEditPending] = useState(false);

  const load = useCallback(
    async (q?: string) => {
      if (!canRead) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const path =
          q && q.trim()
            ? `/api/v1/customers?q=${encodeURIComponent(q.trim())}`
            : '/api/v1/customers';
        const data = await apiRequest<Customer[]>(path);
        setCustomers(data);
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : 'تعذر تحميل العملاء.');
      } finally {
        setLoading(false);
      }
    },
    [canRead],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Debounced search
  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load(query);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, load]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createPending) {
      return;
    }
    const name = createForm.name.trim();
    if (name.length < 2) {
      setCreateError('اسم العميل يجب أن يكون حرفين على الأقل.');
      return;
    }
    setCreatePending(true);
    setCreateError(null);
    try {
      await apiRequest('/api/v1/customers', {
        method: 'POST',
        body: {
          name,
          email: createForm.email.trim() || undefined,
          phone: createForm.phone.trim() || undefined,
          company: createForm.company.trim() || undefined,
          notes: createForm.notes.trim() || undefined,
        },
      });
      setCreateForm(emptyForm);
      setCreating(false);
      await load(query);
    } catch (caught) {
      setCreateError(caught instanceof ApiError ? caught.message : 'تعذر إنشاء العميل.');
    } finally {
      setCreatePending(false);
    }
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setEditForm({
      name: customer.name,
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      company: customer.company ?? '',
      notes: customer.notes ?? '',
    });
    setEditError(null);
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || editPending) {
      return;
    }
    const name = editForm.name.trim();
    if (name.length < 2) {
      setEditError('اسم العميل يجب أن يكون حرفين على الأقل.');
      return;
    }
    setEditPending(true);
    setEditError(null);
    try {
      await apiRequest(`/api/v1/customers/${editingId}`, {
        method: 'PATCH',
        body: {
          name,
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
          company: editForm.company.trim() || null,
          notes: editForm.notes.trim() || null,
        },
      });
      setEditingId(null);
      await load(query);
    } catch (caught) {
      setEditError(caught instanceof ApiError ? caught.message : 'تعذر تحديث العميل.');
    } finally {
      setEditPending(false);
    }
  }

  async function handleDelete(customer: Customer) {
    if (!window.confirm(`حذف العميل «${customer.name}»؟`)) {
      return;
    }
    try {
      await apiRequest(`/api/v1/customers/${customer.id}`, { method: 'DELETE' });
      await load(query);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر حذف العميل.');
    }
  }

  if (!canRead) {
    return (
      <section className="card" aria-labelledby="customers-title">
        <div className="card-head">
          <h3 id="customers-title">العملاء</h3>
        </div>
        <p className="card-note">لا تملك صلاحية عرض العملاء (customers.read).</p>
      </section>
    );
  }

  return (
    <section className="card customers-panel" aria-labelledby="customers-title">
      <div className="card-head">
        <h3 id="customers-title">العملاء</h3>
        <span className="tag tag-muted">{customers.length} عميل</span>
      </div>

      <div className="customer-toolbar">
        <label className="field customer-search">
          <span className="field-label">بحث</span>
          <input
            type="search"
            placeholder="اسم، بريد، هاتف، شركة…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {canWrite && (
          <button
            type="button"
            className="button"
            onClick={() => {
              setCreating((prev) => !prev);
              setCreateForm(emptyForm);
              setCreateError(null);
            }}
          >
            <Icon name="plus" size={16} /> عميل جديد
          </button>
        )}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {creating && canWrite && (
        <form className="customer-form" onSubmit={handleCreate} noValidate>
          <div className="customer-form-row">
            <label className="field">
              <span className="field-label">الاسم</span>
              <input
                type="text"
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                }
                maxLength={120}
              />
            </label>
            <label className="field">
              <span className="field-label">البريد الإلكتروني</span>
              <input
                type="email"
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, email: event.target.value }))
                }
                dir="ltr"
              />
            </label>
          </div>
          <div className="customer-form-row">
            <label className="field">
              <span className="field-label">الهاتف</span>
              <input
                type="text"
                value={createForm.phone}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                dir="ltr"
              />
            </label>
            <label className="field">
              <span className="field-label">الشركة</span>
              <input
                type="text"
                value={createForm.company}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, company: event.target.value }))
                }
                maxLength={120}
              />
            </label>
          </div>
          <label className="field">
            <span className="field-label">ملاحظات</span>
            <textarea
              value={createForm.notes}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              rows={3}
              maxLength={2000}
            />
          </label>
          {createError && (
            <p className="form-error" role="alert">
              {createError}
            </p>
          )}
          <div className="customer-form-actions">
            <button type="submit" className="button button-primary" disabled={createPending}>
              {createPending ? 'جارٍ الإنشاء…' : 'إنشاء عميل'}
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                setCreating(false);
                setCreateForm(emptyForm);
                setCreateError(null);
              }}
              disabled={createPending}
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="card-note">جارٍ تحميل العملاء…</p>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name="users" size={26} />
          </span>
          <p className="empty-title">لا يوجد عملاء</p>
          <p className="empty-note">
            {canWrite ? 'أضف أول عميل للبدء.' : 'لا تملك صلاحية إضافة عملاء.'}
          </p>
        </div>
      ) : (
        <ul className="customer-list">
          {customers.map((customer) => (
            <li key={customer.id} className="customer-item">
              {editingId === customer.id ? (
                <form className="customer-form" onSubmit={handleUpdate} noValidate>
                  <div className="customer-form-row">
                    <label className="field">
                      <span className="field-label">الاسم</span>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                        maxLength={120}
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">البريد الإلكتروني</span>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                        dir="ltr"
                      />
                    </label>
                  </div>
                  <div className="customer-form-row">
                    <label className="field">
                      <span className="field-label">الهاتف</span>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, phone: event.target.value }))
                        }
                        dir="ltr"
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">الشركة</span>
                      <input
                        type="text"
                        value={editForm.company}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, company: event.target.value }))
                        }
                        maxLength={120}
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span className="field-label">ملاحظات</span>
                    <textarea
                      value={editForm.notes}
                      onChange={(event) =>
                        setEditForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      rows={3}
                      maxLength={2000}
                    />
                  </label>
                  {editError && (
                    <p className="form-error" role="alert">
                      {editError}
                    </p>
                  )}
                  <div className="customer-form-actions">
                    <button type="submit" className="button button-primary" disabled={editPending}>
                      {editPending ? 'جارٍ الحفظ…' : 'حفظ'}
                    </button>
                    <button
                      type="button"
                      className="button"
                      onClick={() => setEditingId(null)}
                      disabled={editPending}
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="customer-head">
                    <div className="customer-identity">
                      <strong>{customer.name}</strong>
                      {customer.company && (
                        <span className="tag tag-muted">{customer.company}</span>
                      )}
                    </div>
                    {canWrite && (
                      <div className="customer-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => startEdit(customer)}
                          aria-label="تعديل"
                        >
                          <Icon name="pencil" size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => handleDelete(customer)}
                          aria-label="حذف"
                        >
                          <Icon name="close" size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="customer-details">
                    {customer.email && <span dir="ltr">{customer.email}</span>}
                    {customer.phone && <span dir="ltr">{customer.phone}</span>}
                    {customer.notes && <p className="customer-notes">{customer.notes}</p>}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="card-note">
        كل عميل معزول داخل المؤسسة الحالية. البحث يشمل الاسم والبريد والهاتف والشركة.
      </p>
    </section>
  );
}
