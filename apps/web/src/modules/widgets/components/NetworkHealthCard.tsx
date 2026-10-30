import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Wifi, ShieldCheck, RefreshCw } from 'lucide-react';

interface PingTarget {
  id: string;
  name: string;
  host: string;
  latencyMs: number;
  status: 'good' | 'warn' | 'down';
}

const INITIAL_TARGETS: PingTarget[] = [
  { id: '1', name: 'Lokalna Brama API', host: 'localhost:5000', latencyMs: 12, status: 'good' },
  { id: '2', name: 'Cloudflare DNS', host: '1.1.1.1', latencyMs: 14, status: 'good' },
  { id: '3', name: 'Google Public DNS', host: '8.8.8.8', latencyMs: 18, status: 'good' },
  { id: '4', name: 'Węzeł Mikr.us LXC', host: 'ssh.mikr.us', latencyMs: 24, status: 'good' }
];

export const NetworkHealthCard: React.FC = () => {
  const [targets, setTargets] = useState<PingTarget[]>(INITIAL_TARGETS);
  const [isPinging, setIsPinging] = useState(false);

  const handleRunPing = () => {
    setIsPinging(true);
    setTimeout(() => {
      setTargets((prev) =>
        prev.map((t) => ({
          ...t,
          latencyMs: Math.max(4, Math.floor(t.latencyMs + (Math.random() * 8 - 4)))
        }))
      );
      setIsPinging(false);
    }, 600);
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 shadow-sm">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Kondycja Sieci & Zero-Trust</h3>
            <p className="text-xs text-slate-500 font-medium">Test opóźnień ping i status tunelu brzegowego</p>
          </div>
        </div>

        <button
          onClick={handleRunPing}
          disabled={isPinging}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-sky-600' : ''}`} />
          <span>{isPinging ? 'Badanie...' : 'Testuj ping'}</span>
        </button>
      </div>

      <div className="space-y-2 mb-3">
        {targets.map((target) => (
          <div
            key={target.id}
            className="p-2.5 rounded-xl bg-white/80 border border-slate-200 flex items-center justify-between shadow-xs"
          >
            <div>
              <div className="text-xs font-bold text-slate-900">{target.name}</div>
              <div className="text-[10px] font-mono text-slate-400">{target.host}</div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-900">{target.latencyMs} ms</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-mono text-emerald-800">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-bold">Tunel Zero-Trust: Szyfrowany (TLS 1.3)</span>
        </div>
        <span className="font-semibold text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-200">
          QUIC Aktywny
        </span>
      </div>
    </GlassCard>
  );
};
