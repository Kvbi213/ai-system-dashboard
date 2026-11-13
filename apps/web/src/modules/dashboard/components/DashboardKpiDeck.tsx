import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../../components/ui/GlassCard';
import { TrendingUp, Dumbbell, ArrowRight } from 'lucide-react';
import { useWorkoutState } from '../../workouts/hooks/useWorkoutState';

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
  const { completedSets, totalSets, activeCycle } = useWorkoutState();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-stretch" data-testid="dashboard-kpi-deck">
      {/* KPI 1: Zadania */}
      <GlassCard className="p-3.5 sm:p-4 flex flex-col justify-between w-full h-full">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Zadania na dziś</span>
          <span className="flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            <TrendingUp className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            {taskStats.percent}%
          </span>
        </div>

        <div className="my-2 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">{taskStats.percent}%</div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Zrobiono {taskStats.completed} z {taskStats.total}</span>
          </div>
          {/* SVG Progress Ring */}
          <div className="relative w-10 h-10 shrink-0">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-700 stroke-current"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3.5"
              />
              <path
                className="text-slate-800 dark:text-slate-200 stroke-current transition-all duration-300"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeDasharray={`${taskStats.percent}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
              {taskStats.completed}/{taskStats.total}
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <span>Oczekujące: <strong className="text-slate-700 dark:text-slate-200">{taskStats.pending}</strong></span>
          <button
            onClick={onOpenTasks}
            className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold flex items-center gap-1 hover:underline focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none rounded"
          >
            <span>Lista zadań</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </GlassCard>

      {/* KPI 2: Trening FBW */}
      <GlassCard className="p-3.5 sm:p-4 flex flex-col justify-between w-full h-full">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Plan treningowy</span>
          <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {activeCycle.includes('A') ? 'Cykl A' : 'Cykl B'}
          </span>
        </div>

        <div className="my-2">
          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">Kalistenika & FBW</div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            <Dumbbell className="w-3.5 h-3.5 text-slate-400" />
            <span>Drążek, dipy i pompki</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <span>Ukończone serie: <strong className="text-slate-800 dark:text-slate-200">{completedSets} / {totalSets}</strong></span>
          <button
            onClick={() => navigate('/workouts')}
            className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold flex items-center gap-1 hover:underline focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none rounded"
          >
            <span>Dziennik</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </GlassCard>

      {/* KPI 3: Budżet domowy */}
      <GlassCard className="p-3.5 sm:p-4 flex flex-col justify-between w-full h-full">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Budżet domowy</span>
          <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
            +3 420 zł
          </span>
        </div>

        <div className="my-2 space-y-1">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>Potrzeby 50%</span>
            <span>Zachcianki 30%</span>
            <span>Oszczędności 20%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 flex overflow-hidden">
            <div className="bg-slate-600 dark:bg-slate-400 h-2" style={{ width: '50%' }} title="Potrzeby: 50%" />
            <div className="bg-slate-400 dark:bg-slate-500 h-2" style={{ width: '30%' }} title="Zachcianki: 30%" />
            <div className="bg-emerald-500 h-2" style={{ width: '20%' }} title="Oszczędności: 20%" />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <span>Wydatki w tym m-cu: <strong className="text-slate-800 dark:text-slate-200">1 780 zł</strong></span>
          <button
            onClick={() => navigate('/finance')}
            className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold flex items-center gap-1 hover:underline focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none rounded"
          >
            <span>Szczegóły</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
