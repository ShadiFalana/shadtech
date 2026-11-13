import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { useTenancy } from '../lib/tenancy';
import { Icon } from './Icon';

interface Company {
  id: string;
  tenantId: string;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { branches: number };
  branches?: Branch[];
}

interface Branch {
  id: string;
  tenantId: string;
  companyId: string;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CompanyFormState {
  name: string;
  code: string;
}

const emptyForm: CompanyFormState = { name: '', code: '' };

export function CompaniesPanel() {
  const { hasPermission } = useTenancy();
  const canRead = hasPermission('companies.read');
  const canWriteCompanies = hasPermission('companies.write');
  const canReadBranches = hasPermission('branches.read');
  const canWriteBranches = hasPermission('branches.write');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CompanyFormState>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, setCreatePending] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CompanyFormState>(emptyForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, setEditPending] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [branches, setBranches] = useState<Record<string, Branch[]>>({});
  const [branchLoading, setBranchLoading] = useState<string | null>(null);
  const [newBranch, setNewBranch] = useState<Record<string, { name: string; code: string }>>({});
  const [branchError, setBranchError] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    if (!canRead) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<Company[]>('/api/v1/companies');
      setCompanies(data);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر تحميل الشركات.');
    } finally {
      setLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  async function handleCreateCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (createPending) {
      return;
    }
    const name = createForm.name.trim();
    if (name.length < 2) {
      setCreateError('اسم الشركة يجب أن يكون حرفين على الأقل.');
      return;
    }
    setCreatePending(true);
    setCreateError(null);
    try {
      await apiRequest('/api/v1/companies', {
        method: 'POST',
        body: { name, code: createForm.code.trim() || undefined },
      });
      setCreateForm(emptyForm);
      setCreating(false);
      await loadCompanies();
    } catch (caught) {
      setCreateError(caught instanceof ApiError ? caught.message : 'تعذر إنشاء الشركة.');
    } finally {
      setCreatePending(false);
    }
  }

  function startEdit(company: Company) {
    setEditingId(company.id);
    setEditForm({ name: company.name, code: company.code ?? '' });
    setEditError(null);
  }

  async function handleUpdateCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || editPending) {
      return;
    }
    const name = editForm.name.trim();
    if (name.length < 2) {
      setEditError('اسم الشركة يجب أن يكون حرفين على الأقل.');
      return;
    }
    setEditPending(true);
    setEditError(null);
    try {
      await apiRequest(`/api/v1/companies/${editingId}`, {
        method: 'PATCH',
        body: { name, code: editForm.code.trim() || null },
      });
      setEditingId(null);
      await loadCompanies();
    } catch (caught) {
      setEditError(caught instanceof ApiError ? caught.message : 'تعذر تحديث الشركة.');
    } finally {
      setEditPending(false);
    }
  }

  async function handleDeleteCompany(company: Company) {
    if (!window.confirm(`حذف الشركة «${company.name}» وجميع فروعها؟`)) {
      return;
    }
    try {
      await apiRequest(`/api/v1/companies/${company.id}`, { method: 'DELETE' });
      if (expandedId === company.id) {
        setExpandedId(null);
      }
      await loadCompanies();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'تعذر حذف الشركة.');
    }
  }

  async function toggleBranches(company: Company) {
    if (expandedId === company.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(company.id);
    if (!branches[company.id] && canReadBranches) {
      setBranchLoading(company.id);
      try {
        const data = await apiRequest<Branch[]>(`/api/v1/companies/${company.id}/branches`);
        setBranches((prev) => ({ ...prev, [company.id]: data }));
      } catch (caught) {
        setBranchError(caught instanceof ApiError ? caught.message : 'تعذر تحميل الفروع.');
      } finally {
        setBranchLoading(null);
      }
    }
  }

  async function handleCreateBranch(companyId: string) {
    const form = newBranch[companyId] ?? { name: '', code: '' };
    const name = form.name.trim();
    if (name.length < 2) {
      setBranchError('اسم الفرع يجب أن يكون حرفين على الأقل.');
      return;
    }
    setBranchError(null);
    try {
      await apiRequest(`/api/v1/companies/${companyId}/branches`, {
        method: 'POST',
        body: { name, code: form.code.trim() || undefined },
      });
      setNewBranch((prev) => ({ ...prev, [companyId]: { name: '', code: '' } }));
      const data = await apiRequest<Branch[]>(`/api/v1/companies/${companyId}/branches`);
      setBranches((prev) => ({ ...prev, [companyId]: data }));
      await loadCompanies();
    } catch (caught) {
      setBranchError(caught instanceof ApiError ? caught.message : 'تعذر إنشاء الفرع.');
    }
  }

  async function handleDeleteBranch(branch: Branch) {
    if (!window.confirm(`حذف الفرع «${branch.name}»؟`)) {
      return;
    }
    try {
      await apiRequest(`/api/v1/companies/branches/${branch.id}`, { method: 'DELETE' });
      const data = await apiRequest<Branch[]>(`/api/v1/companies/${branch.companyId}/branches`);
      setBranches((prev) => ({ ...prev, [branch.companyId]: data }));
      await loadCompanies();
    } catch (caught) {
      setBranchError(caught instanceof ApiError ? caught.message : 'تعذر حذف الفرع.');
    }
  }

  if (!canRead) {
    return (
      <section className="card" aria-labelledby="companies-title">
        <div className="card-head">
          <h3 id="companies-title">الشركات والفروع</h3>
        </div>
        <p className="card-note">لا تملك صلاحية عرض الشركات (companies.read).</p>
      </section>
    );
  }

  return (
    <section className="card companies-panel" aria-labelledby="companies-title">
      <div className="card-head">
        <h3 id="companies-title">الشركات والفروع</h3>
        <span className="tag tag-muted">{companies.length} شركة</span>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {canWriteCompanies && (
        <div className="company-create">
          {creating ? (
            <form className="company-form" onSubmit={handleCreateCompany} noValidate>
              <div className="company-form-row">
                <label className="field">
                  <span className="field-label">اسم الشركة</span>
                  <input
                    type="text"
                    placeholder="مثال: شركة النور"
                    value={createForm.name}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    maxLength={120}
                  />
                </label>
                <label className="field">
                  <span className="field-label">الرمز (اختياري)</span>
                  <input
                    type="text"
                    placeholder="NOOR"
                    value={createForm.code}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, code: event.target.value }))
                    }
                    maxLength={40}
                    dir="ltr"
                  />
                </label>
              </div>
              {createError && (
                <p className="form-error" role="alert">
                  {createError}
                </p>
              )}
              <div className="company-form-actions">
                <button type="submit" className="button button-primary" disabled={createPending}>
                  {createPending ? 'جارٍ الإنشاء…' : 'إنشاء شركة'}
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
          ) : (
            <button type="button" className="button" onClick={() => setCreating(true)}>
              <Icon name="plus" size={16} /> شركة جديدة
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="card-note">جارٍ تحميل الشركات…</p>
      ) : companies.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Icon name="building" size={26} />
          </span>
          <p className="empty-title">لا توجد شركات بعد</p>
          <p className="empty-note">
            {canWriteCompanies ? 'أنشئ أول شركة لبدء تنظيم الفروع.' : 'لا تملك صلاحية إنشاء شركات.'}
          </p>
        </div>
      ) : (
        <ul className="company-list">
          {companies.map((company) => (
            <li key={company.id} className="company-item">
              {editingId === company.id ? (
                <form className="company-edit" onSubmit={handleUpdateCompany} noValidate>
                  <div className="company-form-row">
                    <label className="field">
                      <span className="field-label">اسم الشركة</span>
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
                      <span className="field-label">الرمز</span>
                      <input
                        type="text"
                        value={editForm.code}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, code: event.target.value }))
                        }
                        maxLength={40}
                        dir="ltr"
                      />
                    </label>
                  </div>
                  {editError && (
                    <p className="form-error" role="alert">
                      {editError}
                    </p>
                  )}
                  <div className="company-form-actions">
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
                  <div className="company-head">
                    <button
                      type="button"
                      className="company-toggle"
                      onClick={() => toggleBranches(company)}
                      aria-expanded={expandedId === company.id}
                    >
                      <Icon name="building" size={18} />
                      <span className="company-name">{company.name}</span>
                      {company.code && (
                        <span className="tag tag-muted" dir="ltr">
                          {company.code}
                        </span>
                      )}
                      <span className="tag tag-accent">{company._count?.branches ?? 0} فرع</span>
                      <Icon name={expandedId === company.id ? 'close' : 'plus'} size={14} />
                    </button>
                    {canWriteCompanies && (
                      <div className="company-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => startEdit(company)}
                          aria-label="تعديل"
                        >
                          <Icon name="pencil" size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => handleDeleteCompany(company)}
                          aria-label="حذف"
                        >
                          <Icon name="close" size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {expandedId === company.id && (
                    <div className="branch-panel">
                      {branchLoading === company.id ? (
                        <p className="card-note">جارٍ تحميل الفروع…</p>
                      ) : (
                        <>
                          {branchError && (
                            <p className="form-error" role="alert">
                              {branchError}
                            </p>
                          )}
                          {(branches[company.id] ?? []).length === 0 ? (
                            <p className="card-note">لا توجد فروع لهذه الشركة.</p>
                          ) : (
                            <ul className="branch-list">
                              {(branches[company.id] ?? []).map((branch) => (
                                <li key={branch.id} className="branch-item">
                                  <span className="branch-name">{branch.name}</span>
                                  {branch.code && (
                                    <span className="tag tag-muted" dir="ltr">
                                      {branch.code}
                                    </span>
                                  )}
                                  {canWriteBranches && (
                                    <button
                                      type="button"
                                      className="icon-button"
                                      onClick={() => handleDeleteBranch(branch)}
                                      aria-label="حذف الفرع"
                                    >
                                      <Icon name="close" size={14} />
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}

                          {canWriteBranches && canReadBranches && (
                            <div className="branch-create">
                              <input
                                type="text"
                                placeholder="اسم الفرع"
                                value={newBranch[company.id]?.name ?? ''}
                                onChange={(event) =>
                                  setNewBranch((prev) => ({
                                    ...prev,
                                    [company.id]: {
                                      name: event.target.value,
                                      code: prev[company.id]?.code ?? '',
                                    },
                                  }))
                                }
                                maxLength={120}
                              />
                              <input
                                type="text"
                                placeholder="رمز"
                                value={newBranch[company.id]?.code ?? ''}
                                onChange={(event) =>
                                  setNewBranch((prev) => ({
                                    ...prev,
                                    [company.id]: {
                                      name: prev[company.id]?.name ?? '',
                                      code: event.target.value,
                                    },
                                  }))
                                }
                                maxLength={40}
                                dir="ltr"
                              />
                              <button
                                type="button"
                                className="button"
                                onClick={() => handleCreateBranch(company.id)}
                              >
                                <Icon name="plus" size={14} /> إضافة فرع
                              </button>
                            </div>
                          )}
                          {!canReadBranches && (
                            <p className="card-note">لا تملك صلاحية عرض الفروع (branches.read).</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="card-note">
        كل شركة وفرع معزولان داخل المؤسسة الحالية. حذف شركة يحذف جميع فروعها.
      </p>
    </section>
  );
}
