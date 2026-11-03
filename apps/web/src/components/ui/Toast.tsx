import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(type === 'error' ? [10, 30, 10] : 5);
    }

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, warning, error, info }}>
      {children}
      {/* Toast Viewport Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isWarn = toast.type === 'warning';
            const isError = toast.type === 'error';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto p-3 rounded-2xl shadow-xl flex items-start gap-3 border backdrop-blur-xl ${
                  isSuccess
                    ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-700/80 text-emerald-900 dark:text-emerald-100'
                    : isWarn
                    ? 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-100'
                    : isError
                    ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-700/80 text-rose-900 dark:text-rose-100'
                    : 'bg-slate-50/95 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  {isWarn && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                  {isError && <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                  {!isSuccess && !isWarn && !isError && <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                </div>

                <div className="flex-1 text-xs font-semibold leading-relaxed">
                  {toast.message}
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  aria-label="Zamknij powiadomienie"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      showToast: (msg: string) => console.log(`[TOAST] ${msg}`),
      success: (msg: string) => console.log(`[TOAST SUCCESS] ${msg}`),
      warning: (msg: string) => console.warn(`[TOAST WARNING] ${msg}`),
      error: (msg: string) => console.error(`[TOAST ERROR] ${msg}`),
      info: (msg: string) => console.info(`[TOAST INFO] ${msg}`)
    };
  }
  return context;
};
