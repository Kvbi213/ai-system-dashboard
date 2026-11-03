import React from 'react';
import { motion } from 'framer-motion';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number | string;
  badge?: string;
}

export interface SubTabBarProps<T extends string> {
  tabs: readonly TabItem<T>[] | TabItem<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  className?: string;
  gridColsClass?: string;
}

export function SubTabBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  gridColsClass
}: SubTabBarProps<T>) {
  // Automatyczne dopasowanie kolumn jeśli nie przekazano klasy
  const autoCols = gridColsClass || (
    tabs.length === 2 ? 'grid-cols-2' :
    tabs.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
    tabs.length === 4 ? 'grid-cols-2 sm:grid-cols-4' :
    tabs.length === 5 ? 'grid-cols-2 sm:grid-cols-5' :
    tabs.length >= 6 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' :
    'grid-cols-3'
  );

  const handleSelect = (tabId: T) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
    onTabChange(tabId);
  };

  return (
    <div
      role="tablist"
      aria-label="Podzakładki sekcji"
      className={`grid ${autoCols} gap-1.5 p-1.5 rounded-2xl glass-panel border border-slate-200/80 dark:border-slate-800/90 shadow-sm ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(tab.id)}
            className={`relative flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all select-none text-center ${
              isActive
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 border border-sky-500'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            {Icon && <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-105' : 'opacity-80'}`} />}
            <span className="truncate">{tab.label}</span>

            {tab.count !== undefined && (
              <span
                className={`ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            )}

            {tab.badge && (
              <span className="ml-1 text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {tab.badge}
              </span>
            )}

            {isActive && (
              <motion.div
                layoutId="activeSubTabIndicator"
                className="absolute inset-0 rounded-xl bg-sky-600 -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
