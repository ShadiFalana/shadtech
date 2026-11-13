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
import { apiRequest, getAccessToken, setAccessToken, setAuthBridge } from './api';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export type AuthStatus = 'loading' | 'guest' | 'authenticated';

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Whether the platform already has an account (drives bootstrap registration). */
  initialized: boolean | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Refresh a little before the 15-minute access token expires. */
const REFRESH_INTERVAL_MS = 12 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const booted = useRef(false);

  const applySession = useCallback((data: AuthResponse) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('guest');
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const data = await apiRequest<AuthResponse | undefined>('/api/v1/auth/refresh', {
        method: 'POST',
        auth: false,
        retryOn401: false,
      });
      if (!data?.accessToken) {
        clearSession();
        return null;
      }
      applySession(data);
      return data.accessToken;
    } catch {
      clearSession();
      return null;
    }
  }, [applySession, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiRequest<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
        retryOn401: false,
      });
      applySession(data);
      setInitialized(true);
    },
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const data = await apiRequest<AuthResponse>('/api/v1/auth/register', {
        method: 'POST',
        body: input,
        auth: false,
        retryOn401: false,
      });
      applySession(data);
      setInitialized(true);
    },
    [applySession],
  );

  const syncUser = useCallback(async () => {
    try {
      const me = await apiRequest<AuthUser>('/api/v1/auth/me');
      setUser(me);
    } catch {
      // The API layer already refreshes or clears the session when needed.
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest<void>('/api/v1/auth/logout', {
        method: 'POST',
        auth: false,
        retryOn401: false,
      });
    } catch {
      // The cookie may already be gone; local state still has to be cleared.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // Let the API layer refresh expired access tokens transparently.
  useEffect(() => {
    setAuthBridge({ getAccessToken, refreshAccessToken, onSessionExpired: clearSession });
    return () => setAuthBridge(null);
  }, [refreshAccessToken, clearSession]);

  // Boot: restore the session from the refresh cookie and learn whether the
  // platform still needs its first administrator.
  useEffect(() => {
    if (booted.current) {
      return;
    }
    booted.current = true;

    void (async () => {
      const [statusResult] = await Promise.allSettled([
        apiRequest<{ initialized: boolean }>('/api/v1/auth/status', {
          auth: false,
          retryOn401: false,
        }),
        refreshAccessToken(),
      ]);

      if (statusResult.status === 'fulfilled') {
        setInitialized(statusResult.value.initialized);
      } else {
        setInitialized(null);
      }
    })();
  }, [refreshAccessToken]);

  // Rotate the refresh token periodically while the app is open.
  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }
    const timer = window.setInterval(() => {
      void refreshAccessToken();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [status, refreshAccessToken]);

  // Re-validate the session and refresh profile data when the tab regains focus.
  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void syncUser();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [status, syncUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, initialized, login, register, logout }),
    [status, user, initialized, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
