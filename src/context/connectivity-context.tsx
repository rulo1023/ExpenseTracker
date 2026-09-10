import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

type ConnectivityStatus = 'checking' | 'online' | 'offline';

type ConnectivityContextValue = {
  status: ConnectivityStatus;
  retry: () => void;
};

const ConnectivityContext = createContext<ConnectivityContextValue | null>(null);

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectivityStatus>('checking');

  const check = useCallback(() => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!url) {
      setStatus('offline');
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    void fetch(`${url}/rest/v1/`, { signal: controller.signal })
      .then((response) => setStatus(response.status < 500 ? 'online' : 'offline'))
      .catch(() => setStatus('offline'))
      .finally(() => clearTimeout(timer));
  }, []);

  useEffect(() => {
    check();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') check();
    });
    return () => subscription.remove();
  }, [check]);

  useEffect(() => {
    if (status !== 'offline') return;
    const timer = setInterval(check, 15000);
    return () => clearInterval(timer);
  }, [check, status]);

  const value = useMemo(() => ({ status, retry: check }), [check, status]);
  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity() {
  const context = useContext(ConnectivityContext);
  if (!context) throw new Error('useConnectivity must be used inside ConnectivityProvider');
  return context;
}
