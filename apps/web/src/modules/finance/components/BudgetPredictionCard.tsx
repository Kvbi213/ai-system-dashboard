import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { TrendingUp, AlertCircle, CheckCircle2, Sliders } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/Toast';

export interface BudgetPredictionProps {
  totalSpent: number;
  totalLimit?: number;
  needsSpent: number;
  wantsSpent: number;
  savingsReserved: number;
}

export const BudgetPredictionCard: React.FC<BudgetPredictionProps> = ({
  totalSpent = 1788,
  totalLimit = 5000,
  needsSpent = 1120,
  wantsSpent = 480,
  savingsReserved = 680
}) => {
  const toast = useToast();
  const [limit, setLimit] = useState(totalLimit);
  const [isEditing, setIsEditing] = useState(false);
  const [tempLimit, setTempLimit] = useState(totalLimit.toString());

  const now = new Date();
  const currentDay = now.getDate();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay);

  const dailyBurnRate = currentDay > 0 ? Math.round(totalSpent / currentDay) : 0;
  const projectedTotalSpent = Math.round(totalSpent + dailyBurnRate * daysRemaining);
  const projectedSurplus = limit - projectedTotalSpent;
  const isOverBudget = projectedTotalSpent > limit;

  const needsLimit = Math.round(limit * 0.5);
  const wantsLimit = Math.round(limit * 0.3);
  const savingsTarget = Math.round(limit * 0.2);

  const handleSaveWriteBack = () => {
    const parsed = parseFloat(tempLimit);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Wprowadź prawidłową kwotę limitu miesięcznego.');
      return;
    }
    setLimit(parsed);
    setIsEditing(false);
    toast.success(`[+] Zapis zwrotny: Zaktualizowano limit budżetu do ${parsed.toLocaleString('pl-PL')} zł.`);
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow={isOverBudget ? 'rose' : 'emerald'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Analityka Predykcyjna 50/30/20 & Write-Back
              </h3>
              <Badge variant={isOverBudget ? 'rose' : 'emerald'}>
                {isOverBudget ? 'RYZYKO PRZEKROCZENIA' : 'PROGNOZA OPTYMALNA'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Model szeregów czasowych domknięcia miesiąca (pozostało {daysRemaining} dni)
            </p>
          </div>
        </div>

        {/* Interactive Write-Back Button */}
        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex items-center gap-1.5 shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-500" />
              <span>Dostosuj limit (Write-Back)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={tempLimit}
                onChange={(e) => setTempLimit(e.target.value)}
                className="w-24 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-sky-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder="Limit"
              />
              <button
                onClick={handleSaveWriteBack}
                className="px-2.5 py-1 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition"
              >
                Zapisz
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
            Średni wydatek dobowy (Burn-Rate)
          </span>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
            {dailyBurnRate.toLocaleString('pl-PL')} zł <span className="text-xs font-normal text-slate-400">/ dzień</span>
          </div>
          <span className="text-[10px] text-slate-400">Wyliczono z {currentDay} dni cyklu</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
            Prognozowane wydatki na koniec m-ca
          </span>
          <div className={`text-lg font-bold font-mono mt-0.5 ${isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {projectedTotalSpent.toLocaleString('pl-PL')} zł
          </div>
          <span className="text-[10px] text-slate-400">z planowanego limitu {limit.toLocaleString('pl-PL')} zł</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
            Szacowana nadwyżka / deficyt
          </span>
          <div className={`text-lg font-bold font-mono mt-0.5 flex items-center gap-1 ${projectedSurplus >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {projectedSurplus >= 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>+{projectedSurplus.toLocaleString('pl-PL')} zł</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>{projectedSurplus.toLocaleString('pl-PL')} zł</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-slate-400">Bezpieczna rezerwa do oszczędności</span>
        </div>
      </div>

      {/* Envelope Progress Forecast Bar */}
      <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          Rozkład prognozowany kopert 50/30/20:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60">
            <div className="flex justify-between items-center text-sky-900 dark:text-sky-200 font-semibold">
              <span>Potrzeby (50%)</span>
              <span className="font-mono">{needsSpent} / {needsLimit} zł</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-sky-200 dark:bg-sky-900 mt-1.5 overflow-hidden">
              <div
                className="h-full bg-sky-600 rounded-full"
                style={{ width: `${Math.min(100, Math.round((needsSpent / needsLimit) * 100))}%` }}
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60">
            <div className="flex justify-between items-center text-indigo-900 dark:text-indigo-200 font-semibold">
              <span>Zachcianki (30%)</span>
              <span className="font-mono">{wantsSpent} / {wantsLimit} zł</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-indigo-200 dark:bg-indigo-900 mt-1.5 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${Math.min(100, Math.round((wantsSpent / wantsLimit) * 100))}%` }}
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
            <div className="flex justify-between items-center text-emerald-900 dark:text-emerald-200 font-semibold">
              <span>Oszczędności (20%)</span>
              <span className="font-mono">{savingsReserved} / {savingsTarget} zł</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-emerald-200 dark:bg-emerald-900 mt-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${Math.min(100, Math.round((savingsReserved / savingsTarget) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
