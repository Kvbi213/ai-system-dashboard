import React, { useState } from 'react';
import { AtticFBWTracker } from './components/AtticFBWTracker';
import { DailyHabitStreaks } from './components/DailyHabitStreaks';
import { PersonalRecordsCard } from './components/PersonalRecordsCard';
import { Dumbbell, Flame, Trophy, CheckCircle } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { SubTabBar } from '../../components/ui/SubTabBar';
import { useToast } from '../../components/ui/Toast';
import { useWorkoutState } from './hooks/useWorkoutState';

export const WorkoutsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fbw' | 'habits' | 'records'>('fbw');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();
  const { completedSets, totalSets, streakDays, activeCycle } = useWorkoutState();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Zsynchronizowano telemetrię treningową');
    }, 600);
  };

  const tabs = [
    { id: 'fbw', label: 'Trening FBW & Kalistenika', icon: Dumbbell },
    { id: 'habits', label: 'Nawyki i Streaki', icon: Flame },
    { id: 'records', label: 'Rekordy Osobiste', icon: Trophy }
  ] as const;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Unified Executive PageHeader */}
      <PageHeader
        icon={Dumbbell}
        title="Trening FBW i Nawyki Dnia"
        subtitle="Kalistenika na strychu :: Drążek, Dipy & Progresja Obciążenia"
        badge="Cykl A"
        badgeVariant="emerald"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Unified SubTabBar with liquid pill design */}
      <SubTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* KPI Overview Pills with Laptop Grid Balance */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl glass-panel flex items-center gap-3 shadow-sm h-full border border-slate-200/80 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Seria treningów</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
              {streakDays} {streakDays === 1 ? 'dzień' : 'dni'} z rzędu
            </p>
          </div>
        </div>

        <div className="p-3 rounded-2xl glass-panel flex items-center gap-3 shadow-sm h-full border border-slate-200/80 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Ukończone serie</p>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              {completedSets} / {totalSets} serii
            </p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl glass-panel flex items-center gap-3 shadow-sm h-full border border-slate-200/80 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Aktualny cykl</p>
            <p className="text-sm font-bold text-sky-800 dark:text-sky-300 truncate">{activeCycle}</p>
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'fbw' && <AtticFBWTracker />}
      {activeTab === 'habits' && <DailyHabitStreaks />}
      {activeTab === 'records' && <PersonalRecordsCard />}
    </div>
  );
};
