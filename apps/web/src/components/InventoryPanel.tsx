import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { useTenancy } from '../lib/tenancy';
import { Icon } from './Icon';

interface Product {
  id: string;
  tenantId: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string | null;
  price: number;
  quantity: number;
  minQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  name: '',
  sku: '',
  category: '',
  unit: '',
  price: '',
  quantity: '',
  minQuantity: '',
};

export function InventoryPanel() {
  const { hasPermission } = useTenancy();
  const canRead = hasPermission('inventory.read');
  const canWrite = hasPermission('inventory.write');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  const [movementFor, setMovementFor] = useState<string | null>(null);
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN');
  const [movementQty, setMovementQty] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [movementPending, setMovementPending] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);
    try {
      const path = search.trim()
        ? `/api/v1/inventory/products?q=${encodeURIComponent(search.trim())}`
        : '/api/v1/inventory/products';
      const data = await apiRequest<Product[]>(path);
      setProducts(data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر تحميل المخزون.');
    } finally {
      setLoading(false);
    }
  }, [canRead, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createPending) return;
    const name = createForm.name.trim();
    if (name.length < 2) {
      setCreateError('اسم الصنف يجب أن يكون حرفين على الأقل.');
      return;
    }
    setCreatePending(true);
    setCreateError(null);
    try {
      await apiRequest('/api/v1/inventory/products', {
        method: 'POST',
        body: {
          name,
          sku: createForm.sku.trim() || undefined,
          category: createForm.category.trim() || undefined,
          unit: createForm.unit.trim() || undefined,
          price: createForm.price ? Number(createForm.price) : undefined,
          quantity: createForm.quantity ? Number(createForm.quantity) : undefined,
          minQuantity: createForm.minQuantity ? Number(createForm.minQuantity) : undefined,
        },
      });
      setCreateForm(emptyForm);
      setCreating(false);
      await load();
    } catch (caught) {
      setCreateError(caught instanceof ApiError ? caught.message : 'تعذر إنشاء الصنف.');
    } finally {
      setCreatePending(false);
    }
  }

  async function handleMovement(productId: string) {
    const qty = Number(movementQty);
    if (!qty || qty < 0) {
      setMovementError('الكمية غير صالحة.');
      return;
    }
    setMovementPending(true);
    setMovementError(null);
    try {
      await apiRequest(`/api/v1/inventory/products/${productId}/movements`, {
        method: 'POST',
        body: { type: movementType, quantity: qty, reason: movementReason.trim() || undefined },
      });
      setMovementFor(null);
      setMovementQty('');
      setMovementReason('');
      await load();
    } catch (caught) {
      setMovementError(caught instanceof ApiError ? caught.message : 'تعذر تسجيل الحركة.');
    } finally {
      setMovementPending(false);
    }
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`حذف الصنف «${product.name}»؟`)) return;
    try {
      await apiRequest(`/api/v1/inventory/products/${product.id}`, { method: 'DELETE' });
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر حذف الصنف.');
    }
  }

  if (!canRead) {
    return (
      <section className="card" aria-labelledby="inventory-title">
        <div className="card-head">
          <h3 id="inventory-title">المخزون</h3>
        </div>
        <p className="card-note">لا تملك صلاحية عرض المخزون (inventory.read).</p>
      </section>
    );
  }

  return (
    <section className="card inventory-panel" aria-labelledby="inventory-title">
      <div className="card-head">
        <h3 id="inventory-title">المخزون</h3>
        <span className="tag tag-muted">{products.length} صنف</span>
      </div>

      <div className="inventory-toolbar">
        <label className="field inventory-search">
          <span className="field-label">بحث</span>
          <input
            type="search"
            placeholder="اسم، SKU، فئة…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
            <Icon name="plus" size={16} /> صنف جديد
          </button>
        )}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {creating && canWrite && (
        <form className="inventory-form" onSubmit={handleCreate} noValidate>
          <div className="inventory-form-row">
            <label className="field">
              <span className="field-label">اسم الصنف</span>
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
              <span className="field-label">SKU</span>
              <input
                type="text"
                value={createForm.sku}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, sku: event.target.value }))
                }
                dir="ltr"
              />
            </label>
          </div>
          <div className="inventory-form-row">
            <label className="field">
              <span className="field-label">الفئة</span>
              <input
                type="text"
                value={createForm.category}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, category: event.target.value }))
                }
              />
            </label>
            <label className="field">
              <span className="field-label">الوحدة</span>
              <input
                type="text"
                value={createForm.unit}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, unit: event.target.value }))
                }
              />
            </label>
          </div>
          <div className="inventory-form-row">
            <label className="field">
              <span className="field-label">السعر</span>
              <input
                type="number"
                value={createForm.price}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, price: event.target.value }))
                }
                min="0"
                step="0.01"
              />
            </label>
            <label className="field">
              <span className="field-label">الكمية الأولية</span>
              <input
                type="number"
                value={createForm.quantity}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, quantity: event.target.value }))
                }
                min="0"
                step="0.01"
              />
            </label>
            <label className="field">
              <span className="field-label">الحد الأدنى</span>
              <input
                type="number"
                value={createForm.minQuantity}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, minQuantity: event.target.value }))
                }
                min="0"
                step="0.01"
              />
            </label>
          </div>
          {createError && (
            <p className="form-error" role="alert">
              {createError}
            </p>
          )}
          <div className="inventory-form-actions">
            <button type="submit" className="button button-primary" disabled={createPending}>
              {createPending ? 'جارٍ الإنشاء…' : 'إنشاء صنف'}
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
        <p className="card-note">جارٍ تحميل المخزون…</p>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name="box" size={26} />
          </span>
          <p className="empty-title">لا توجد أصناف</p>
          <p className="empty-note">{canWrite ? 'أضف أول صنف.' : 'لا تملك صلاحية إضافة أصناف.'}</p>
        </div>
      ) : (
        <ul className="product-list">
          {products.map((product) => {
            const low =
              Number(product.quantity) <= Number(product.minQuantity) &&
              Number(product.minQuantity) > 0;
            return (
              <li key={product.id} className="product-item">
                <div className="product-head">
                  <div className="product-identity">
                    <strong>{product.name}</strong>
                    {product.sku && (
                      <span className="tag tag-muted" dir="ltr">
                        {product.sku}
                      </span>
                    )}
                    {product.category && <span className="tag tag-muted">{product.category}</span>}
                  </div>
                  <div className="product-stock">
                    <span className={`tag ${low ? 'tag-off' : 'tag-ok'}`}>
                      {Number(product.quantity)} {product.unit ?? ''}
                    </span>
                    {low && <span className="tag tag-off">منخفض</span>}
                  </div>
                  {canWrite && (
                    <div className="product-actions">
                      <button
                        type="button"
                        className="button button-sm"
                        onClick={() =>
                          setMovementFor(movementFor === product.id ? null : product.id)
                        }
                      >
                        حركة
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleDelete(product)}
                        aria-label="حذف"
                      >
                        <Icon name="close" size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="product-meta">
                  <span>السعر: {Number(product.price).toFixed(2)}</span>
                  <span>الحد الأدنى: {Number(product.minQuantity)}</span>
                </div>
                {movementFor === product.id && canWrite && (
                  <div className="movement-panel">
                    <select
                      value={movementType}
                      onChange={(event) =>
                        setMovementType(event.target.value as 'IN' | 'OUT' | 'ADJUST')
                      }
                    >
                      <option value="IN">إدخال</option>
                      <option value="OUT">إخراج</option>
                      <option value="ADJUST">تسوية</option>
                    </select>
                    <input
                      type="number"
                      placeholder="الكمية"
                      value={movementQty}
                      onChange={(event) => setMovementQty(event.target.value)}
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="text"
                      placeholder="السبب (اختياري)"
                      value={movementReason}
                      onChange={(event) => setMovementReason(event.target.value)}
                    />
                    <button
                      type="button"
                      className="button button-primary button-sm"
                      onClick={() => handleMovement(product.id)}
                      disabled={movementPending}
                    >
                      {movementPending ? 'جارٍ…' : 'تسجيل'}
                    </button>
                    <button
                      type="button"
                      className="button button-sm"
                      onClick={() => {
                        setMovementFor(null);
                        setMovementQty('');
                        setMovementReason('');
                        setMovementError(null);
                      }}
                    >
                      إلغاء
                    </button>
                    {movementError && <p className="form-error">{movementError}</p>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="card-note">
        المخزون معزول داخل المؤسسة. حركات IN/OUT/ADJUST تُحدّث الكمية تلقائيًا. تنبيه "منخفض" عند ≤
        الحد الأدنى.
      </p>
    </section>
  );
}
