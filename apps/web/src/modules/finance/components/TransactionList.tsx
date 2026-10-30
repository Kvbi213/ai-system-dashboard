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
      <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-3">Ostatnie operacje</h3>
      <div className="space-y-2">
        {transactions.map((tx) => {
          const isIncome = tx.amount > 0;
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-1.5 rounded-lg ${
                    isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {isIncome ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{tx.title}</p>
                  <p className="text-[10px] text-slate-500 capitalize font-medium">{tx.category} • {tx.date}</p>
                </div>
              </div>
              <span
                className={`text-xs font-mono font-bold ${
                  isIncome ? 'text-emerald-700' : 'text-slate-900'
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
