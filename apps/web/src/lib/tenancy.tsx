import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, apiRequest, setTenantIdResolver } from './api';
import { useAuth } from './auth';

export interface TenantRole {
  key: string;
  name: string;
}

/** A tenant the signed-in user belongs to, with their effective role. */
export interface TenantMembership {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  role: TenantRole;
  permissions: string[];
}

export interface CreateTenantInput {
  name: string;
  slug?: string;
}

export type TenancyStatus = 'idle' | 'loading' | 'ready' | 'error';

interface TenancyContextValue {
  status: TenancyStatus;
  error: string | null;
  memberships: TenantMembership[];
  activeTenant: TenantMembership | null;
  /** True when the active role grants the permission (owner `*` grants all). */
  hasPermission: (permission: string) => boolean;
  switchTenant: (tenantId: string) => void;
  refresh: () => Promise<void>;
  createTenant: (input: CreateTenantInput) => Promise<TenantMembership>;
  renameActiveTenant: (name: string) => Promise<void>;
}

const STORAGE_KEY = 'shadtech.activeTenantId';

const TenancyContext = createContext<TenancyContextValue | null>(null);

function describeTenancyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'انتهت الجلسة. يرجى تسجيل الدخول من جديد.';
    }
    if (error.status === 403) {
      return 'لا تملك صلاحية الوصول إلى هذه المؤسسة.';
    }
    return error.message;
  }
  if (error instanceof TypeError) {
    return 'تعذر الاتصال بالخدمة. تأكد من تشغيل الخادم.';
  }
  return 'حدث خطأ غير متوقع أثناء تحميل مساحات العمل.';
}

export function TenancyProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<TenancyStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      // `mine` is user-scoped, so no tenant header is sent.
      const list = await apiRequest<TenantMembership[]>('/api/v1/tenants/mine', { tenant: false });
      setMemberships(list);
      setStatus('ready');
    } catch (caught) {
      setError(describeTenancyError(caught));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void load();
    } else if (authStatus === 'guest') {
      setMemberships([]);
      setStatus('idle');
      setError(null);
    }
  }, [authStatus, load]);

  const activeTenant = useMemo<TenantMembership | null>(() => {
    if (memberships.length === 0) {
      return null;
    }
    return memberships.find((membership) => membership.id === activeId) ?? memberships[0] ?? null;
  }, [memberships, activeId]);

  // Keep the latest active tenant readable by the API layer during render, so
  // requests made from child effects always carry the correct tenant header.
  const activeTenantRef = useRef<TenantMembership | null>(activeTenant);
  activeTenantRef.current = activeTenant;

  useEffect(() => {
    setTenantIdResolver(() => activeTenantRef.current?.id ?? null);
    return () => setTenantIdResolver(null);
  }, []);

  // Persist the selection so a reload returns to the same tenant.
  useEffect(() => {
    if (activeTenant) {
      try {
        window.localStorage.setItem(STORAGE_KEY, activeTenant.id);
      } catch {
        // Storage may be unavailable; the in-memory selection still works.
      }
    }
  }, [activeTenant]);

  const switchTenant = useCallback((tenantId: string) => {
    setActiveId(tenantId);
  }, []);

  const createTenant = useCallback(async (input: CreateTenantInput) => {
    const created = await apiRequest<TenantMembership>('/api/v1/tenants', {
      method: 'POST',
      body: { name: input.name.trim(), slug: input.slug?.trim() || undefined },
      tenant: false,
    });
    setMemberships((previous) => [...previous, created]);
    setActiveId(created.id);
    return created;
  }, []);

  const renameActiveTenant = useCallback(
    async (name: string) => {
      if (!activeTenant) {
        return;
      }
      const updated = await apiRequest<{ id: string; slug: string; name: string }>(
        '/api/v1/tenants/current',
        { method: 'PATCH', body: { name: name.trim() } },
      );
      setMemberships((previous) =>
        previous.map((membership) =>
          membership.id === updated.id ? { ...membership, name: updated.name } : membership,
        ),
      );
    },
    [activeTenant],
  );

  const hasPermission = useCallback(
    (permission: string) => {
      const granted = activeTenant?.permissions ?? [];
      return granted.includes('*') || granted.includes(permission);
    },
    [activeTenant],
  );

  const value = useMemo<TenancyContextValue>(
    () => ({
      status,
      error,
      memberships,
      activeTenant,
      hasPermission,
      switchTenant,
      refresh: load,
      createTenant,
      renameActiveTenant,
    }),
    [
      status,
      error,
      memberships,
      activeTenant,
      hasPermission,
      switchTenant,
      load,
      createTenant,
      renameActiveTenant,
    ],
  );

  return <TenancyContext.Provider value={value}>{children}</TenancyContext.Provider>;
}

export function useTenancy(): TenancyContextValue {
  const context = useContext(TenancyContext);
  if (!context) {
    throw new Error('useTenancy must be used inside TenancyProvider');
  }
  return context;
}
