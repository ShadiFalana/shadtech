import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { useTenancy } from '../lib/tenancy';
import { Icon } from './Icon';

const SETTING_KEY_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function parseValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return '';
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    // Not valid JSON: store it as a plain string.
    return raw;
  }
}

export function TenantPanel() {
  const { activeTenant, hasPermission, renameActiveTenant } = useTenancy();
  const [name, setName] = useState(activeTenant?.name ?? '');
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameSaved, setRenameSaved] = useState(false);

  const canManage = hasPermission('tenant.manage');
  const canReadSettings = hasPermission('tenant.settings.read');
  const canWriteSettings = hasPermission('tenant.settings.write');

  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingKey, setSettingKey] = useState('');
  const [settingValue, setSettingValue] = useState('');
  const [settingSaving, setSettingSaving] = useState(false);

  const tenantId = activeTenant?.id ?? null;

  useEffect(() => {
    setName(activeTenant?.name ?? '');
    setRenameError(null);
    setRenameSaved(false);
  }, [activeTenant?.id, activeTenant?.name]);

  const loadSettings = useCallback(async () => {
    if (!canReadSettings) {
      return;
    }
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const data = await apiRequest<Record<string, unknown>>('/api/v1/tenants/current/settings');
      setSettings(data);
    } catch (caught) {
      setSettingsError(caught instanceof ApiError ? caught.message : 'تعذر تحميل الإعدادات.');
    } finally {
      setSettingsLoading(false);
    }
  }, [canReadSettings]);

  useEffect(() => {
    setSettings(null);
    void loadSettings();
  }, [tenantId, loadSettings]);

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (renaming) {
      return;
    }
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setRenameError('اسم المؤسسة يجب أن يكون حرفين على الأقل.');
      return;
    }
    setRenaming(true);
    setRenameError(null);
    setRenameSaved(false);
    try {
      await renameActiveTenant(trimmed);
      setRenameSaved(true);
    } catch (caught) {
      setRenameError(caught instanceof ApiError ? caught.message : 'تعذر تحديث الاسم.');
    } finally {
      setRenaming(false);
    }
  }

  async function handleSaveSetting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (settingSaving) {
      return;
    }
    const key = settingKey.trim();
    if (!SETTING_KEY_PATTERN.test(key)) {
      setSettingsError('مفتاح غير صالح: أحرف صغيرة وأرقام ونقاط وشرطات فقط.');
      return;
    }
    setSettingSaving(true);
    setSettingsError(null);
    try {
      await apiRequest(`/api/v1/tenants/current/settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: { value: parseValue(settingValue) },
      });
      setSettingKey('');
      setSettingValue('');
      await loadSettings();
    } catch (caught) {
      setSettingsError(caught instanceof ApiError ? caught.message : 'تعذر حفظ الإعداد.');
    } finally {
      setSettingSaving(false);
    }
  }

  if (!activeTenant) {
    return null;
  }

  const permissions = activeTenant.permissions;
  const isWildcard = permissions.includes('*');
  const settingKeys = settings ? Object.keys(settings).sort() : [];

  return (
    <section className="card tenant-panel" aria-labelledby="tenant-title">
      <div className="card-head">
        <h3 id="tenant-title">المؤسسة الحالية</h3>
        <span className="tag tag-accent">{activeTenant.role.name}</span>
      </div>

      <div className="tenant-identity">
        <span className="tenant-logo" aria-hidden="true">
          <Icon name="building" size={22} />
        </span>
        <div className="tenant-meta">
          <strong>{activeTenant.name}</strong>
          <small dir="ltr">@{activeTenant.slug}</small>
        </div>
        <span className={`tag ${activeTenant.isActive ? 'tag-ok' : 'tag-off'}`}>
          {activeTenant.isActive ? 'نشطة' : 'موقوفة'}
        </span>
      </div>

      {canManage ? (
        <form className="tenant-rename" onSubmit={handleRename} noValidate>
          <label className="field">
            <span className="field-label">اسم المؤسسة</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
            />
          </label>
          <button
            type="submit"
            className="button"
            disabled={renaming || name.trim() === activeTenant.name}
          >
            {renaming ? 'جارٍ الحفظ…' : 'حفظ الاسم'}
          </button>
        </form>
      ) : (
        <p className="card-note">لا تملك صلاحية تعديل بيانات المؤسسة (tenant.manage).</p>
      )}

      {renameError && (
        <p className="form-error" role="alert">
          {renameError}
        </p>
      )}
      {renameSaved && (
        <p className="inline-success" role="status">
          <Icon name="check" size={15} /> تم تحديث اسم المؤسسة.
        </p>
      )}

      <div className="tenant-perms">
        <div className="tenant-perms-head">
          <span className="field-label">الصلاحيات الممنوحة</span>
          <span className="tag tag-muted">
            {isWildcard ? 'كل الصلاحيات' : `${permissions.length} صلاحية`}
          </span>
        </div>
        <ul className="chip-list chip-list-sm">
          {(isWildcard ? ['*'] : permissions).map((permission) => (
            <li key={permission} dir="ltr">
              {permission}
            </li>
          ))}
        </ul>
      </div>

      <div className="tenant-settings">
        <div className="tenant-perms-head">
          <span className="field-label">إعدادات المؤسسة (معزولة)</span>
          {canReadSettings && (
            <button
              type="button"
              className="link-button"
              onClick={() => void loadSettings()}
              disabled={settingsLoading}
            >
              <Icon name="refresh" size={14} /> تحديث
            </button>
          )}
        </div>

        {!canReadSettings ? (
          <p className="card-note">لا تملك صلاحية قراءة الإعدادات (tenant.settings.read).</p>
        ) : settingsLoading && !settings ? (
          <p className="card-note">جارٍ تحميل الإعدادات…</p>
        ) : settingKeys.length === 0 ? (
          <p className="card-note">لا توجد إعدادات بعد.</p>
        ) : (
          <ul className="settings-list">
            {settingKeys.map((key) => (
              <li key={key}>
                <span className="mono settings-key">{key}</span>
                <span className="mono settings-value" dir="ltr">
                  {formatValue(settings?.[key])}
                </span>
              </li>
            ))}
          </ul>
        )}

        {canWriteSettings && (
          <form className="setting-form" onSubmit={handleSaveSetting} noValidate>
            <div className="setting-form-row">
              <label className="field">
                <span className="field-label">المفتاح</span>
                <input
                  type="text"
                  placeholder="feature.flag"
                  value={settingKey}
                  onChange={(event) => setSettingKey(event.target.value)}
                  dir="ltr"
                  maxLength={64}
                />
              </label>
              <label className="field">
                <span className="field-label">القيمة</span>
                <input
                  type="text"
                  placeholder='نص أو JSON مثل {"on": true}'
                  value={settingValue}
                  onChange={(event) => setSettingValue(event.target.value)}
                  dir="ltr"
                />
              </label>
            </div>
            <button type="submit" className="button" disabled={settingSaving}>
              <Icon name="plus" size={15} />
              {settingSaving ? 'جارٍ الحفظ…' : 'حفظ الإعداد'}
            </button>
          </form>
        )}

        {settingsError && (
          <p className="form-error" role="alert">
            {settingsError}
          </p>
        )}

        <p className="card-note">
          هذه الإعدادات خاصة بهذه المؤسسة فقط — تبديل المؤسسة يعرض إعدادات مختلفة.
        </p>
      </div>
    </section>
  );
}
