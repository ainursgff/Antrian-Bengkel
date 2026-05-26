// FILE: frontend/src/context/QueryProvider.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from './ToastContext';

const QueryContext = createContext(null);

export const QueryProvider = ({ children }) => {
  const { showToast } = useToast();
  
  // Persistent local cache map
  const [cache, setCache] = useState({});
  
  // Global API states
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);

  /**
   * Helper utility for sleep/delay
   */
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Standardised fetch with exponential retries and 429 interception
   */
  const fetchWithRetry = useCallback(async (url, options = {}, retriesLeft = 3, delayMs = 1000) => {
    try {
      const res = await fetch(url, options);

      // Intercept 429 Too Many Requests
      if (res.status === 429) {
        setIsRateLimited(true);
        showToast('⚠️ Aktivitas terlalu padat. Sistem menangguhkan sementara untuk keamanan data.', 'warning');
        
        // Block & trigger countdown
        for (let i = 10; i > 0; i--) {
          setRetryCountdown(i);
          await delay(1000);
        }
        
        setIsRateLimited(false);
        setRetryCountdown(0);
        
        // Retry fetch recursively after delay
        return fetchWithRetry(url, options, retriesLeft - 1, delayMs * 2);
      }

      return res;
    } catch (err) {
      if (retriesLeft <= 0) throw err;
      
      // Exponential backoff retry
      await delay(delayMs);
      return fetchWithRetry(url, options, retriesLeft - 1, delayMs * 2);
    }
  }, [showToast]);

  /**
   * CENTRALIZED CACHE QUERY REQUEST FUNCTION
   */
  const query = useCallback(async (key, fetchFn, options = {}) => {
    const { forceRefetch = false, cacheTime = 60000 } = options;
    const now = Date.now();

    // Check if key is already cached and not stale
    if (!forceRefetch && cache[key] && (now - cache[key].timestamp < cacheTime)) {
      return cache[key].data;
    }

    // Trigger API request
    try {
      const data = await fetchFn();
      
      // Save to local persistence state
      setCache((prev) => ({
        ...prev,
        [key]: {
          data,
          timestamp: Date.now()
        }
      }));

      return data;
    } catch (err) {
      // If error occurs and we have stale cached data, fallback to it gracefully
      if (cache[key]) {
        showToast('Menampilkan data cache offline sementara.', 'warning');
        return cache[key].data;
      }
      throw err;
    }
  }, [cache, showToast]);

  const invalidateQuery = useCallback((key) => {
    setCache((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  }, []);

  return (
    <QueryContext.Provider
      value={{
        query,
        invalidateQuery,
        fetchWithRetry,
        isRateLimited,
        retryCountdown
      }}
    >
      {children}

      {/* Global Rate Limit Fallback Overlay UI */}
      {isRateLimited && (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-6 bg-slate-950/95 backdrop-blur-lg">
          <div className="text-center max-w-sm">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <i className="fas fa-hourglass-half text-4xl text-amber-500 animate-spin"></i>
              </div>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Sistem Dibatasi Sementara</h2>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed font-medium">
              BengkelKu memproteksi jaringan dari pemuatan berlebih. Harap tunggu sebentar sebelum sistem melakukan rekoneksi otomatis.
            </p>
            <div className="mt-8 px-5 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl inline-block">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Melakukan retry dalam</span>
              <span className="text-3xl font-extrabold text-amber-400 mt-1 block">{retryCountdown}s</span>
            </div>
          </div>
        </div>
      )}
    </QueryContext.Provider>
  );
};

export const useQuery = () => {
  const context = useContext(QueryContext);
  if (!context) {
    throw new Error('useQuery must be used within a QueryProvider');
  }
  return context;
};
