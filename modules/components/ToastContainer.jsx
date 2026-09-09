import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, WifiOff } from 'lucide-react';

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const TOAST_STYLES = {
  success: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-950/85',
    text: 'text-emerald-300',
    iconColor: 'text-emerald-400',
    bar: 'bg-emerald-400'
  },
  error: {
    border: 'border-rose-500/40',
    bg: 'bg-rose-950/85',
    text: 'text-rose-300',
    iconColor: 'text-rose-400',
    bar: 'bg-rose-500'
  },
  warning: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-950/85',
    text: 'text-amber-300',
    iconColor: 'text-amber-400',
    bar: 'bg-amber-400'
  },
  info: {
    border: 'border-cyan-500/40',
    bg: 'bg-[#0b1626]/90',
    text: 'text-cyan-300',
    iconColor: 'text-cyan-400',
    bar: 'bg-cyan-400'
  }
};

export default function ToastContainer() {
  const { toasts, removeToast, isOnline } = useToast();

  return (
    <>
      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white text-xs font-mono py-1 px-4 text-center flex items-center justify-center gap-2 shadow-lg animate-pulse">
          <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-bold tracking-wide">TRYB OFFLINE:</span>
          <span>Brak połączenia z siecią. Zmiany są buforowane lokalnie i zostaną zsynchronizowane po powrocie sygnału.</span>
        </div>
      )}

      {/* Floating Toast Notification Stack */}
      <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((t) => {
          const Icon = TOAST_ICONS[t.type] || Info;
          const style = TOAST_STYLES[t.type] || TOAST_STYLES.info;

          return (
            <div
              key={t.id}
              className={`pointer-events-auto relative overflow-hidden backdrop-blur-md rounded-xl border p-3.5 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${style.bg} ${style.border}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
                <div className="flex-1 min-w-0 pr-4">
                  {t.title && (
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white mb-0.5">
                      {t.title}
                    </h4>
                  )}
                  <p className={`text-xs leading-relaxed break-words ${style.text}`}>
                    {t.message}
                  </p>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-textMuted hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
                  aria-label="Zamknij powiadomienie"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Animowany pasek upływu czasu */}
              {t.duration > 0 && (
                <div
                  className={`absolute bottom-0 left-0 h-[2px] ${style.bar} opacity-75 animate-pulse`}
                  style={{ width: '100%' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
