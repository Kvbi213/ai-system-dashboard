import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { useDesignSystem } from '../../context/DesignSystemContext';

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
  const { mode } = useDesignSystem();

  // Mode 3: Precision OP-1 (Teenage Engineering & kvbi.pl aesthetic)
  if (mode === 'precision') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.12 }}
        className={`relative rounded-none sm:rounded-xs bg-[#070707] border ${
          elevated ? 'border-amber-500/60' : 'border-neutral-800'
        } p-4 text-neutral-200 transition-colors duration-100 group ${className}`}
        {...motionProps}
      >
        {/* Physical technical corner registration marks */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-amber-500/40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-amber-500/40 pointer-events-none" />
        {children}
      </motion.div>
    );
  }

  // Mode 2: Spatial Liquid Studio (VisionOS & Tahoe frosted glass)
  if (mode === 'liquid') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className={`rounded-3xl backdrop-blur-2xl transition-all duration-200 ${
          elevated
            ? 'bg-white/80 dark:bg-slate-900/70 border border-white/80 dark:border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.4)]'
            : 'bg-white/60 dark:bg-slate-900/50 border border-white/60 dark:border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.25)]'
        } ${className}`}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }

  // Mode 1: Tactile Glass Horizon (Warm sunrise horizon rim & organic glass)
  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`relative rounded-2xl backdrop-blur-xl transition-all duration-150 overflow-hidden ${
        elevated
          ? 'bg-white/95 dark:bg-[#121829]/90 border border-amber-400/30 dark:border-white/[0.14] shadow-md dark:shadow-[0_8px_30px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.1)]'
          : 'bg-white/85 dark:bg-[#0e1322]/85 border border-slate-200/90 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.06)]'
      } ${className}`}
      {...motionProps}
    >
      {/* Subtle warm horizon sunrise rim highlight at top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 dark:via-amber-400/25 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
};
