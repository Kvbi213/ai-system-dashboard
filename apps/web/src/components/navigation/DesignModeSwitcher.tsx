import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDesignSystem } from '../../context/DesignSystemContext';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const DesignModeSwitcher: React.FC = () => {
  const { mode, setMode, modes } = useDesignSystem();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 select-none">
      {/* Floating pill container */}
      <motion.div
        layout
        className={`relative flex items-center rounded-2xl backdrop-blur-2xl transition-all duration-300 ${
          mode === 'precision'
            ? 'bg-black/95 border border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
            : mode === 'liquid'
            ? 'bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)]'
            : 'bg-white/90 dark:bg-[#121829]/90 border border-amber-500/20 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)]'
        } p-1`}
      >
        {/* Toggle Expand on Mobile */}
        <div className="sm:hidden flex items-center pr-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            title="Rozwiń przełącznik stylu"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Modes Pill List */}
        <div className={`flex items-center gap-1 ${isExpanded ? 'flex' : 'hidden sm:flex'}`}>
          {modes.map((item) => {
            const isActive = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 z-10 flex items-center gap-1.5 ${
                  isActive
                    ? mode === 'precision'
                      ? 'text-black font-mono font-bold'
                      : 'text-slate-900 dark:text-white font-semibold'
                    : mode === 'precision'
                    ? 'text-neutral-400 hover:text-amber-400 font-mono'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title={item.tagline}
              >
                {isActive && (
                  <motion.div
                    layoutId="design-mode-indicator"
                    className={`absolute inset-0 rounded-xl -z-10 ${
                      item.id === 'precision'
                        ? 'bg-amber-400 shadow-[0_0_12px_#f59e0b]'
                        : item.id === 'liquid'
                        ? 'bg-gradient-to-r from-sky-400/25 to-indigo-500/25 border border-white/40 dark:border-white/20 backdrop-blur-md shadow-sm'
                        : 'bg-gradient-to-r from-amber-400/25 via-rose-400/20 to-sky-400/20 border border-amber-500/30 dark:border-white/20 shadow-sm'
                    }`}
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="text-[13px]">{item.badge.split(' ')[0]}</span>
                <span className="whitespace-nowrap">{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Compact Mode Badge for Collapsed Mobile */}
        {!isExpanded && (
          <div className="sm:hidden px-2 py-1 text-xs font-semibold text-slate-800 dark:text-white flex items-center gap-1">
            <span>{modes.find(m => m.id === mode)?.badge}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
