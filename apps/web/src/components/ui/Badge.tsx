import React from 'react';

export type BadgeVariant =
  | 'cyan'
  | 'sky'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'purple'
  | 'slate'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

interface BadgeProps {
  tag?: string;
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  cyan: 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200/90 dark:border-sky-800 shadow-sm shadow-sky-100/50 dark:shadow-none',
  sky: 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200/90 dark:border-sky-800 shadow-sm shadow-sky-100/50 dark:shadow-none',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/90 dark:border-emerald-800 shadow-sm shadow-emerald-100/50 dark:shadow-none',
  amber: 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200/90 dark:border-amber-800 shadow-sm shadow-amber-100/50 dark:shadow-none',
  rose: 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200/90 dark:border-rose-800 shadow-sm shadow-rose-100/50 dark:shadow-none',
  purple: 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200/90 dark:border-purple-800 shadow-sm shadow-purple-100/50 dark:shadow-none',
  slate: 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 shadow-sm shadow-slate-100/50 dark:shadow-none',
  // Semantic aliases:
  success: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200/90 dark:border-emerald-800 shadow-sm shadow-emerald-100/50 dark:shadow-none',
  warning: 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200/90 dark:border-amber-800 shadow-sm shadow-amber-100/50 dark:shadow-none',
  danger: 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200/90 dark:border-rose-800 shadow-sm shadow-rose-100/50 dark:shadow-none',
  info: 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200/90 dark:border-sky-800 shadow-sm shadow-sky-100/50 dark:shadow-none'
};

export const Badge: React.FC<BadgeProps> = ({
  tag,
  variant = 'cyan',
  children,
  className = ''
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {tag && <span className="opacity-75 font-bold">{tag}</span>}
      <span>{children}</span>
    </span>
  );
};
