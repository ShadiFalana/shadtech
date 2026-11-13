import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { useTenancy } from '../lib/tenancy';
import { Icon } from './Icon';

interface AuditUser {
  id: string;
  email: string;
  fullName: string;
}

interface AuditEntry {
  id: string;
  tenantId: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: AuditUser | null;
}

export function AuditPanel() {
  const { hasPermission } = useTenancy();
  const canRead = hasPermission('audit.read');

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resourceFilter, setResourceFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const load = useCallback(async () => {
    if (!canRead) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (resourceFilter.trim()) params.set('resource', resourceFilter.trim());
      if (actionFilter.trim()) params.set('action', actionFilter.trim());
      params.set('limit', '100');
      const path = `/api/v1/audit?${params.toString()}`;
      const data = await apiRequest<AuditEntry[]>(path);
      setEntries(data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر تحميل سجل التدقيق.');
    } finally {
      setLoading(false);
    }
  }, [canRead, resourceFilter, actionFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canRead) {
    return (
      <section className="card" aria-labelledby="audit-title">
        <div className="card-head">
          <h3 id="audit-title">سجل التدقيق</h3>
        </div>
        <p className="card-note">لا تملك صلاحية عرض سجل التدقيق (audit.read).</p>
      </section>
    );
  }

  return (
    <section className="card audit-panel" aria-labelledby="audit-title">
      <div className="card-head">
        <h3 id="audit-title">سجل التدقيق</h3>
        <span className="tag tag-muted">{entries.length} حدث</span>
      </div>

      <div className="audit-toolbar">
        <label className="field audit-filter">
          <span className="field-label">المورد</span>
          <input
            type="text"
            placeholder="company, member, customer…"
            value={resourceFilter}
            onChange={(event) => setResourceFilter(event.target.value)}
            dir="ltr"
          />
        </label>
        <label className="field audit-filter">
          <span className="field-label">الإجراء</span>
          <input
            type="text"
            placeholder="created, deleted…"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            dir="ltr"
          />
        </label>
        <button type="button" className="button" onClick={() => void load()}>
          <Icon name="refresh" size={14} /> تحديث
        </button>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="card-note">جارٍ تحميل السجل…</p>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name="chart" size={26} />
          </span>
          <p className="empty-title">لا توجد أحداث</p>
          <p className="empty-note">ستظهر هنا العمليات الحساسة بعد تنفيذها.</p>
        </div>
      ) : (
        <ul className="audit-list">
          {entries.map((entry) => (
            <li key={entry.id} className="audit-item">
              <div className="audit-main">
                <span className="audit-action">{entry.action}</span>
                <span className="audit-resource">
                  {entry.resource}
                  {entry.resourceId && (
                    <span className="mono audit-id"> · {entry.resourceId.slice(0, 8)}</span>
                  )}
                </span>
              </div>
              <div className="audit-meta">
                <span>{entry.user ? entry.user.fullName : 'نظام'}</span>
                <span className="mono">{new Date(entry.createdAt).toLocaleString('ar-PS')}</span>
              </div>
              {entry.metadata != null && (
                <pre className="audit-metadata">{JSON.stringify(entry.metadata, null, 2)}</pre>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="card-note">سجل التدقيق للقراءة فقط. الأحداث حساسة ولا يمكن تعديلها أو حذفها.</p>
    </section>
  );
}
