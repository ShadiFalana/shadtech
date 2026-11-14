import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { useTenancy } from '../lib/tenancy';
import { Icon } from './Icon';

interface TicketUser {
  id: string;
  fullName: string;
  email: string;
}

interface Ticket {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  type: 'INCIDENT' | 'REQUEST' | 'PROBLEM' | 'CHANGE';
  assigneeId: string | null;
  assignee: TicketUser | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  _count?: { comments: number };
}

interface Comment {
  id: string;
  tenantId: string;
  ticketId: string;
  authorId: string | null;
  body: string;
  internal: boolean;
  createdAt: string;
  author: TicketUser | null;
}

const STATUS_LABELS: Record<Ticket['status'], string> = {
  OPEN: 'مفتوح',
  IN_PROGRESS: 'قيد المعالجة',
  PENDING: 'بانتظار',
  RESOLVED: 'تم الحل',
  CLOSED: 'مغلق',
};

const PRIORITY_LABELS: Record<Ticket['priority'], string> = {
  LOW: 'منخفض',
  MEDIUM: 'متوسط',
  HIGH: 'عالٍ',
  URGENT: 'عاجل',
};

const TYPE_LABELS: Record<Ticket['type'], string> = {
  INCIDENT: 'حادث',
  REQUEST: 'طلب',
  PROBLEM: 'مشكلة',
  CHANGE: 'تغيير',
};

const emptyForm = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  type: 'INCIDENT',
  assigneeId: '',
};

