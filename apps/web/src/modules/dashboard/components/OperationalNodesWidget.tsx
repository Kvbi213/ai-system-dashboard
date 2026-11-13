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
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Usługi systemowe</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">Stan lokalnych procesów</p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          5/5 aktywnych
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {NODES.map((node) => (
          <div
            key={node.id}
            className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-slate-400 font-medium">:{node.port}</span>
              <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </div>
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{node.name}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{node.latency} • Działa</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
