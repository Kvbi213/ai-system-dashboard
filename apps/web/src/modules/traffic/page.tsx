import React from 'react';
import { TrafficCameraCard } from './components/TrafficCameraCard';
import { Radio, ShieldAlert, RefreshCw } from 'lucide-react';

export const TrafficPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-rose-400" />
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Radary CANARD i Kamery GDDKiA</h2>
            <p className="text-xs text-slate-400">Monitoring trasy dom ↔ ZSE / Trójmiasto</p>
          </div>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Odśwież</span>
        </button>
      </div>

      {/* Safety Notice */}
      <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-sky-400 shrink-0" />
        <p>
          System weryfikuje publiczne rejestry CANARD oraz telemetrię kamer w czasie rzeczywistym. Brak zgłoszonych kontroli kaskadowych w promieniu 15 km.
        </p>
      </div>

      {/* Camera Nodes */}
      <TrafficCameraCard />
    </div>
  );
};
