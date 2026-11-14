import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { useTenancy } from '../lib/tenancy';
import { Icon } from './Icon';

interface Invoice {
  id: string;
  tenantId: string;
  customerId: string | null;
  number: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string } | null;
  _count?: { items: number; payments: number };
  items?: InvoiceItem[];
  payments?: Payment[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  notes: string | null;
}

const STATUS_LABELS: Record<Invoice['status'], string> = {
  DRAFT: 'مسودة',
  SENT: 'مرسلة',
  PAID: 'مدفوعة',
  OVERDUE: 'متأخرة',
  CANCELLED: 'ملغاة',
};

const emptyForm = { customerId: '', number: '', status: 'DRAFT', dueDate: '', notes: '' };

export function BillingPanel() {
  const { hasPermission } = useTenancy();
  const canRead = hasPermission('billing.read');
  const canWrite = hasPermission('billing.write');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  // item form
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const [itemPending, setItemPending] = useState(false);

  // payment form
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payPending, setPayPending] = useState(false);

  const load = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);
    try {
      const path = statusFilter ? `/api/v1/invoices?status=${statusFilter}` : '/api/v1/invoices';
      const data = await apiRequest<Invoice[]>(path);
      setInvoices(data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر تحميل الفواتير.');
    } finally {
      setLoading(false);
    }
  }, [canRead, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailError(null);
    try {
      const data = await apiRequest<Invoice>(`/api/v1/invoices/${id}`);
      setSelected(data);
      setSelectedId(id);
    } catch (caught) {
      setDetailError(caught instanceof ApiError ? caught.message : 'تعذر تحميل الفاتورة.');
    }
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createPending) return;
    const number = createForm.number.trim();
    if (!number) {
      setCreateError('رقم الفاتورة مطلوب.');
      return;
    }
    setCreatePending(true);
    setCreateError(null);
    try {
      await apiRequest('/api/v1/invoices', {
        method: 'POST',
        body: {
          number,
          customerId: createForm.customerId || undefined,
          status: createForm.status,
          dueDate: createForm.dueDate || undefined,
          notes: createForm.notes.trim() || undefined,
        },
      });
      setCreateForm(emptyForm);
      setCreating(false);
      await load();
    } catch (caught) {
      setCreateError(caught instanceof ApiError ? caught.message : 'تعذر إنشاء الفاتورة.');
    } finally {
      setCreatePending(false);
    }
  }

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || itemPending) return;
    const desc = itemDesc.trim();
    const qty = Number(itemQty) || 1;
    const price = Number(itemPrice) || 0;
    if (!desc) {
      return;
    }
    setItemPending(true);
    try {
      await apiRequest(`/api/v1/invoices/${selectedId}/items`, {
        method: 'POST',
        body: { description: desc, quantity: qty, unitPrice: price },
      });
      setItemDesc('');
      setItemQty('1');
      setItemPrice('');
      await loadDetail(selectedId);
      await load();
    } catch (caught) {
      setDetailError(caught instanceof ApiError ? caught.message : 'تعذر إضافة البند.');
    } finally {
      setItemPending(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    if (!selectedId) return;
    try {
      await apiRequest(`/api/v1/invoices/${selectedId}/items/${itemId}`, { method: 'DELETE' });
      await loadDetail(selectedId);
      await load();
    } catch (caught) {
      setDetailError(caught instanceof ApiError ? caught.message : 'تعذر حذف البند.');
    }
  }

  async function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || payPending) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      return;
    }
    setPayPending(true);
    try {
      await apiRequest(`/api/v1/invoices/${selectedId}/payments`, {
        method: 'POST',
        body: { amount, method: payMethod, notes: undefined },
      });
      setPayAmount('');
      await loadDetail(selectedId);
      await load();
    } catch (caught) {
      setDetailError(caught instanceof ApiError ? caught.message : 'تعذر تسجيل الدفعة.');
    } finally {
      setPayPending(false);
    }
  }

  async function handleDelete(invoice: Invoice) {
    if (!window.confirm(`حذف الفاتورة «${invoice.number}»؟`)) return;
    try {
      await apiRequest(`/api/v1/invoices/${invoice.id}`, { method: 'DELETE' });
      if (selectedId === invoice.id) {
        setSelectedId(null);
        setSelected(null);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر حذف الفاتورة.');
    }
  }

  if (!canRead) {
    return (
      <section className="card" aria-labelledby="billing-title">
        <div className="card-head">
          <h3 id="billing-title">الفوترة والمبيعات</h3>
        </div>
        <p className="card-note">لا تملك صلاحية عرض الفواتير (billing.read).</p>
      </section>
    );
  }

  return (
    <section className="card billing-panel" aria-labelledby="billing-title">
      <div className="card-head">
        <h3 id="billing-title">الفوترة والمبيعات</h3>
        <span className="tag tag-muted">{invoices.length} فاتورة</span>
      </div>

      <div className="billing-toolbar">
        <label className="field billing-filter">
          <span className="field-label">الحالة</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">الكل</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
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
            <Icon name="plus" size={16} /> فاتورة جديدة
          </button>
        )}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {creating && canWrite && (
        <form className="billing-form" onSubmit={handleCreate} noValidate>
          <div className="billing-form-row">
            <label className="field">
              <span className="field-label">رقم الفاتورة</span>
              <input
                type="text"
                value={createForm.number}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, number: event.target.value }))
                }
                dir="ltr"
              />
            </label>
            <label className="field">
              <span className="field-label">الحالة</span>
              <select
                value={createForm.status}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, status: event.target.value }))
                }
              >
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span className="field-label">تاريخ الاستحقاق</span>
            <input
              type="date"
              value={createForm.dueDate}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, dueDate: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span className="field-label">ملاحظات</span>
            <textarea
              value={createForm.notes}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              rows={2}
            />
          </label>
          {createError && (
            <p className="form-error" role="alert">
              {createError}
            </p>
          )}
          <div className="billing-form-actions">
            <button type="submit" className="button button-primary" disabled={createPending}>
              {createPending ? 'جارٍ الإنشاء…' : 'إنشاء فاتورة'}
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
        <p className="card-note">جارٍ تحميل الفواتير…</p>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name="invoice" size={26} />
          </span>
          <p className="empty-title">لا توجد فواتير</p>
          <p className="empty-note">
            {canWrite ? 'أنشئ أول فاتورة.' : 'لا تملك صلاحية إنشاء فواتير.'}
          </p>
        </div>
      ) : (
        <div className="billing-layout">
          <ul className="invoice-list">
            {invoices.map((invoice) => (
              <li
                key={invoice.id}
                className={`invoice-item${selectedId === invoice.id ? ' is-selected' : ''}`}
                onClick={() => loadDetail(invoice.id)}
              >
                <div className="invoice-item-head">
                  <strong>{invoice.number}</strong>
                  <span className={`tag status-${invoice.status.toLowerCase()}`}>
                    {STATUS_LABELS[invoice.status]}
                  </span>
                </div>
                <div className="invoice-item-meta">
                  <span>{invoice.customer?.name ?? 'بدون عميل'}</span>
                  <span>· {Number(invoice.total).toFixed(2)}</span>
                </div>
              </li>
            ))}
          </ul>

          {selected && (
            <div className="invoice-detail">
              <div className="invoice-detail-head">
                <h4>فاتورة {selected.number}</h4>
                <span className={`tag status-${selected.status.toLowerCase()}`}>
                  {STATUS_LABELS[selected.status]}
                </span>
              </div>
              <div className="invoice-detail-meta">
                <span>العميل: {selected.customer?.name ?? '—'}</span>
                <span>الإجمالي: {Number(selected.total).toFixed(2)}</span>
                <span>
                  المدفوع:{' '}
                  {selected.payments
                    ? selected.payments.reduce((s, p) => s + Number(p.amount), 0).toFixed(2)
                    : '0.00'}
                </span>
              </div>

              {detailError && (
                <p className="form-error" role="alert">
                  {detailError}
                </p>
              )}

              {/* Items */}
              <div className="invoice-section">
                <h5>البنود</h5>
                {selected.items && selected.items.length > 0 ? (
                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>الوصف</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>الإجمالي</th>
                        {canWrite && <th></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.description}</td>
                          <td>{Number(item.quantity)}</td>
                          <td>{Number(item.unitPrice).toFixed(2)}</td>
                          <td>{Number(item.total).toFixed(2)}</td>
                          {canWrite && (
                            <td>
                              <button
                                type="button"
                                className="icon-button"
                                onClick={() => handleRemoveItem(item.id)}
                                aria-label="حذف"
                              >
                                <Icon name="close" size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="card-note">لا توجد بنود.</p>
                )}

                {canWrite && (
                  <form className="item-form" onSubmit={handleAddItem} noValidate>
                    <input
                      type="text"
                      placeholder="وصف البند"
                      value={itemDesc}
                      onChange={(event) => setItemDesc(event.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="الكمية"
                      value={itemQty}
                      onChange={(event) => setItemQty(event.target.value)}
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="number"
                      placeholder="السعر"
                      value={itemPrice}
                      onChange={(event) => setItemPrice(event.target.value)}
                      min="0"
                      step="0.01"
                    />
                    <button type="submit" className="button" disabled={itemPending}>
                      <Icon name="plus" size={14} /> إضافة
                    </button>
                  </form>
                )}
              </div>

              {/* Payments */}
              <div className="invoice-section">
                <h5>الدفعات</h5>
                {selected.payments && selected.payments.length > 0 ? (
                  <ul className="payment-list">
                    {selected.payments.map((p) => (
                      <li key={p.id}>
                        <span>{Number(p.amount).toFixed(2)}</span>
                        <span className="tag tag-muted">{p.method}</span>
                        <span className="mono">
                          {new Date(p.paidAt).toLocaleDateString('ar-PS')}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="card-note">لا توجد دفعات.</p>
                )}

                {canWrite && (
                  <form className="payment-form" onSubmit={handlePayment} noValidate>
                    <input
                      type="number"
                      placeholder="المبلغ"
                      value={payAmount}
                      onChange={(event) => setPayAmount(event.target.value)}
                      min="0"
                      step="0.01"
                    />
                    <select
                      value={payMethod}
                      onChange={(event) => setPayMethod(event.target.value)}
                    >
                      <option value="CASH">نقدًا</option>
                      <option value="CARD">بطاقة</option>
                      <option value="BANK_TRANSFER">تحويل بنكي</option>
                      <option value="OTHER">أخرى</option>
                    </select>
                    <button type="submit" className="button" disabled={payPending}>
                      <Icon name="plus" size={14} /> تسجيل دفعة
                    </button>
                  </form>
                )}
              </div>

              {canWrite && (
                <button
                  type="button"
                  className="button button-danger"
                  onClick={() => handleDelete(selected)}
                >
                  حذف الفاتورة
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <p className="card-note">
        الفواتير معزولة داخل المؤسسة. تسجيل دفعة كاملة يغيّر الحالة إلى "مدفوعة" تلقائيًا.
      </p>
    </section>
  );
}
