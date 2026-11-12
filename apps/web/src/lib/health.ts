import { useCallback, useEffect, useRef, useState } from 'react';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
}

export type HealthState =
  | { kind: 'checking' }
  | { kind: 'online'; data: HealthResponse }
  | { kind: 'offline'; message: string };

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export function useHealth(): { state: HealthState; refresh: () => void } {
  const [state, setState] = useState<HealthState>({ kind: 'checking' });
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ kind: 'checking' });

    fetch(`${API_BASE}/api/v1/health`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as HealthResponse;
        setState({ kind: 'online', data });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setState({
          kind: 'offline',
          message: error instanceof Error ? error.message : 'تعذر الوصول إلى الخدمة',
        });
      });
  }, []);

  useEffect(() => {
    refresh();
    return () => controllerRef.current?.abort();
  }, [refresh]);

  return { state, refresh };
}
