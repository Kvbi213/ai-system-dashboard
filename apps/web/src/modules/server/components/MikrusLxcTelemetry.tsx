import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Server, Activity, Network, HardDrive, Cpu } from 'lucide-react';

export const MikrusLxcTelemetry: React.FC = () => {
  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 shadow-sm">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Węzeł VPS Mikr.us (Kontener LXC)</h3>
            <p className="text-xs text-slate-500 font-medium">Infrastruktura brzegowa Linux Debian 12</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 font-mono shadow-sm">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>UPTIME 48D</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-slate-600 font-semibold">
              <Cpu className="w-3.5 h-3.5 text-sky-600" /> Rdzeń CPU
            </span>
            <span className="font-mono font-bold text-slate-900">18% (Load: 0.22)</span>
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full" style={{ width: '18%' }} />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-slate-600 font-semibold">
              <HardDrive className="w-3.5 h-3.5 text-indigo-600" /> Pamięć RAM
            </span>
            <span className="font-mono font-bold text-slate-900">382 / 1024 MB</span>
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: '37%' }} />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-slate-600 font-semibold">
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" /> Dysk NVMe
            </span>
            <span className="font-mono font-bold text-slate-900">4.8 / 15.0 GB</span>
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '32%' }} />
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-100/70 border border-slate-200 text-xs font-mono space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-600 font-sans font-semibold">
            <Network className="w-3.5 h-3.5 text-sky-600" /> Cloudflare Tunnel (cloudflared):
          </span>
          <span className="text-emerald-700 font-bold">CONNECTED (QUIC / HTTP3)</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Routing sieciowy:</span>
          <span className="font-bold text-slate-700">IPv6-mostly + Nginx Real-IP Header</span>
        </div>
      </div>
    </GlassCard>
  );
};
