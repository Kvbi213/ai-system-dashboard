import React, { useState, useEffect } from 'react';
import { LayoutGrid, Cpu, Sliders, Plus, Activity, MemoryStick, Wifi, HardDrive, Check } from 'lucide-react';
import SystemMonitor from '../components/SystemMonitor';
import CryptoTracker from '../components/CryptoTracker';
import NetworkMonitor from '../components/NetworkMonitor';
import QuickNotes from '../components/QuickNotes';
import TokenTracker from '../components/TokenTracker';
import ModelStatus from '../components/ModelStatus';
import PromptVault from '../components/PromptVault';
import AgentQueue from '../components/AgentQueue';

const WidgetsPage = () => {
  const [activeWidgets, setActiveWidgets] = useState({
    systemMonitor: true,
    networkMonitor: true,
    cryptoTracker: true,
    quickNotes: true,
    tokenTracker: true,
    modelStatus: true,
    promptVault: true,
    agentQueue: true
  });
  const [density, setDensity] = useState('dense'); // 'compact' | 'dense'
  const [showConfig, setShowConfig] = useState(false);
  const [coreTelemetry, setCoreTelemetry] = useState({
    cpu: 14,
    cores: [18, 35, 9, 14, 22, 11, 40, 16],
    ramUsed: 4.2,
    ramTotal: 16.0,
    temp: 41
  });

  useEffect(() => {
    const saved = localStorage.getItem('system_active_widgets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') setActiveWidgets(parsed);
      } catch (e) {
        console.warn(e);
      }
    }

    const handler = (e) => {
      setActiveWidgets(e.detail);
    };

    window.addEventListener('activeWidgetsChanged', handler);
    return () => window.removeEventListener('activeWidgetsChanged', handler);
  }, []);

  const toggleWidget = (key) => {
    const updated = { ...activeWidgets, [key]: !activeWidgets[key] };
    setActiveWidgets(updated);
    localStorage.setItem('system_active_widgets', JSON.stringify(updated));
  };

  const activeCount = Object.values(activeWidgets).filter(Boolean).length;
  const totalCount = Object.keys(activeWidgets).length;

  return (
    <div className="flex flex-col h-full overflow-y-auto p-2 sm:p-4 lg:p-6 pb-20 md:pb-6 space-y-space-md text-on-surface">
      {/* Top Command & Telemetry Status Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md pb-space-xs border-b border-white/[0.08]">
        <div className="flex flex-col">
          <nav aria-label="breadcrumb" className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
            <span className="text-on-surface-variant font-medium">OmniDash</span>
            <span className="text-outline-variant">/</span>
            <span>System Management</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-medium">Widżety &amp; Metryki</span>
          </nav>
          <div className="flex items-center gap-space-md mt-space-xs flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
              Siatka Monitoringu &amp; Telemetria
            </h1>
            <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container-high border border-white/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span className="font-code-mono text-label-sm text-primary uppercase tracking-wider">SSE LIVE (1000ms)</span>
            </div>
          </div>
        </div>

        {/* Actions Control Set */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="flex items-center rounded-lg bg-surface-container-low p-1 border border-white/[0.08]">
            <button
              onClick={() => setDensity('compact')}
              className={`px-space-sm py-1 rounded font-label-md text-label-md transition-colors ${
                density === 'compact' ? 'bg-surface-container-high text-on-surface font-bold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Kompaktowy
            </button>
            <button
              onClick={() => setDensity('dense')}
              className={`px-space-sm py-1 rounded font-label-md text-label-md transition-colors ${
                density === 'dense' ? 'bg-surface-container-high text-on-surface font-bold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Zagęszczony (Pro)
            </button>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors font-label-md text-label-md border border-white/[0.08]"
          >
            <Sliders className="w-4 h-4 text-primary" />
            <span>Personalizuj Kafelki</span>
            <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-primary font-code-mono text-label-sm">
              {activeCount}/{totalCount}
            </span>
          </button>
        </div>
      </div>

      {/* Hardware Telemetry Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        <div className="rounded-xl bg-surface-container-low p-space-md border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-primary" />
              CPU Aggregated
            </span>
            <span className="font-code-mono text-label-sm text-primary font-bold">{coreTelemetry.cpu}%</span>
          </div>
          <div className="grid grid-cols-8 gap-1 pt-space-xs">
            {coreTelemetry.cores.map((load, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="w-full bg-surface-container-high rounded-full h-10 flex flex-col justify-end p-0.5">
                  <div className="w-full bg-primary rounded-full" style={{ height: `${load}%` }}></div>
                </div>
                <span className="font-code-mono text-[9px] text-outline">c{idx}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-low p-space-md border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-secondary" />
              Pamięć RAM
            </span>
            <span className="font-code-mono text-label-sm text-secondary font-bold">
              {coreTelemetry.ramUsed} / {coreTelemetry.ramTotal} GB
            </span>
          </div>
          <div className="space-y-2 pt-2">
            <div className="w-full bg-surface-container-highest h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${(coreTelemetry.ramUsed / coreTelemetry.ramTotal) * 100}%` }}></div>
            </div>
            <div className="flex justify-between font-code-mono text-label-sm text-on-surface-variant">
              <span>Bufor V8: 184 MB</span>
              <span className="text-secondary">26.2% Obciążenia</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-low p-space-md border border-white/[0.08] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-tertiary" />
              Temperatura &amp; Status
            </span>
            <span className="font-code-mono text-label-sm text-tertiary font-bold">{coreTelemetry.temp}°C NOMINAL</span>
          </div>
          <div className="pt-2 flex items-center justify-between font-code-mono text-xs text-on-surface-variant">
            <span>Wentylatory: 1800 RPM</span>
            <span className="text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> Chłodzenie Pasywne
            </span>
          </div>
        </div>
      </div>

      {/* Tile Config Drawer / Filter Bar */}
      {showConfig && (
        <div className="p-space-md rounded-xl bg-surface-container border border-white/[0.08] animate-soft-enter">
          <span className="font-code-mono text-xs text-outline uppercase tracking-wider block mb-2">
            Przełącz Widoczność Modułów Telemetrycznych:
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.keys(activeWidgets).map(key => (
              <button
                key={key}
                onClick={() => toggleWidget(key)}
                className={`px-3 py-1.5 rounded-lg font-code-mono text-xs flex items-center gap-1.5 border transition-all ${
                  activeWidgets[key]
                    ? 'bg-primary/20 border-primary text-primary font-semibold'
                    : 'bg-surface-container-lowest border-white/[0.08] text-outline hover:text-on-surface'
                }`}
              >
                {activeWidgets[key] && <Check className="w-3.5 h-3.5" />}
                <span>{key}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Primary Widget Grid Canvas */}
      <main className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 flex-1 min-h-0 overflow-y-auto pr-0 sm:pr-1 pb-6 custom-scrollbar ${
        density === 'compact' ? 'auto-rows-[300px]' : 'auto-rows-[360px]'
      }`}>
        {/* System Monitor Widget */}
        {activeWidgets.systemMonitor && (
          <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/[0.08] bg-surface-container-low shadow-sm">
            <SystemMonitor />
          </div>
        )}

        {/* Network Monitor */}
        {activeWidgets.networkMonitor && (
          <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/[0.08] bg-surface-container-low shadow-sm">
            <NetworkMonitor />
          </div>
        )}

        {/* Crypto Tracker */}
        {activeWidgets.cryptoTracker && (
          <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/[0.08] bg-surface-container-low shadow-sm">
            <CryptoTracker />
          </div>
        )}

        {/* Quick Notes */}
        {activeWidgets.quickNotes && (
          <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/[0.08] bg-surface-container-low shadow-sm">
            <QuickNotes />
          </div>
        )}

        {/* Token Tracker */}
        {activeWidgets.tokenTracker && (
          <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/[0.08] bg-surface-container-low shadow-sm">
            <TokenTracker />
          </div>
        )}

        {/* Model Status */}
        {activeWidgets.modelStatus && (
          <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/[0.08] bg-surface-container-low shadow-sm">
            <ModelStatus />
          </div>
        )}

        {/* Prompt Vault */}
        {activeWidgets.promptVault && (
          <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/[0.08] bg-surface-container-low shadow-sm">
            <PromptVault />
          </div>
        )}

        {/* Agent Queue */}
        {activeWidgets.agentQueue && (
          <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/[0.08] bg-surface-container-low shadow-sm">
            <AgentQueue />
          </div>
        )}
      </main>
    </div>
  );
};

export default WidgetsPage;
