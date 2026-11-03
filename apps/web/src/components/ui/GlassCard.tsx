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
  sky: 'shadow-xl shadow-sky-500/10 border-sky-300/60 ring-1 ring-sky-400/20',
  emerald: 'shadow-xl shadow-emerald-500/10 border-emerald-300/60 ring-1 ring-emerald-400/20',
  amber: 'shadow-xl shadow-amber-500/10 border-amber-300/60 ring-1 ring-amber-400/20',
  indigo: 'shadow-xl shadow-indigo-500/10 border-indigo-300/60 ring-1 ring-indigo-400/20',
  rose: 'shadow-xl shadow-rose-500/10 border-rose-300/60 ring-1 ring-rose-400/20',
  purple: 'shadow-xl shadow-purple-500/10 border-purple-300/60 ring-1 ring-purple-400/20',
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`rounded-2xl transition-all duration-200 ${
        elevated ? 'glass-panel-elevated' : 'glass-panel'
      } ${glowStyles[glow]} ${className}`}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};
