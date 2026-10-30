import React from 'react';

export type BadgeVariant =
  | 'cyan'
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
  cyan: 'bg-sky-50 text-sky-700 border-sky-200/90 shadow-sm shadow-sky-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 shadow-sm shadow-emerald-100',
  amber: 'bg-amber-50 text-amber-800 border-amber-200/90 shadow-sm shadow-amber-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-200/90 shadow-sm shadow-rose-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/90 shadow-sm shadow-purple-100',
  slate: 'bg-slate-100/90 text-slate-700 border-slate-200 shadow-sm shadow-slate-100',
  // Semantic aliases:
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 shadow-sm shadow-emerald-100',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/90 shadow-sm shadow-amber-100',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/90 shadow-sm shadow-rose-100',
  info: 'bg-sky-50 text-sky-700 border-sky-200/90 shadow-sm shadow-sky-100'
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
