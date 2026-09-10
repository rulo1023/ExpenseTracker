import { isRunningInExpoGo } from 'expo';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { E5AssetState, subscribeE5AssetState } from '../lib/expense-intelligence/e5-assets';
import { resetE5ClassifierFallback } from '../lib/expense-intelligence/category-classifier';

export type E5Status = 'expo-go' | 'checking' | 'downloading' | 'loading' | 'ready' | 'error';

type E5ModelContextValue = {
  status: E5Status;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  errorMessage: string | null;
  retry: () => void;
};

const E5ModelContext = createContext<E5ModelContextValue | null>(null);

export function E5ModelProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<E5Status>(isRunningInExpoGo() ? 'expo-go' : 'checking');
  const [assetState, setAssetState] = useState<E5AssetState>({
    phase: 'idle', progress: 0, downloadedBytes: 0, totalBytes: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => subscribeE5AssetState((state) => {
    setAssetState(state);
    if (state.phase === 'checking') setStatus('checking');
    if (state.phase === 'downloading') setStatus('downloading');
    if (state.phase === 'downloaded') setStatus('loading');
  }), []);

  const prepare = useCallback(() => {
    if (isRunningInExpoGo()) {
      setStatus('expo-go');
      return;
    }
    resetE5ClassifierFallback();
    setStatus('checking');
    setErrorMessage(null);
    void import('../lib/expense-intelligence/e5-engine')
      .then(({ initializeE5 }) => initializeE5())
      .then(() => setStatus('ready'))
      .catch((error) => {
        console.warn('[E5] no se pudo preparar el modelo', error);
        setErrorMessage(error instanceof Error ? error.message : 'No se pudo preparar el modelo local.');
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    prepare();
  }, [prepare]);

  const value = useMemo(() => ({
    status,
    progress: assetState.progress,
    downloadedBytes: assetState.downloadedBytes,
    totalBytes: assetState.totalBytes,
    errorMessage,
    retry: prepare,
  }), [assetState, errorMessage, prepare, status]);

  return <E5ModelContext.Provider value={value}>{children}</E5ModelContext.Provider>;
}

export function useE5Model() {
  const context = useContext(E5ModelContext);
  if (!context) throw new Error('useE5Model must be used inside E5ModelProvider');
  return context;
}
