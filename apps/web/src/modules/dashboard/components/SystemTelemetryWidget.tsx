import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Cpu, Server, Activity, DollarSign } from 'lucide-react';

interface SystemTelemetryWidgetProps {
  cpuUsage?: number;
  memoryUsage?: number;
  sseLatencyMs?: number;
  budgetCapZloty?: number;
  currentCostZloty?: number;
}

export const SystemTelemetryWidget: React.FC<SystemTelemetryWidgetProps> = ({
  cpuUsage = 18,
  memoryUsage = 42,
  sseLatencyMs = 24,
  budgetCapZloty = 50,
  currentCostZloty = 0
}) => {
  return (
    <GlassCard className="p-4 flex flex-col justify-between" glow="none">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Węzeł Produkcyjny
            </h3>
            <p className="text-sm font-bold text-slate-100">Docker Core LXC</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>{sseLatencyMs}ms</span>
        </div>
      </div>

      {/* Metric Bars */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* CPU */}
        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-slate-400">
              <Cpu className="w-3 h-3 text-sky-400" /> CPU
            </span>
            <span className="font-mono font-bold text-slate-200">{cpuUsage}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full transition-all"
              style={{ width: `${cpuUsage}%` }}
            />
          </div>
        </div>

        {/* RAM */}
        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-slate-400">
              <Server className="w-3 h-3 text-indigo-400" /> RAM
            </span>
            <span className="font-mono font-bold text-slate-200">{memoryUsage}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-400 h-full rounded-full transition-all"
              style={{ width: `${memoryUsage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cloud Budget Fuse */}
      <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/50 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-300 font-medium">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          Bezpiecznik GCP
        </span>
        <span className="font-mono font-bold text-emerald-400">
          {currentCostZloty.toFixed(2)} / {budgetCapZloty} PLN (0%)
        </span>
      </div>
    </GlassCard>
  );
};
