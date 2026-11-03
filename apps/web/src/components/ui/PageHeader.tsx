import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Badge, type BadgeVariant } from './Badge';

export interface PageHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  refreshLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeVariant = 'cyan',
  onRefresh,
  isRefreshing = false,
  refreshLabel = 'Odśwież',
  actions,
  className = ''
}) => {
  const handleRefresh = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
    onRefresh?.();
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 ${className}`}>
      {/* Left: Module identity */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/90 dark:border-sky-800 shadow-sm shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
            {badge && (
              <Badge variant={badgeVariant}>
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions and Live Refresh */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        {actions}

        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-60"
            title="Wymuś odświeżenie danych modułu"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 dark:text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{refreshLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
