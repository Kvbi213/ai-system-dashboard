import React, { useState } from 'react';
import { AtticFBWTracker } from './components/AtticFBWTracker';
import { DailyHabitStreaks } from './components/DailyHabitStreaks';
import { PersonalRecordsCard } from './components/PersonalRecordsCard';
import { Dumbbell, Flame, Trophy, CheckCircle } from 'lucide-react';

export const WorkoutsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fbw' | 'habits' | 'records'>('fbw');

  const tabs = [
    { id: 'fbw', label: 'Trening FBW & Kalistenika', icon: Dumbbell },
    { id: 'habits', label: 'Nawyki i Streaki', icon: Flame },
    { id: 'records', label: 'Rekordy Osobiste', icon: Trophy }
  ] as const;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Category Sub-Tabs with Liquid Glass Pill Design */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1.5 rounded-2xl glass-panel shadow-sm">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 border border-sky-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* KPI Overview Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl glass-panel flex items-center gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Seria treningów</p>
            <p className="text-sm font-bold text-slate-900 font-mono">4 dni z rzędu</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl glass-panel flex items-center gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Ukończone serie</p>
            <p className="text-sm font-bold text-emerald-700 font-mono">3 / 14 serii</p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl glass-panel flex items-center gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Aktualny cykl</p>
            <p className="text-sm font-bold text-sky-800">FBW Podciąganie A</p>
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
