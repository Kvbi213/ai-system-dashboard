import React from 'react';
import { AtticFBWTracker } from './components/AtticFBWTracker';
import { Dumbbell, Flame, CheckCircle } from 'lucide-react';

export const WorkoutsPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl glass-card border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Seria treningów</p>
            <p className="text-sm font-bold text-white font-mono">4 dni z rzędu</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl glass-card border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Ukończone serie</p>
            <p className="text-sm font-bold text-emerald-300 font-mono">3 / 14 serii</p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl glass-card border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Aktualny plan</p>
            <p className="text-sm font-bold text-sky-300">FBW Podciąganie A</p>
          </div>
        </div>
      </div>

      {/* Main FBW Tracker */}
      <AtticFBWTracker />
    </div>
  );
};
