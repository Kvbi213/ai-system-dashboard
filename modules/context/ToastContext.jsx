import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title = '', message = '', duration = 4000 }) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newToast = { id, type, title, message, duration, timestamp: Date.now() };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Trzymamy maksymalnie 5 aktywnych toastów

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = useMemo(() => ({
    success: (message, title = 'Sukces') => addToast({ type: 'success', title, message }),
    error: (message, title = 'Błąd') => addToast({ type: 'error', title, message, duration: 6000 }),
    warning: (message, title = 'Ostrzeżenie') => addToast({ type: 'warning', title, message, duration: 5000 }),
    info: (message, title = 'Informacja') => addToast({ type: 'info', title, message })
  }), [addToast]);

  // Nasłuchiwanie zdarzeń systemowych z poziomu całego okna (window)
  useEffect(() => {
    const handleSystemToast = (e) => {
      if (e && e.detail) {
        addToast(e.detail);
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      addToast({
        type: 'success',
        title: 'Sieć Przywrócona',
        message: 'Połączenie sieciowe z chmurą zostało ponownie nawiązane.',
        duration: 3500
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast({
        type: 'warning',
        title: 'Tryb Offline',
        message: 'Utracono połączenie sieciowe. Zmiany są buforowane lokalnie.',
        duration: 6000
      });
    };

    window.addEventListener('system:toast', handleSystemToast);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('system:toast', handleSystemToast);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  const value = useMemo(() => ({
    toasts,
    addToast,
    removeToast,
    toast,
    isOnline
  }), [toasts, addToast, removeToast, toast, isOnline]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Bezpieczny fallback jeśli komponent jest renderowany poza providerem
    return {
      toasts: [],
      addToast: () => {},
      removeToast: () => {},
      isOnline: true,
      toast: {
        success: (m) => console.log('[Toast:Success]', m),
        error: (m) => console.error('[Toast:Error]', m),
        warning: (m) => console.warn('[Toast:Warning]', m),
        info: (m) => console.info('[Toast:Info]', m),
      }
    };
  }
  return context;
};