export function TicketsPanel() {
  const { hasPermission } = useTenancy();
  const canRead = hasPermission('tickets.read');
  const canWrite = hasPermission('tickets.write');

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [commentPending, setCommentPending] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canRead) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (search.trim()) params.set('q', search.trim());
      const path = params.toString() ? `/api/v1/tickets?${params.toString()}` : '/api/v1/tickets';
      const data = await apiRequest<Ticket[]>(path);
      setTickets(data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر تحميل التذاكر.');
    } finally {
      setLoading(false);
    }
  }, [canRead, statusFilter, priorityFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailError(null);
    try {
      const [t, c] = await Promise.all([
        apiRequest<Ticket>(`/api/v1/tickets/${id}`),
        apiRequest<Comment[]>(`/api/v1/tickets/${id}/comments`),
      ]);
      setSelected(t);
      setComments(c);
      setSelectedId(id);
    } catch (caught) {
      setDetailError(caught instanceof ApiError ? caught.message : 'تعذر تحميل التذكرة.');
    }
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createPending) {
      return;
    }
    const title = createForm.title.trim();
    if (title.length < 2) {
      setCreateError('عنوان التذكرة يجب أن يكون حرفين على الأقل.');
      return;
    }
    setCreatePending(true);
    setCreateError(null);
    try {
      await apiRequest('/api/v1/tickets', {
        method: 'POST',
        body: {
          title,
          description: createForm.description.trim() || undefined,
          priority: createForm.priority,
          type: createForm.type,
          assigneeId: createForm.assigneeId || undefined,
        },
      });
      setCreateForm(emptyForm);
      setCreating(false);
      await load();
    } catch (caught) {
      setCreateError(caught instanceof ApiError ? caught.message : 'تعذر إنشاء التذكرة.');
    } finally {
      setCreatePending(false);
    }
  }

  async function handleStatusChange(ticket: Ticket, status: Ticket['status']) {
    try {
      await apiRequest(`/api/v1/tickets/${ticket.id}`, { method: 'PATCH', body: { status } });
      await load();
      if (selectedId === ticket.id) {
        await loadDetail(ticket.id);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر تحديث الحالة.');
    }
  }

  async function handleDelete(ticket: Ticket) {
    if (!window.confirm(`حذف التذكرة «${ticket.title}»؟`)) {
      return;
    }
    try {
      await apiRequest(`/api/v1/tickets/${ticket.id}`, { method: 'DELETE' });
      if (selectedId === ticket.id) {
        setSelectedId(null);
        setSelected(null);
        setComments([]);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر حذف التذكرة.');
    }
  }

  async function handleAddComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || commentPending || !commentBody.trim()) {
      return;
    }
    setCommentPending(true);
    try {
      await apiRequest(`/api/v1/tickets/${selectedId}/comments`, {
        method: 'POST',
        body: { body: commentBody.trim() },
      });
      setCommentBody('');
      await loadDetail(selectedId);
    } catch (caught) {
      setDetailError(caught instanceof ApiError ? caught.message : 'تعذر إضافة التعليق.');
    } finally {
      setCommentPending(false);
    }
  }

  if (!canRead) {
    return (
      <section className="card" aria-labelledby="tickets-title">
        <div className="card-head">
          <h3 id="tickets-title">التذاكر والدعم</h3>
        </div>
        <p className="card-note">لا تملك صلاحية عرض التذاكر (tickets.read).</p>
      </section>
    );
  }

  return (
    <section className="card tickets-panel" aria-labelledby="tickets-title">
      <div className="card-head">
        <h3 id="tickets-title">التذاكر والدعم (ITSM)</h3>
        <span className="tag tag-muted">{tickets.length} تذكرة</span>
      </div>

      <div className="ticket-toolbar">
        <label className="field ticket-filter">
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
        <label className="field ticket-filter">
          <span className="field-label">الأولوية</span>
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="">الكل</option>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field ticket-search">
          <span className="field-label">بحث</span>
          <input
            type="search"
            placeholder="عنوان أو وصف…"
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
            <Icon name="plus" size={16} /> تذكرة جديدة
          </button>
        )}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {creating && canWrite && (
        <form className="ticket-form" onSubmit={handleCreate} noValidate>
          <label className="field">
            <span className="field-label">العنوان</span>
            <input
              type="text"
              value={createForm.title}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, title: event.target.value }))
              }
              maxLength={200}
            />
          </label>
          <label className="field">
            <span className="field-label">الوصف</span>
            <textarea
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
              maxLength={5000}
            />
          </label>
          <div className="ticket-form-row">
            <label className="field">
              <span className="field-label">الأولوية</span>
              <select
                value={createForm.priority}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, priority: event.target.value }))
                }
              >
                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">النوع</span>
              <select
                value={createForm.type}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, type: event.target.value }))
                }
              >
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {createError && (
            <p className="form-error" role="alert">
              {createError}
            </p>
          )}
          <div className="ticket-form-actions">
            <button type="submit" className="button button-primary" disabled={createPending}>
              {createPending ? 'جارٍ الإنشاء…' : 'إنشاء تذكرة'}
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
        <p className="card-note">جارٍ تحميل التذاكر…</p>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name="ticket" size={26} />
          </span>
          <p className="empty-title">لا توجد تذاكر</p>
          <p className="empty-note">
            {canWrite ? 'أنشئ أول تذكرة.' : 'لا تملك صلاحية إنشاء تذاكر.'}
          </p>
        </div>
      ) : (
        <div className="ticket-layout">
          <ul className="ticket-list">
            {tickets.map((ticket) => (
              <li
                key={ticket.id}
                className={`ticket-item${selectedId === ticket.id ? ' is-selected' : ''}`}
                onClick={() => loadDetail(ticket.id)}
              >
                <div className="ticket-item-head">
                  <span className={`tag priority-${ticket.priority.toLowerCase()}`}>
                    {PRIORITY_LABELS[ticket.priority]}
                  </span>
                  <span className={`tag status-${ticket.status.toLowerCase().replace('_', '-')}`}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </div>
                <strong className="ticket-title">{ticket.title}</strong>
                <div className="ticket-item-meta">
                  <span>{TYPE_LABELS[ticket.type]}</span>
                  {ticket.assignee && <span>· {ticket.assignee.fullName}</span>}
                  {ticket._count && <span>· {ticket._count.comments} تعليق</span>}
                </div>
              </li>
            ))}
          </ul>

          {selected && (
            <div className="ticket-detail">
              <div className="ticket-detail-head">
                <h4>{selected.title}</h4>
                <div className="ticket-detail-actions">
                  {canWrite && (
                    <select
                      value={selected.status}
                      onChange={(event) =>
                        handleStatusChange(selected, event.target.value as Ticket['status'])
                      }
                    >
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  )}
                  {canWrite && (
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => handleDelete(selected)}
                      aria-label="حذف"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  )}
                </div>
              </div>
              {selected.description && <p className="ticket-description">{selected.description}</p>}
              <div className="ticket-detail-meta">
                <span>الأولوية: {PRIORITY_LABELS[selected.priority]}</span>
                <span>النوع: {TYPE_LABELS[selected.type]}</span>
                {selected.assignee && <span>المسؤول: {selected.assignee.fullName}</span>}
                <span>أُنشئت: {new Date(selected.createdAt).toLocaleString('ar-PS')}</span>
              </div>

              {detailError && (
                <p className="form-error" role="alert">
                  {detailError}
                </p>
              )}

              <div className="ticket-comments">
                <h5>التعليقات</h5>
                {comments.length === 0 ? (
                  <p className="card-note">لا توجد تعليقات.</p>
                ) : (
                  <ul className="comment-list">
                    {comments.map((comment) => (
                      <li key={comment.id} className="comment-item">
                        <div className="comment-head">
                          <strong>{comment.author?.fullName ?? 'نظام'}</strong>
                          <span className="mono">
                            {new Date(comment.createdAt).toLocaleString('ar-PS')}
                          </span>
                          {comment.internal && <span className="tag tag-accent">داخلي</span>}
                        </div>
                        <p className="comment-body">{comment.body}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {canWrite && (
                  <form className="comment-form" onSubmit={handleAddComment} noValidate>
                    <textarea
                      placeholder="أضف تعليقًا…"
                      value={commentBody}
                      onChange={(event) => setCommentBody(event.target.value)}
                      rows={3}
                      maxLength={5000}
                    />
                    <button
                      type="submit"
                      className="button button-primary"
                      disabled={commentPending || !commentBody.trim()}
                    >
                      {commentPending ? 'جارٍ الإرسال…' : 'إرسال'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="card-note">
        التذاكر معزولة داخل المؤسسة. تغيير الحالة إلى "تم الحل"/"مغلق" يسجل الوقت تلقائيًا.
      </p>
    </section>
  );
}
