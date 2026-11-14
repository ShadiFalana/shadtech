import { useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useTenancy } from '../lib/tenancy';
import { Icon } from './Icon';
import { ThemeToggle } from './ThemeToggle';

export function SettingsPanel() {
  const { user, login } = useAuth();
  const { hasPermission } = useTenancy();
  const canManageTenant = hasPermission('tenant.manage');
  const canReadSettings = hasPermission('tenant.settings.read');
  const canWriteSettings = hasPermission('tenant.settings.write');

  // Profile
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [profilePending, setProfilePending] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  async function handleProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profilePending) {
      return;
    }
    const name = fullName.trim();
    if (name.length < 2) {
      setProfileError('الاسم يجب أن يكون حرفين على الأقل.');
      return;
    }
    setProfilePending(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await apiRequest('/api/v1/auth/me', { method: 'PATCH', body: { fullName: name } });
      setProfileSuccess('تم تحديث الملف الشخصي.');
    } catch (caught) {
      setProfileError(caught instanceof ApiError ? caught.message : 'تعذر تحديث الملف الشخصي.');
    } finally {
      setProfilePending(false);
    }
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordPending) {
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين.');
      return;
    }
    setPasswordPending(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      await apiRequest('/api/v1/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
      setPasswordSuccess('تم تغيير كلمة المرور.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (caught) {
      setPasswordError(caught instanceof ApiError ? caught.message : 'تعذر تغيير كلمة المرور.');
    } finally {
      setPasswordPending(false);
    }
  }

  return (
    <section className="card settings-panel" aria-labelledby="settings-title">
      <div className="card-head">
        <h3 id="settings-title">الإعدادات</h3>
      </div>

      {/* Theme */}
      <div className="settings-section">
        <div className="settings-section-head">
          <Icon name="spark" size={18} />
          <h4>المظهر</h4>
        </div>
        <div className="settings-row">
          <span>الوضع (فاتح/داكن)</span>
          <ThemeToggle />
        </div>
      </div>

      {/* Profile */}
      <div className="settings-section">
        <div className="settings-section-head">
          <Icon name="users" size={18} />
          <h4>الملف الشخصي</h4>
        </div>
        <form className="settings-form" onSubmit={handleProfile} noValidate>
          <label className="field">
            <span className="field-label">الاسم الكامل</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              maxLength={120}
            />
          </label>
          <label className="field">
            <span className="field-label">البريد الإلكتروني</span>
            <input type="email" value={user?.email ?? ''} disabled dir="ltr" />
          </label>
          {profileError && (
            <p className="form-error" role="alert">
              {profileError}
            </p>
          )}
          {profileSuccess && (
            <p className="inline-success" role="status">
              <Icon name="check" size={15} /> {profileSuccess}
            </p>
          )}
          <button type="submit" className="button button-primary" disabled={profilePending}>
            {profilePending ? 'جارٍ الحفظ…' : 'حفظ الملف الشخصي'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="settings-section">
        <div className="settings-section-head">
          <Icon name="shield" size={18} />
          <h4>تغيير كلمة المرور</h4>
        </div>
        <form className="settings-form" onSubmit={handlePassword} noValidate>
          <label className="field">
            <span className="field-label">كلمة المرور الحالية</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label className="field">
            <span className="field-label">كلمة المرور الجديدة</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="field">
            <span className="field-label">تأكيد كلمة المرور</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
          </label>
          {passwordError && (
            <p className="form-error" role="alert">
              {passwordError}
            </p>
          )}
          {passwordSuccess && (
            <p className="inline-success" role="status">
              <Icon name="check" size={15} /> {passwordSuccess}
            </p>
          )}
          <button type="submit" className="button button-primary" disabled={passwordPending}>
            {passwordPending ? 'جارٍ التغيير…' : 'تغيير كلمة المرور'}
          </button>
        </form>
      </div>

      {/* Tenant settings note */}
      <div className="settings-section">
        <div className="settings-section-head">
          <Icon name="building" size={18} />
          <h4>المؤسسة</h4>
        </div>
        <p className="card-note">
          {canManageTenant
            ? 'يمكنك تعديل اسم المؤسسة وإعداداتها من بطاقة "المؤسسة الحالية" أعلاه.'
            : 'لا تملك صلاحية تعديل بيانات المؤسسة.'}
        </p>
        {canReadSettings && (
          <p className="card-note">
            الإعدادات (locale, timezone, …) مُدارة في بطاقة المؤسسة.{' '}
            {canWriteSettings ? 'لديك صلاحية تعديلها.' : 'لديك صلاحية قراءتها فقط.'}
          </p>
        )}
      </div>

      <p className="card-note">
        الملف الشخصي (الاسم/كلمة المرور) خاص بك. إعدادات المؤسسة تتبع المؤسسة الحالية.
      </p>
    </section>
  );
}
