import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { AlertTriangle, Thermometer, CloudRain, CheckCircle2 } from 'lucide-react';
import { trafficApi } from '../../../api/client';

export interface RouteAlertItem {
  name: string;
  distanceKm: number;
  estimatedTimeMin: number;
  condition: string;
  roadTemp: number;
  hasAlert: boolean;
}

const FALLBACK_ROUTES: RouteAlertItem[] = [
  {
    name: 'Trasa Miejska Codzienna (Odcinek Północny DK)',
    distanceKm: 8.5,
    estimatedTimeMin: 14,
    condition: 'Płynny ruch bez zatorów',
    roadTemp: 13,
    hasAlert: false
  },
  {
    name: 'Korytarz Tranzytowy Regionalny (Autostrada A1)',
    distanceKm: 58.0,
    estimatedTimeMin: 46,
    condition: 'Zwężenie na pasie włączeniowym (roboty drogowe)',
    roadTemp: 12,
    hasAlert: true
  }
];

export const RouteAlertsCard: React.FC = () => {
  const [routes, setRoutes] = useState<RouteAlertItem[]>(FALLBACK_ROUTES);

  useEffect(() => {
    trafficApi.getAlerts()
      .then((res) => {
        if (res?.routes && res.routes.length > 0) {
          setRoutes(res.routes);
        }
      })
      .catch(() => {
        // Fallback maintained
      });
  }, []);

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Status Tras i Utrudnienia GDDKiA</h3>
            <p className="text-xs text-slate-500 font-medium">Bieżące informacje z systemu telemetrii drogowej</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-sm">
          <Thermometer className="w-3.5 h-3.5 text-sky-600" />
          <span>Jezdnia: 12.5°C</span>
        </div>
      </div>

      <div className="space-y-3">
        {routes.map((rt, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-900">{rt.name}</p>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                  {rt.distanceKm} km • ~{rt.estimatedTimeMin} min
                </span>
              </div>
              <p className={`text-xs mt-1 font-medium flex items-center gap-1.5 ${rt.hasAlert ? 'text-amber-800' : 'text-emerald-700'}`}>
                {rt.hasAlert ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{rt.condition}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 shrink-0">
              <CloudRain className="w-3.5 h-3.5 text-sky-500" />
              <span>Opady: 0% (Sucho)</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
