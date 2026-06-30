import React from 'react';
import { Coins, Activity } from 'lucide-react';

const TokenTracker = () => {
  return (
    <div className="glass-panel p-5 rounded-xl border border-border flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center gap-3 mb-5 border-b border-border/50 pb-3">
        <div className="p-2 rounded-lg bg-accentPrimary/10 border border-accentPrimary/20">
          <Coins className="w-5 h-5 text-accentPrimary" />
        </div>
        <div>
          <h3 className="font-mono text-sm font-bold text-textPrimary">Token & Cost Tracker</h3>
          <p className="text-[10px] text-textMuted uppercase tracking-wider">Bieżące Zużycie API</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 flex-1">
        <div className="flex justify-between items-end p-3 rounded-xl bg-black/20 border border-border/50">
          <div>
            <p className="text-[10px] text-textMuted uppercase">Dziś (Szacunkowo)</p>
            <p className="font-mono text-2xl font-bold text-accentPrimary">$0.42</p>
          </div>
          <Activity className="w-8 h-8 text-accentPrimary/20 mb-1" />
        </div>
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className="p-3 rounded-xl bg-black/20 border border-border/50 flex flex-col justify-center">
            <p className="text-[10px] text-textMuted uppercase mb-1">Prompt Tokens</p>
            <p className="font-mono font-bold text-sm text-textPrimary">14,204</p>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-border/50 flex flex-col justify-center">
            <p className="text-[10px] text-textMuted uppercase mb-1">Completion Tokens</p>
            <p className="font-mono font-bold text-sm text-textPrimary">3,892</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenTracker;
