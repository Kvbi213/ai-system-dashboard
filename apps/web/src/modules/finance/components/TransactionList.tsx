import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export interface TransactionItem {
  id: string;
  title: string;
  category: 'potrzeby' | 'zachcianki' | 'oszczednosci' | 'przychod';
  amount: number;
  date: string;
}

interface TransactionListProps {
  transactions: TransactionItem[];
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  return (
    <GlassCard className="p-4" glow="none">
      <h3 className="text-sm font-bold text-white tracking-tight mb-3">Ostatnie operacje</h3>
      <div className="space-y-2">
        {transactions.map((tx) => {
          const isIncome = tx.amount > 0;
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-1.5 rounded-lg ${
                    isIncome ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                  }`}
                >
                  {isIncome ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">{tx.title}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{tx.category} • {tx.date}</p>
                </div>
              </div>
              <span
                className={`text-xs font-mono font-bold ${
                  isIncome ? 'text-emerald-400' : 'text-slate-200'
                }`}
              >
                {isIncome ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} PLN
              </span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
