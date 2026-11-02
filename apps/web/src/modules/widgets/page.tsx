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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl glass-panel shadow-sm">
        {filterButtons.map((btn) => {
          const isActive = filter === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all text-center ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 border border-sky-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
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
