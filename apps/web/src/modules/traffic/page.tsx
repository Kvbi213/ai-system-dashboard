import React from 'react';
import { TrafficCameraCard } from './components/TrafficCameraCard';
import { Radio, ShieldAlert, RefreshCw } from 'lucide-react';

export const TrafficPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-rose-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Radary CANARD i Kamery GDDKiA</h2>
            <p className="text-xs text-slate-500 font-medium">Monitoring trasy dom ↔ ZSE / Trójmiasto</p>
          </div>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 hover:text-slate-900 font-semibold transition shadow-sm">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Odśwież</span>
        </button>
      </div>

      {/* Safety Notice */}
      <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200/90 text-xs text-sky-800 flex items-center gap-3 shadow-sm font-medium">
        <ShieldAlert className="w-5 h-5 text-sky-600 shrink-0" />
        <p>
          System weryfikuje publiczne rejestry CANARD oraz telemetrię kamer w czasie rzeczywistym. Brak zgłoszonych kontroli kaskadowych w promieniu 15 km.
        </p>
      </div>

      {/* Camera Nodes */}
      <TrafficCameraCard />
    </div>
  );
};
