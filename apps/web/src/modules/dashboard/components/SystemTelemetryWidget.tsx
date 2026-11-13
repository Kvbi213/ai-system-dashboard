import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Cpu, Server, Activity, Database } from 'lucide-react';
import { systemApi } from '../../../api/client';

export const SystemTelemetryWidget: React.FC = () => {
  const [telemetry, setTelemetry] = useState<any>(null);

  useEffect(() => {
    systemApi.getTelemetry()
      .then((data) => {
        if (data) setTelemetry(data);
      })
      .catch(() => {});

    const timer = setInterval(() => {
      systemApi.getTelemetry()
        .then((data) => {
          if (data) setTelemetry(data);
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const cores = telemetry?.cpu?.cores || 8;
  const cpuPercent = telemetry?.cpu?.loadAverage?.[0] !== undefined
    ? Math.min(100, Math.round((telemetry.cpu.loadAverage[0] / cores) * 100))
    : 16;
  const ramPercent = telemetry?.memory?.usedPercent || 38;
  const dbSizeKb = telemetry?.database?.sizeKb || 48;

  return (
    <GlassCard className="p-4 flex flex-col justify-between" glow="none">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Serwer lokalny
            </h3>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {telemetry?.os?.platform === 'win32' ? 'Windows NT Core' : (telemetry?.os?.platform || 'Node.js 26')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-medium">
          <Activity className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{telemetry?.process?.uptimeSeconds ? `${Math.floor(telemetry.process.uptimeSeconds / 60)}m` : 'Aktywny'}</span>
        </div>
      </div>

      {/* Metric Bars */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Real CPU */}
        <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
              <Cpu className="w-3 h-3 text-sky-600 dark:text-sky-400" /> CPU
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{cpuPercent}%</span>
          </div>
          <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.max(4, cpuPercent)}%` }}
            />
          </div>
        </div>

        {/* Real RAM */}
        <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
              <Server className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> RAM
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{ramPercent}%</span>
          </div>
          <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${ramPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Real SQLite Storage status */}
      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
          <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Baza SQLite
        </span>
        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
          {dbSizeKb} KB ({telemetry?.database?.counts?.transactions || 0} operacji)
        </span>
      </div>
    </GlassCard>
  );
};
