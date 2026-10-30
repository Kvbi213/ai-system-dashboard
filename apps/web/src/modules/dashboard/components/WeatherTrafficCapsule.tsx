import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { CloudRain, Compass, AlertTriangle, ShieldCheck } from 'lucide-react';

interface WeatherTrafficCapsuleProps {
  temperature?: number;
  city?: string;
  radarAlertsCount?: number;
  trafficStatus?: 'płynny' | 'utrudnienia' | 'zator';
}

export const WeatherTrafficCapsule: React.FC<WeatherTrafficCapsuleProps> = ({
  temperature = 12,
  city = 'Starogard Gdański',
  radarAlertsCount = 0,
  trafficStatus = 'płynny'
}) => {
  return (
    <GlassCard className="p-4 flex flex-col justify-between" glow="sky">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Okolica i Trasa
            </h3>
            <p className="text-sm font-bold text-slate-100">{city}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-sky-300 font-mono text-sm font-semibold">
          <CloudRain className="w-4 h-4 text-sky-400" />
          <span>{temperature}°C</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 font-medium">CANARD Radary</p>
            <p className="text-xs font-semibold text-emerald-300">
              {radarAlertsCount === 0 ? 'Brak fotoradarów' : `${radarAlertsCount} aktywne`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 font-medium">Ruch DK22 / A1</p>
            <div className="mt-0.5">
              <Badge variant={trafficStatus === 'płynny' ? 'success' : 'warning'}>
                {trafficStatus}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
