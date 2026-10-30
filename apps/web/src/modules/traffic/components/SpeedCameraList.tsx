import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Radio, ShieldCheck, MapPin, Gauge } from 'lucide-react';

export interface RadarPoint {
  id: string;
  road: string;
  location: string;
  type: 'stacjonarny' | 'odcinkowy' | 'czerwone_swiatlo';
  speedLimit: number;
  deviceModel: string;
  active: boolean;
}

const RADARS: RadarPoint[] = [
  { id: 'r1', road: 'DK / Obwodnica', location: 'Strefa Miejska (Aleja Główna)', type: 'stacjonarny', speedLimit: 50, deviceModel: 'Mesta Fusion RN', active: true },
  { id: 'r2', road: 'DK22 / Region', location: 'Odcinek Leśny / Trasa Regionalna', type: 'odcinkowy', speedLimit: 70, deviceModel: 'CANARD OPP v3', active: true },
  { id: 'r3', road: 'Autostrada A1', location: 'Węzeł Autostradowy Wschód', type: 'stacjonarny', speedLimit: 140, deviceModel: 'TraffiStar SR520', active: true },
  { id: 'r4', road: 'DK / DW', location: 'Skrzyżowanie Tranzytowe Obwodnicy', type: 'czerwone_swiatlo', speedLimit: 50, deviceModel: 'RedLight Camera', active: true }
];

export const SpeedCameraList: React.FC = () => {
  return (
    <GlassCard className="p-4 sm:p-5" glow="none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Rejestr Fotoradarów CANARD</h3>
            <p className="text-xs text-slate-500 font-medium">Oficjalne punkty pomiaru prędkości</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 shadow-sm">
          {RADARS.length} stacje aktywne
        </span>
      </div>

      <div className="space-y-2.5">
        {RADARS.map((radar) => (
          <div
            key={radar.id}
            className="flex items-center justify-between p-3 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-mono font-bold text-xs text-rose-700 shrink-0 border border-slate-200">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{radar.location}</h4>
                  <Badge variant={radar.type === 'odcinkowy' ? 'danger' : radar.type === 'stacjonarny' ? 'warning' : 'purple'}>
                    {radar.type === 'odcinkowy' ? 'Odcinkowy OPP' : radar.type === 'stacjonarny' ? 'Stacjonarny' : 'Czerwone światło'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>Trasa {radar.road} • Model: {radar.deviceModel}</span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-sm block">
                {radar.speedLimit} km/h
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1 justify-end">
                <ShieldCheck className="w-3 h-3" /> Aktywny
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
