const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Attach the in-memory access token (defaults to true). */
  auth?: boolean;
  /** Retry once after refreshing the access token on 401 (defaults to true). */
  retryOn401?: boolean;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(status: number, message: string, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface AuthBridge {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
  onSessionExpired: () => void;
}

let accessToken: string | null = null;
let authBridge: AuthBridge | null = null;

/** The access token lives in memory only; the refresh token stays in an HttpOnly cookie. */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAuthBridge(bridge: AuthBridge | null): void {
  authBridge = bridge;
}

async function readError(response: Response): Promise<ApiError> {
  let message = `HTTP ${response.status}`;
  let code: string | null = null;

  try {
    const payload = (await response.json()) as { message?: unknown; error?: unknown };
    if (typeof payload.message === 'string' && payload.message.trim()) {
      message = payload.message;
    } else if (Array.isArray(payload.message) && payload.message.length > 0) {
      message = payload.message.map(String).join(' · ');
    }
    if (typeof payload.error === 'string') {
      code = payload.error;
    }
  } catch {
    // Non-JSON error body; keep the generic message.
  }

  return new ApiError(response.status, message, code);
}

/**
 * Single entry point for every API call. Adds the bearer token, keeps cookies
 * for the refresh endpoint, and refreshes once when the access token expired.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, retryOn401 = true, signal } = options;

  async function send(): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    const token = auth ? (authBridge?.getAccessToken() ?? accessToken) : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  }

  let response = await send();

  if (response.status === 401 && auth && retryOn401 && authBridge) {
    const refreshedToken = await authBridge.refreshAccessToken().catch(() => null);
    if (refreshedToken) {
      response = await send();
    } else {
      authBridge.onSessionExpired();
    }
  }

  if (!response.ok) {
    throw await readError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
