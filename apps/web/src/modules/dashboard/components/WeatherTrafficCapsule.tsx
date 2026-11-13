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
  city = 'Strefa miejska / trasa główna',
  radarAlertsCount = 0,
  trafficStatus = 'płynny'
}) => {
  return (
    <GlassCard className="p-4 sm:p-5 flex flex-col justify-between w-full h-full" glow="none">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Okolica i dojazd
            </h3>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{city}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium border border-slate-200/80 dark:border-slate-700">
          <CloudRain className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>{temperature}°C</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Fotoradary CANARD</p>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {radarAlertsCount === 0 ? 'Brak alertów' : `${radarAlertsCount} aktywne`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Ruch DK22 / A1</p>
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
