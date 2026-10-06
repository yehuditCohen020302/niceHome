import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { HealthResponse } from '@nice-home/shared';
import { getHealth } from '../../api/health';
import { ApiError } from '../../api/client';

const POLL_INTERVAL_MS = 30_000;

export type HealthState =
  | { status: 'loading' }
  | { status: 'ready'; health: HealthResponse }
  | { status: 'server-unreachable' }
  | { status: 'error'; message: string };

interface HealthContextValue {
  state: HealthState;
  refresh: () => void;
}

const HealthContext = createContext<HealthContextValue | null>(null);

/** Tracks local-server reachability, internet connectivity and mock mode for the whole app. */
export function HealthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HealthState>({ status: 'loading' });
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    const check = async () => {
      try {
        const health = await getHealth(controller.signal);
        setState({ status: 'ready', health });
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.isServerUnreachable) {
          setState({ status: 'server-unreachable' });
        } else {
          setState({ status: 'error', message: error instanceof Error ? error.message : String(error) });
        }
      }
    };

    void check();
    const interval = window.setInterval(check, POLL_INTERVAL_MS);
    window.addEventListener('online', check);
    window.addEventListener('offline', check);

    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener('online', check);
      window.removeEventListener('offline', check);
    };
  }, [refreshToken]);

  return <HealthContext.Provider value={{ state, refresh }}>{children}</HealthContext.Provider>;
}

export function useHealth(): HealthContextValue {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used inside <HealthProvider>');
  }
  return context;
}
