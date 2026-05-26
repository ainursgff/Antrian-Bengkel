// FILE: frontend/src/context/ToastContext.jsx
import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
      {children}
      
      {/* Dynamic Floating Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto flex items-center justify-between gap-4 px-4 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl animate-slide-in cursor-pointer transition-all duration-300 hover:translate-y-[-2px] ${
              toast.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/30 text-rose-200'
                : toast.type === 'warning'
                ? 'bg-amber-950/80 border-amber-500/30 text-amber-200'
                : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base flex-shrink-0">
                {toast.type === 'error' ? (
                  <i className="fas fa-exclamation-circle text-rose-500"></i>
                ) : toast.type === 'warning' ? (
                  <i className="fas fa-exclamation-triangle text-amber-400"></i>
                ) : (
                  <i className="fas fa-check-circle text-emerald-400"></i>
                )}
              </span>
              <p className="text-xs font-semibold tracking-wide leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="text-slate-400 hover:text-white transition duration-200"
            >
              <i className="fas fa-times text-[10px]"></i>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
