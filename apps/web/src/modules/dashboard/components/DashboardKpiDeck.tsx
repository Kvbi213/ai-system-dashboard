import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../../components/ui/GlassCard';
import { TrendingUp, Dumbbell, ArrowRight } from 'lucide-react';

interface DashboardKpiDeckProps {
  taskStats: {
    total: number;
    completed: number;
    pending: number;
    percent: number;
  };
  onOpenTasks: () => void;
}

export const DashboardKpiDeck: React.FC<DashboardKpiDeckProps> = ({ taskStats, onOpenTasks }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-stretch" data-testid="dashboard-kpi-deck">
      {/* KPI 1: Aktywność Zadań */}
      <GlassCard className="p-3 sm:p-3.5 flex flex-col justify-between hover:shadow-md transition-all w-full h-full" glow="sky">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Aktywność Dnia</span>
          <span className="flex items-center gap-1 text-[11px] font-bold font-mono text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/70 px-2 py-0.5 rounded-lg border border-sky-200 dark:border-sky-800">
            <TrendingUp className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            {taskStats.percent}%
          </span>
        </div>

        <div className="my-2.5 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">{taskStats.percent}%</div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ukończono {taskStats.completed} z {taskStats.total}</span>
          </div>
          {/* SVG Progress Ring */}
          <div className="relative w-11 h-11 shrink-0">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-700 stroke-current"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3.5"
              />
              <path
                className="text-sky-600 dark:text-sky-400 stroke-current transition-all duration-500"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeDasharray={`${taskStats.percent}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-sky-700 dark:text-sky-300">
              {taskStats.completed}/{taskStats.total}
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <span>Oczekujące: {taskStats.pending}</span>
          <button
            onClick={onOpenTasks}
            className="text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-300 font-bold flex items-center gap-0.5 hover:underline"
          >
            <span>Zarządzaj</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </GlassCard>

      {/* KPI 2: Sesja Treningowa FBW */}
      <GlassCard className="p-3 sm:p-3.5 flex flex-col justify-between hover:shadow-md transition-all w-full h-full" glow="emerald">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sesja FBW</span>
          <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
            Cykl A
          </span>
        </div>

        <div className="my-2.5">
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">FBW Kalistenika</div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Dumbbell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Drążek &amp; Dipy • 45 min</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <span className="font-bold text-emerald-700 dark:text-emerald-400">3 / 14 serii</span>
          <button
            onClick={() => navigate('/workouts')}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 font-bold flex items-center gap-0.5 hover:underline"
          >
            <span>Dziennik</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </GlassCard>

      {/* KPI 3: Finanse Koperty 50/30/20 */}
      <GlassCard className="p-3 sm:p-3.5 flex flex-col justify-between hover:shadow-md transition-all w-full h-full" glow="amber">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Budżet 50/30/20</span>
          <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
            +3 420 zł
          </span>
        </div>

        <div className="my-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <span>Potrzeby 50%</span>
            <span>Zachc. 30%</span>
            <span>Oszcz. 20%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex shadow-inner">
            <div className="h-full bg-sky-500" style={{ width: '50%' }}></div>
            <div className="h-full bg-indigo-500" style={{ width: '30%' }}></div>
            <div className="h-full bg-emerald-500" style={{ width: '20%' }}></div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <span>Wydatki: 1 780 zł</span>
          <button
            onClick={() => navigate('/finance')}
            className="text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-bold flex items-center gap-0.5 hover:underline"
          >
            <span>Budżet</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
