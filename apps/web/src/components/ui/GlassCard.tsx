import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export type GlassGlow = 'sky' | 'emerald' | 'amber' | 'indigo' | 'none';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  glow?: GlassGlow;
}

const glowStyles: Record<GlassGlow, string> = {
  sky: 'shadow-lg shadow-sky-500/5 border-sky-500/20',
  emerald: 'shadow-lg shadow-emerald-500/5 border-emerald-500/20',
  amber: 'shadow-lg shadow-amber-500/5 border-amber-500/20',
  indigo: 'shadow-lg shadow-indigo-500/5 border-indigo-500/20',
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
