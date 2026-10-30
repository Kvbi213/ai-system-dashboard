import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Cpu, Thermometer, Layers, HardDrive } from 'lucide-react';

export const HardwareMonitorCard: React.FC = () => {
  const [cpuCores, setCpuCores] = useState<number[]>([18, 35, 9, 14, 22, 6, 12, 8]);
  const [temp, setTemp] = useState(41);

  useEffect(() => {
    const timer = setInterval(() => {
      setCpuCores((prev) => prev.map(() => Math.floor(Math.random() * 28 + 6)));
      setTemp(41 + (Math.random() > 0.6 ? 1 : 0));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const avgLoad = Math.round(cpuCores.reduce((a, b) => a + b, 0) / cpuCores.length);

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 shadow-sm">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Monitor Sprzętowy (Hardware)</h3>
            <p className="text-xs text-slate-500 font-medium">8 Rdzeni CPU • RAM • V8 Engine Heap</p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shadow-sm">
          <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
          {temp}°C
        </span>
      </div>

      {/* 8 CPU Cores Grid */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-600">
          <span>Obciążenie procesora (Średnia)</span>
          <span className="text-sky-700 font-bold">{avgLoad}%</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {cpuCores.map((load, idx) => (
            <div key={idx} className="p-1.5 rounded-lg bg-white border border-slate-200 text-center shadow-xs">
              <div className="text-[9px] font-mono text-slate-400">C{idx + 1}</div>
              <div className="h-8 w-full bg-slate-100 rounded my-1 flex items-end overflow-hidden">
                <div
                  className="w-full bg-sky-500 transition-all duration-700 rounded-b"
                  style={{ height: `${load}%` }}
                />
              </div>
              <div className="text-[9px] font-mono font-bold text-slate-700">{load}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* RAM & Heap Progress */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
            <HardDrive className="w-3 h-3 text-indigo-600" />
            <span>Pamięć RAM</span>
          </div>
          <div className="text-xs font-black font-mono text-slate-900">4.2 GB / 16 GB</div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '26%' }}></div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
            <Layers className="w-3 h-3 text-sky-600" />
            <span>V8 Engine Heap</span>
          </div>
          <div className="text-xs font-black font-mono text-slate-900">184 MB / 512 MB</div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full" style={{ width: '36%' }}></div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
