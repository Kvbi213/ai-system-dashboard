import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export type GlassGlow = 'sky' | 'emerald' | 'amber' | 'indigo' | 'rose' | 'purple' | 'none';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  glow?: GlassGlow;
}

const glowStyles: Record<GlassGlow, string> = {
  sky: 'hover:border-slate-300 dark:hover:border-slate-700',
  emerald: 'hover:border-slate-300 dark:hover:border-slate-700',
  amber: 'hover:border-slate-300 dark:hover:border-slate-700',
  indigo: 'hover:border-slate-300 dark:hover:border-slate-700',
  rose: 'hover:border-slate-300 dark:hover:border-slate-700',
  purple: 'hover:border-slate-300 dark:hover:border-slate-700',
  none: ''
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  elevated = false,
  glow = 'none',
  ...motionProps
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`rounded-2xl transition-all duration-150 ${
        elevated ? 'glass-panel-elevated' : 'glass-panel'
      } ${glowStyles[glow]} ${className}`}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};
