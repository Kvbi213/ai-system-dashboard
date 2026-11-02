import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Box, Play, CheckCircle2, Cpu, HardDrive } from 'lucide-react';
import { systemApi } from '../../../api/client';

export interface DockerContainerItem {
  name: string;
  image: string;
  status: 'running' | 'restarting' | 'stopped';
  ports: string;
  memUsageMb: number;
  cpuPercent: number;
  uptime: string;
}

const FALLBACK_CONTAINERS: DockerContainerItem[] = [
  { name: 'omnidash-web', image: 'nginx:1.27-alpine', status: 'running', ports: '3000:80', memUsageMb: 18, cpuPercent: 0.8, uptime: '14 dni' },
  { name: 'omnidash-api', image: 'node:22-alpine', status: 'running', ports: '5000:5000', memUsageMb: 84, cpuPercent: 2.1, uptime: '14 dni' },
  { name: 'omnidash-worker', image: 'node:22-alpine', status: 'running', ports: 'internal', memUsageMb: 52, cpuPercent: 1.4, uptime: '14 dni' },
  { name: 'omnidash-db', image: 'postgres:16-alpine', status: 'running', ports: '5432:5432', memUsageMb: 112, cpuPercent: 1.9, uptime: '28 dni' },
  { name: 'omnidash-redis', image: 'redis:7-alpine', status: 'running', ports: '6379:6379', memUsageMb: 24, cpuPercent: 0.4, uptime: '28 dni' }
];

export const DockerContainersGrid: React.FC = () => {
  const [containers, setContainers] = useState<DockerContainerItem[]>(FALLBACK_CONTAINERS);

  useEffect(() => {
    systemApi.getStatus()
      .then((res) => {
        if (res?.containers && res.containers.length > 0) {
          setContainers(res.containers);
        }
      })
      .catch(() => {
        // Fallback maintained
      });
  }, []);

  const runningCount = containers.filter((c) => c.status === 'running').length;

  return (
    <GlassCard className="p-4 sm:p-5" glow="none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 shadow-sm">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Kontenery Docker Compose</h3>
            <p className="text-xs text-slate-500 font-medium">Architektura mikro-usług w kontenerach</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 font-mono shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{runningCount}/{containers.length} DZIAŁAJĄCE</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {containers.map((c) => (
          <div
            key={c.name}
            className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                <Play className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold font-mono text-slate-900">{c.name}</h4>
                  <Badge variant="success">{c.status}</Badge>
                  <span className="text-[10px] font-mono text-slate-400">({c.image})</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Porty: {c.ports} • Uptime: {c.uptime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-600 shrink-0 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-sky-600" /> {c.cpuPercent}%
              </span>
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-indigo-600" /> {c.memUsageMb} MB
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
