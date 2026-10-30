import React, { useState } from 'react';
import { DockerContainersGrid } from './components/DockerContainersGrid';
import { MikrusLxcTelemetry } from './components/MikrusLxcTelemetry';
import { DataBackupExportCard } from './components/DataBackupExportCard';
import { Server, Box, Database, RefreshCw } from 'lucide-react';

export const ServerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'docker' | 'mikrus' | 'backup'>('docker');

  const tabs = [
    { id: 'docker', label: 'Kontenery Docker', icon: Box },
    { id: 'mikrus', label: 'Węzeł Mikr.us LXC', icon: Server },
    { id: 'backup', label: 'Kopia i Baza Danych', icon: Database }
  ] as const;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-sky-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Infrastruktura i Serwer Brzegowy</h2>
            <p className="text-xs text-slate-500 font-mono">Mikr.us Debian 12 LXC :: Docker Compose Multi-Node</p>
          </div>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 hover:text-slate-900 font-semibold transition shadow-sm">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Odśwież stan</span>
        </button>
      </div>

      {/* Category Sub-Tabs with Liquid Glass Pill Design */}
      <div className="flex gap-2 p-1.5 rounded-2xl glass-panel shadow-sm">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 border border-sky-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'docker' && <DockerContainersGrid />}
      {activeTab === 'mikrus' && <MikrusLxcTelemetry />}
      {activeTab === 'backup' && <DataBackupExportCard />}
    </div>
  );
};
