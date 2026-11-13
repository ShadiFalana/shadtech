import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useTenancy } from '../lib/tenancy';
import { Icon } from './Icon';

interface MemberUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface MemberRole {
  id: string;
  key: string;
  name: string;
}

interface Member {
  id: string;
  userId: string;
  tenantId: string;
  roleId: string;
  isActive: boolean;
  createdAt: string;
  user: MemberUser;
  role: MemberRole;
}

interface RoleOption {
  id: string;
  key: string;
  name: string;
  description: string;
}

const emptyAdd = { email: '', fullName: '', password: '', roleKey: 'viewer' };

export function MembersPanel() {
  const { user: me } = useAuth();
  const { hasPermission } = useTenancy();
  const canRead = hasPermission('members.read');
  const canManage = hasPermission('members.manage');

  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState(emptyAdd);
  const [addError, setAddError] = useState<string | null>(null);
  const [addPending, setAddPending] = useState(false);

  const [rolePending, setRolePending] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetPending, setResetPending] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const [removeError, setRemoveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canRead) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [m, r] = await Promise.all([
        apiRequest<Member[]>('/api/v1/members'),
        apiRequest<RoleOption[]>('/api/v1/roles'),
      ]);
      setMembers(m);
      setRoles(r);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر تحميل الأعضاء.');
    } finally {
      setLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (addPending) {
      return;
    }
    const email = addForm.email.trim();
    const fullName = addForm.fullName.trim();
    if (!email || !fullName || addForm.password.length < 8) {
      setAddError('يرجى إكمال جميع الحقول (كلمة مرور 8 أحرف على الأقل).');
      return;
    }
    setAddPending(true);
    setAddError(null);
    try {
      await apiRequest('/api/v1/members', {
        method: 'POST',
        body: {
          email,
          fullName,
          password: addForm.password,
          roleKey: addForm.roleKey,
        },
      });
      setAddForm(emptyAdd);
      setAdding(false);
      await load();
    } catch (caught) {
      setAddError(caught instanceof ApiError ? caught.message : 'تعذر إضافة العضو.');
    } finally {
      setAddPending(false);
    }
  }

  async function handleChangeRole(member: Member, roleKey: string) {
    if (rolePending) {
      return;
    }
    setRolePending(member.id);
    setRoleError(null);
    try {
      await apiRequest(`/api/v1/members/${member.id}/role`, {
        method: 'PATCH',
        body: { roleKey },
      });
      await load();
    } catch (caught) {
      setRoleError(caught instanceof ApiError ? caught.message : 'تعذر تغيير الدور.');
    } finally {
      setRolePending(null);
    }
  }

  async function handleRemove(member: Member) {
    if (!window.confirm(`إزالة العضو «${member.user.fullName}» من المؤسسة؟`)) {
      return;
    }
    setRemoveError(null);
    try {
      await apiRequest(`/api/v1/members/${member.id}`, { method: 'DELETE' });
      await load();
    } catch (caught) {
      setRemoveError(caught instanceof ApiError ? caught.message : 'تعذر إزالة العضو.');
    }
  }

  async function handleResetPassword(member: Member) {
    if (resetPassword.length < 8) {
      setResetError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
      return;
    }
    setResetPending(true);
    setResetError(null);
    setResetSuccess(null);
    try {
      await apiRequest(`/api/v1/members/${member.id}/reset-password`, {
        method: 'POST',
        body: { newPassword: resetPassword },
      });
      setResetSuccess(`تم تعيين كلمة مرور جديدة لـ ${member.user.fullName}.`);
      setResettingId(null);
      setResetPassword('');
    } catch (caught) {
      setResetError(caught instanceof ApiError ? caught.message : 'تعذر تعيين كلمة المرور.');
    } finally {
      setResetPending(false);
    }
  }

  if (!canRead) {
    return (
      <section className="card" aria-labelledby="members-title">
        <div className="card-head">
          <h3 id="members-title">المستخدمون</h3>
        </div>
        <p className="card-note">لا تملك صلاحية عرض الأعضاء (members.read).</p>
      </section>
    );
  }

  return (
    <section className="card members-panel" aria-labelledby="members-title">
      <div className="card-head">
        <h3 id="members-title">المستخدمون</h3>
        <span className="tag tag-muted">{members.length} عضو</span>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {removeError && (
        <p className="form-error" role="alert">
          {removeError}
        </p>
      )}
      {roleError && (
        <p className="form-error" role="alert">
          {roleError}
        </p>
      )}

      {canManage && (
        <div className="member-create">
          {adding ? (
            <form className="member-form" onSubmit={handleAdd} noValidate>
              <div className="member-form-row">
                <label className="field">
                  <span className="field-label">البريد الإلكتروني</span>
                  <input
                    type="email"
                    placeholder="name@company.ps"
                    value={addForm.email}
                    onChange={(event) =>
                      setAddForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    dir="ltr"
                  />
                </label>
                <label className="field">
                  <span className="field-label">الاسم الكامل</span>
                  <input
                    type="text"
                    placeholder="مثال: أحمد"
                    value={addForm.fullName}
                    onChange={(event) =>
                      setAddForm((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    maxLength={120}
                  />
                </label>
              </div>
              <div className="member-form-row">
                <label className="field">
                  <span className="field-label">كلمة المرور (مؤقتة)</span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={addForm.password}
                    onChange={(event) =>
                      setAddForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span className="field-label">الدور</span>
                  <select
                    value={addForm.roleKey}
                    onChange={(event) =>
                      setAddForm((prev) => ({ ...prev, roleKey: event.target.value }))
                    }
                  >
                    {roles.map((role) => (
                      <option key={role.key} value={role.key}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {addError && (
                <p className="form-error" role="alert">
                  {addError}
                </p>
              )}
              <div className="member-form-actions">
                <button type="submit" className="button button-primary" disabled={addPending}>
                  {addPending ? 'جارٍ الإضافة…' : 'إضافة عضو'}
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setAdding(false);
                    setAddForm(emptyAdd);
                    setAddError(null);
                  }}
                  disabled={addPending}
                >
                  إلغاء
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className="button" onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} /> عضو جديد
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="card-note">جارٍ تحميل الأعضاء…</p>
      ) : members.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">لا يوجد أعضاء</p>
        </div>
      ) : (
        <ul className="member-list">
          {members.map((member) => {
            const isSelf = me?.id === member.user.id;
            return (
              <li key={member.id} className="member-item">
                <div className="member-identity">
                  <span className="avatar avatar-sm" aria-hidden="true">
                    {(member.user.fullName.trim() || member.user.email).slice(0, 1).toUpperCase()}
                  </span>
                  <div className="member-meta">
                    <strong>{member.user.fullName}</strong>
                    <small dir="ltr">{member.user.email}</small>
                  </div>
                  {isSelf && <span className="tag tag-accent">أنت</span>}
                </div>

                <div className="member-role">
                  {canManage && !isSelf ? (
                    <select
                      value={member.role.key}
                      disabled={rolePending === member.id}
                      onChange={(event) => handleChangeRole(member, event.target.value)}
                      aria-label="تغيير الدور"
                    >
                      {roles.map((role) => (
                        <option key={role.key} value={role.key}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="tag tag-muted">{member.role.name}</span>
                  )}
                </div>

                {canManage && (
                  <div className="member-actions">
                    <button
                      type="button"
                      className="button button-sm"
                      onClick={() => {
                        setResettingId(resettingId === member.id ? null : member.id);
                        setResetPassword('');
                        setResetError(null);
                        setResetSuccess(null);
                      }}
                    >
                      <Icon name="shield" size={14} /> كلمة مرور
                    </button>
                    {!isSelf && (
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleRemove(member)}
                        aria-label="إزالة"
                      >
                        <Icon name="close" size={16} />
                      </button>
                    )}
                  </div>
                )}

                {resettingId === member.id && (
                  <div className="reset-panel">
                    <input
                      type="password"
                      placeholder="كلمة مرور جديدة"
                      value={resetPassword}
                      onChange={(event) => setResetPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="button button-primary button-sm"
                      onClick={() => handleResetPassword(member)}
                      disabled={resetPending}
                    >
                      {resetPending ? 'جارٍ…' : 'تعيين'}
                    </button>
                    <button
                      type="button"
                      className="button button-sm"
                      onClick={() => {
                        setResettingId(null);
                        setResetPassword('');
                        setResetError(null);
                      }}
                    >
                      إلغاء
                    </button>
                    {resetError && <p className="form-error">{resetError}</p>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {resetSuccess && (
        <p className="inline-success" role="status">
          <Icon name="check" size={15} /> {resetSuccess}
        </p>
      )}

      <p className="card-note">
        إدارة الأعضاء تتطلب صلاحية members.manage. لا يمكنك إزالة نفسك أو تغيير دورك.
      </p>
    </section>
  );
}
