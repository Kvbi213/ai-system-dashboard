import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { ShieldCheck, Activity } from 'lucide-react';

const NODES = [
  { id: 'api', name: 'API Gateway', port: '5000', latency: '12ms', status: 'online' },
  { id: 'web', name: 'Frontend SPA', port: '3000', latency: '4ms', status: 'online' },
  { id: 'worker', name: 'Worker Daemon', port: 'LXC', latency: '8ms', status: 'online' },
  { id: 'db', name: 'PostgreSQL 16', port: '5432', latency: '2ms', status: 'online' },
  { id: 'redis', name: 'Redis Cache', port: '6379', latency: '1ms', status: 'online' }
];

export const OperationalNodesWidget: React.FC = () => {
  return (
    <GlassCard className="p-4 sm:p-5" glow="none">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Usługi i Węzły Operacyjne</h3>
            <p className="text-xs text-slate-500 font-medium">Monitoring stanu klastra mikroserwisów</p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          5/5 Węzłów OK (0 anomalii)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {NODES.map((node) => (
          <div
            key={node.id}
            className="p-2.5 rounded-xl bg-white/80 border border-slate-200 hover:border-emerald-300 hover:bg-white transition-all shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-slate-400 font-bold">:{node.port}</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 truncate">{node.name}</div>
            <div className="text-[10px] font-mono text-emerald-700 font-semibold mt-0.5">{node.latency} • Sprawny</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
