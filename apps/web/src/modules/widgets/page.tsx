import React, { useState } from 'react';
import { CryptoMarketCard } from './components/CryptoMarketCard';
import { HardwareMonitorCard } from './components/HardwareMonitorCard';
import { NetworkHealthCard } from './components/NetworkHealthCard';
import { QuickNotesCard } from './components/QuickNotesCard';
import { TokenExpenseCard } from './components/TokenExpenseCard';
import { PromptVaultCard } from './components/PromptVaultCard';
import { LayoutGrid, Cpu, Coins, Sparkles } from 'lucide-react';

export const WidgetsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'hardware' | 'market' | 'ai'>('all');

  const filterButtons = [
    { id: 'all', label: 'Wszystkie Widżety', icon: LayoutGrid },
    { id: 'hardware', label: 'Hardware & Sieć', icon: Cpu },
    { id: 'market', label: 'Rynek & Krypto', icon: Coins },
    { id: 'ai', label: 'Narzędzia AI & Notatki', icon: Sparkles }
  ] as const;

  const showHardware = filter === 'all' || filter === 'hardware';
  const showMarket = filter === 'all' || filter === 'market';
  const showAi = filter === 'all' || filter === 'ai';

  return (
    <div className="space-y-4 max-w-7xl mx-auto" data-testid="widgets-hub-page">
      {/* Category Pills Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl glass-panel shadow-2xs">
        {filterButtons.map((btn) => {
          const isActive = filter === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium transition text-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
              }`}
            >
              <btn.icon className="w-4 h-4 shrink-0" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showHardware && <HardwareMonitorCard />}
        {showHardware && <NetworkHealthCard />}
        {showMarket && <CryptoMarketCard />}
        {showAi && <QuickNotesCard />}
        {showAi && <TokenExpenseCard />}
        {showAi && <PromptVaultCard />}
      </div>
    </div>
  );
};
