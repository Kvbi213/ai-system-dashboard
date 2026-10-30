import React, { useState } from 'react';
import { TrafficCameraCard } from './components/TrafficCameraCard';
import { SpeedCameraList } from './components/SpeedCameraList';
import { RouteAlertsCard } from './components/RouteAlertsCard';
import { Camera, Radio, AlertTriangle, RefreshCw } from 'lucide-react';

export const TrafficPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cameras' | 'radars' | 'routes'>('cameras');

  const tabs = [
    { id: 'cameras', label: 'Kamery GDDKiA', icon: Camera },
    { id: 'radars', label: 'Radary CANARD', icon: Radio },
    { id: 'routes', label: 'Trasy i Utrudnienia', icon: AlertTriangle }
  ] as const;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-rose-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Radary CANARD i Kamery GDDKiA</h2>
            <p className="text-xs text-slate-500 font-medium">Monitoring korytarzy tranzytowych i tras miejskich</p>
          </div>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 hover:text-slate-900 font-semibold transition shadow-sm">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Odśwież telemetrię</span>
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
      {activeTab === 'cameras' && <TrafficCameraCard />}
      {activeTab === 'radars' && <SpeedCameraList />}
      {activeTab === 'routes' && <RouteAlertsCard />}
    </div>
  );
};
