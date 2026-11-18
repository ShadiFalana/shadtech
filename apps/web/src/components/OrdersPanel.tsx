import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { useTenancy } from '../lib/tenancy';
import { Icon } from './Icon';

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productId: string | null;
}

interface Order {
  id: string;
  number: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  createdAt: string;
  customer: { id: string; name: string } | null;
  items: OrderItem[];
}

const emptyItem = { description: '', quantity: '1', unitPrice: '', productId: '' };

export function OrdersPanel() {
  const { hasPermission } = useTenancy();
  const canRead = hasPermission('orders.read');
  const canWrite = hasPermission('orders.write');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [items, setItems] = useState([ { ...emptyItem } ]);
  const [tax, setTax] = useState('');
  const [notes, setNotes] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  const load = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);
    try {
      const path = statusFilter ? `/api/v1/orders?status=${encodeURIComponent(statusFilter)}` : '/api/v1/orders';
      const data = await apiRequest<Order[]>(path);
      setOrders(data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر تحميل الطلبات.');
    } finally {
      setLoading(false);
    }
  }, [canRead, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  function updateItem(index: number, patch: Partial<typeof emptyItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() { setItems((prev) => [ ...prev, { ...emptyItem } ]); }
  function removeItem(index: number) { setItems((prev) => prev.filter((_, i) => i !== index)); }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createPending) return;
    const validItems = items
      .map((it) => ({ description: it.description.trim(), quantity: Number(it.quantity), unitPrice: Number(it.unitPrice), productId: it.productId.trim() || undefined }))
      .filter((it) => it.description && it.quantity > 0 && it.unitPrice >= 0);
    if (validItems.length === 0) { setCreateError('أضف بندًا واحدًا على الأقل.'); return; }
    setCreatePending(true);
    setCreateError(null);
    try {
      await apiRequest('/api/v1/orders', {
        method: 'POST',
        body: { items: validItems, tax: tax ? Number(tax) : 0, notes: notes.trim() || undefined },
      });
      setItems([ { ...emptyItem } ]);
      setTax('');
      setNotes('');
      setCreating(false);
      await load();
    } catch (caught) {
      setCreateError(caught instanceof ApiError ? caught.message : 'تعذر إنشاء الطلب.');
    } finally {
      setCreatePending(false);
    }
  }

  async function handleStatusChange(order: Order, status: string) {
    try {
      await apiRequest(`/api/v1/orders/${order.id}`, { method: 'PATCH', body: { status } });
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر تحديث الطلب.');
    }
  }

  if (!canRead) {
    return (
      <section className="card" aria-labelledby="orders-title">
        <div className="card-head"><h3 id="orders-title">الطلبات / المتجر</h3></div>
        <p className="card-note">لا تملك صلاحية عرض الطلبات (orders.read).</p>
      </section>
    );
  }

  return (
    <section className="card" aria-labelledby="orders-title">
      <div className="card-head">
        <h3 id="orders-title">الطلبات / المتجر</h3>
        <span className="tag tag-muted">{orders.length} طلب</span>
      </div>
      <div className="inventory-toolbar">
        <label className="field inventory-search">
          <span className="field-label">الحالة</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">الكل</option>
            <option value="PENDING">قيد الانتظار</option>
            <option value="PAID">مدفوع</option>
            <option value="SHIPPED">تم الشحن</option>
            <option value="DELIVERED">تم التسليم</option>
            <option value="CANCELLED">ملغي</option>
          </select>
        </label>
        {canWrite && (
          <button type="button" className="button" onClick={() => { setCreating((p) => !p); setCreateError(null); }}>
            <Icon name="plus" size={16} /> طلب جديد
          </button>
        )}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {creating && canWrite && (
        <form className="inventory-form" onSubmit={handleCreate} noValidate>
          {items.map((item, index) => (
            <div className="inventory-form-row" key={index}>
              <label className="field" style={{ flex: 2 }}>
                <span className="field-label">الوصف</span>
                <input type="text" value={item.description} onChange={(e) => updateItem(index, { description: e.target.value })} />
              </label>
              <label className="field">
                <span className="field-label">الكمية</span>
                <input type="number" value={item.quantity} onChange={(e) => updateItem(index, { quantity: e.target.value })} min="0.01" step="0.01" />
              </label>
              <label className="field">
                <span className="field-label">سعر الوحدة</span>
                <input type="number" value={item.unitPrice} onChange={(e) => updateItem(index, { unitPrice: e.target.value })} min="0" step="0.01" />
              </label>
              <button type="button" className="icon-button" onClick={() => removeItem(index)} aria-label="حذف بند">
                <Icon name="close" size={16} />
              </button>
            </div>
          ))}
          <button type="button" className="button button-sm" onClick={addItem}><Icon name="plus" size={14} /> إضافة بند</button>
          <div className="inventory-form-row">
            <label className="field">
              <span className="field-label">الضريبة</span>
              <input type="number" value={tax} onChange={(e) => setTax(e.target.value)} min="0" step="0.01" />
            </label>
            <label className="field" style={{ flex: 2 }}>
              <span className="field-label">ملاحظات</span>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </div>
          {createError && <p className="form-error" role="alert">{createError}</p>}
          <div className="inventory-form-actions">
            <button type="submit" className="button button-primary" disabled={createPending}>{createPending ? 'جارٍ الإنشاء…' : 'إنشاء طلب'}</button>
            <button type="button" className="button" onClick={() => { setCreating(false); setItems([ { ...emptyItem } ]); setCreateError(null); }} disabled={createPending}>إلغاء</button>
          </div>
        </form>
      )}
      {loading ? (
        <p className="card-note">جارٍ تحميل الطلبات…</p>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon"><Icon name="invoice" size={26} /></span>
          <p className="empty-title">لا توجد طلبات</p>
          <p className="empty-note">{canWrite ? 'أنشئ أول طلب.' : 'لا تملك صلاحية إنشاء طلبات.'}</p>
        </div>
      ) : (
        <ul className="product-list">
          {orders.map((order) => (
            <li key={order.id} className="product-item">
              <div className="product-head">
                <div className="product-identity">
                  <strong>{order.number}</strong>
                  <span className="tag tag-muted">{order.status}</span>
                  {order.customer && <span className="tag tag-muted">{order.customer.name}</span>}
                </div>
                <div className="product-stock">
                  <span className="tag tag-ok">{Number(order.total).toFixed(2)}</span>
                </div>
                {canWrite && (
                  <div className="product-actions">
                    <select value={order.status} onChange={(e) => handleStatusChange(order, e.target.value)}>
                      <option value="PENDING">PENDING</option>
                      <option value="PAID">PAID</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="product-meta">
                <span>البنود: {order.items.length}</span>
                <span>المجموع الفرعي: {Number(order.subtotal).toFixed(2)}</span>
                {order.notes && <span>{order.notes}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
