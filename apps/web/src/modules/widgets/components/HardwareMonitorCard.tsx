import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Cpu, HardDrive, Layers, Database, Activity, RefreshCw } from 'lucide-react';
import { systemApi } from '../../../api/client';

interface TelemetryState {
  os: {
    hostname: string;
    platform: string;
    arch: string;
    formattedUptime: string;
  };
  cpu: {
    model: string;
    cores: number;
    speedMhz: number;
    loadAverage: number[];
  };
  memory: {
    totalMb: number;
    freeMb: number;
    usedMb: number;
    usedPercent: number;
    processHeapUsedMb: number;
    processRssMb: number;
  };
  database: {
    engine: string;
    path: string;
    sizeKb: number;
    counts: {
      habits: number;
      transactions: number;
      tasks: number;
      automationScripts: number;
    };
  };
}

export const HardwareMonitorCard: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTelemetry = () => {
    systemApi.getTelemetry()
      .then((data) => {
        if (data && data.cpu && data.memory) {
          setTelemetry(data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTelemetry();
    const timer = setInterval(fetchTelemetry, 3500);
    return () => clearInterval(timer);
  }, []);

  const totalRamGb = telemetry ? (telemetry.memory.totalMb / 1024).toFixed(1) : '0';
  const usedRamGb = telemetry ? (telemetry.memory.usedMb / 1024).toFixed(1) : '0';
  const ramPercent = telemetry?.memory.usedPercent || 0;
  const heapMb = telemetry?.memory.processHeapUsedMb || 0;
  const coresCount = telemetry?.cpu.cores || 8;
  const cpuLoadAvg = telemetry?.cpu.loadAverage?.[0] !== undefined
    ? Math.min(100, Math.round((telemetry.cpu.loadAverage[0] / coresCount) * 100))
    : 15;

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-sm">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Monitor Węzła Operacyjnego (node:os)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {telemetry ? `${telemetry.cpu.model} (${coresCount} vCPU)` : 'Odczyt metryk telemetrycznych...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span>LIVE</span>
          </span>
          <button
            onClick={fetchTelemetry}
            className="p-1 rounded-lg text-slate-400 hover:text-sky-500 transition"
            title="Odśwież metryki"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real CPU Metric */}
      <div className="p-3 mb-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          <span className="flex items-center gap-1.5 font-bold">
            <Cpu className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Obciążenie procesora (LoadAvg 1m)
          </span>
          <span className="text-sky-600 dark:text-sky-400 font-bold">{cpuLoadAvg}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-sky-500 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${Math.max(5, cpuLoadAvg)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1.5">
          <span>Rdzenie fizyczne/logiczne: {coresCount}</span>
          <span>Uptime: {telemetry?.os.formattedUptime || 'N/A'}</span>
        </div>
      </div>

      {/* RAM & Heap Real Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
        <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
            <HardDrive className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Pamięć RAM Host</span>
          </div>
          <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
            {usedRamGb} GB / {totalRamGb} GB ({ramPercent}%)
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${ramPercent}%` }} />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Node V8 Heap Used</span>
          </div>
          <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
            {heapMb} MB (RSS: {telemetry?.memory.processRssMb || 0} MB)
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round((heapMb / 256) * 100))}%` }} />
          </div>
        </div>
      </div>

      {/* Authentic SQLite Database Telemetry */}
      {telemetry?.database && (
        <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Baza Relacyjna SQLite (Zapis na Dysku)</span>
            </span>
            <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              {telemetry.database.sizeKb} KB
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
            <div className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-400">Nawyki</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">{telemetry.database.counts.habits}</div>
            </div>
            <div className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-400">Wydatki</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">{telemetry.database.counts.transactions}</div>
            </div>
            <div className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-400">Zadania</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">{telemetry.database.counts.tasks}</div>
            </div>
            <div className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-400">Skrypty</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">{telemetry.database.counts.automationScripts}</div>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};
