import React from 'react';
import { AtticFBWTracker } from './components/AtticFBWTracker';
import { Dumbbell, Flame, CheckCircle } from 'lucide-react';

export const WorkoutsPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header Stats */}
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
            <p className="text-xs text-slate-500 font-semibold">Aktualny plan</p>
            <p className="text-sm font-bold text-sky-800">FBW Podciąganie A</p>
          </div>
        </div>
      </div>

      {/* Main FBW Tracker */}
      <AtticFBWTracker />
    </div>
  );
};
