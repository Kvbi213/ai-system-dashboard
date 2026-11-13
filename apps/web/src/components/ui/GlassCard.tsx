import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export type GlassGlow = 'sky' | 'emerald' | 'amber' | 'indigo' | 'rose' | 'purple' | 'none';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  glow?: GlassGlow;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  elevated = false,
  glow = 'none',
  ...motionProps
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`rounded-xl transition-all duration-150 ${
        elevated
          ? 'bg-white dark:bg-[#141a2a] border border-slate-300/80 dark:border-white/[0.12] shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
          : 'bg-white dark:bg-[#101524] border border-slate-200/90 dark:border-white/[0.08] shadow-2xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
      } ${className}`}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};
