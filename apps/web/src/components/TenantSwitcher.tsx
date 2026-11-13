import { useState } from 'react';
import { useTenancy } from '../lib/tenancy';
import { CreateTenantForm } from './CreateTenantForm';
import { Icon } from './Icon';

export function TenantSwitcher() {
  const { memberships, activeTenant, switchTenant } = useTenancy();
  const [creating, setCreating] = useState(false);

  if (!activeTenant) {
    return null;
  }

  const multiple = memberships.length > 1;

  return (
    <div className="tenant-switcher">
      <span className="sidebar-label">المؤسسة</span>

      {multiple ? (
        <label className="tenant-select">
          <Icon name="building" size={17} />
          <select
            value={activeTenant.id}
            onChange={(event) => switchTenant(event.target.value)}
            aria-label="اختيار المؤسسة"
          >
            {memberships.map((membership) => (
              <option key={membership.id} value={membership.id}>
                {membership.name} — {membership.role.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="tenant-select is-static">
          <Icon name="building" size={17} />
          <span className="tenant-select-name">{activeTenant.name}</span>
          <span className="tag tag-muted">{activeTenant.role.name}</span>
        </div>
      )}

      {multiple && (
        <span className="tenant-role-hint">
          دورك: <strong>{activeTenant.role.name}</strong>
        </span>
      )}

      {creating ? (
        <div className="tenant-create-panel">
          <CreateTenantForm
            compact
            onCreated={() => setCreating(false)}
            onCancel={() => setCreating(false)}
          />
        </div>
      ) : (
        <button type="button" className="nav-item tenant-add" onClick={() => setCreating(true)}>
          <Icon name="plus" size={17} />
          <span>مؤسسة جديدة</span>
        </button>
      )}
    </div>
  );
}
