import React, { useState, useEffect } from 'react';
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
    hardware: true,
    market: true,
    networkMonitor: true,
    cryptoTracker: true,
    quickNotes: true,
    tokenTracker: true,
    modelStatus: true,
    promptVault: true,
    agentQueue: true
  });

  const [density, setDensity] = useState('dense');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cpuTelemetry, setCpuTelemetry] = useState({
    aggregated: 12,
    cores: [18, 35, 9, 14, 22, 6, 12, 8],
    ramUsed: 4.2,
    ramTotal: 16.0,
    ramPct: 26,
    v8Used: 184,
    v8Total: 512,
    v8Pct: 35.9,
    temp: 41
  });

  useEffect(() => {
    // Dynamic simulated core fluctuations for vivid telemetry feel
    const interval = setInterval(() => {
      setCpuTelemetry(prev => {
        const newAggregated = Math.floor(Math.random() * 8 + 10);
        const newCores = prev.cores.map(() => Math.floor(Math.random() * 32 + 5));
        return {
          ...prev,
          aggregated: newAggregated,
          cores: newCores,
          temp: 41 + (Math.random() > 0.5 ? 1 : 0)
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const toggleWidget = (key) => {
    setActiveWidgets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeCount = Object.values(activeWidgets).filter(Boolean).length;
  const totalCount = Object.keys(activeWidgets).length;

  return (
    <div className="flex flex-col w-full space-y-space-md pb-space-xl">
      {/* Top Command & Telemetry Status Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md pb-space-xs border-b border-white/[0.04]">
        <div className="flex flex-col">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
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
            <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container-high border border-white/[0.05]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-code-mono text-label-sm text-primary uppercase tracking-wider">
                SSE LIVE (1000ms)
              </span>
            </div>
          </div>
        </div>

        {/* Actions Control Set */}
        <div className="flex flex-wrap items-center gap-space-sm">
          {/* View mode switcher */}
          <div className="flex items-center rounded-lg bg-surface-container-low p-1 border border-white/[0.06]">
            <button
              onClick={() => setDensity('compact')}
              className={`px-space-sm py-1 rounded font-label-md text-label-md transition-all apple-press ${
                density === 'compact'
                  ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Kompaktowy
            </button>
            <button
              onClick={() => setDensity('dense')}
              className={`px-space-sm py-1 rounded font-label-md text-label-md transition-all apple-press ${
                density === 'dense'
                  ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Zagęszczony (Pro)
            </button>
          </div>

          {/* Personalize drawer trigger */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors font-label-md text-label-md apple-press border border-white/[0.04]"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">tune</span>
            <span>Personalizuj Kafelki</span>
            <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-primary font-code-mono text-label-sm">
              {activeCount}/{totalCount}
            </span>
          </button>
        </div>
      </div>

      {/* Drawer konfiguratora kafelków */}
      {isDrawerOpen && (
        <div className="p-space-md rounded-xl bg-surface-container-low border border-white/[0.08] shadow-lg animate-soft-enter">
          <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-white/[0.04]">
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              Konfigurator Widoczności Widżetów
            </span>
            <button onClick={() => setIsDrawerOpen(false)} className="text-outline hover:text-on-surface">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-space-sm">
            {Object.keys(activeWidgets).map(key => (
              <label key={key} className="flex items-center gap-space-xs p-2 rounded bg-surface-container cursor-pointer hover:bg-surface-container-high transition-colors">
                <input
                  type="checkbox"
                  checked={activeWidgets[key]}
                  onChange={() => toggleWidget(key)}
                  className="rounded bg-surface-container-lowest text-primary focus:ring-0"
                />
                <span className="font-code-mono text-label-sm text-on-surface capitalize truncate">
                  {key}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Primary Asymmetric Grid Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-space-md w-full">
        {/* 1. HARDWARE MONITOR & CPU / RAM / V8 (xl:col-span-4) */}
        {activeWidgets.hardware && (
          <div className="xl:col-span-4 rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between shadow-sm relative overflow-hidden group border border-white/[0.05]">
            <div className="flex items-center justify-between pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[18px]">memory</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold uppercase tracking-wider">
                  Hardware Monitor
                </span>
              </div>
              <div className="flex items-center gap-space-xs font-code-mono text-label-sm text-on-surface-variant">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{cpuTelemetry.temp}°C NOMINAL</span>
              </div>
            </div>

            {/* CPU Metric Master */}
            <div className="mt-space-xs rounded-lg bg-surface-container p-space-sm">
              <div className="flex items-baseline justify-between">
                <span className="font-label-sm text-label-sm uppercase text-outline">CPU Aggregated</span>
                <div className="flex items-baseline gap-space-xs font-code-mono">
                  <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
                    {cpuTelemetry.aggregated}
                  </span>
                  <span className="text-label-sm text-outline">%</span>
                </div>
              </div>

              {/* 8 Logic Cores Equalizer Bars */}
              <div className="grid grid-cols-8 gap-1 mt-space-sm pt-space-xs">
                {cpuTelemetry.cores.map((coreVal, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className="w-full bg-surface-container-high rounded-full h-12 flex flex-col justify-end p-0.5">
                      <div
                        className="w-full bg-primary rounded-full transition-all duration-300"
                        style={{ height: `${coreVal}%` }}
                      />
                    </div>
                    <span className="font-code-mono text-[9px] text-outline">c{idx}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RAM & V8 Dual Meter */}
            <div className="grid grid-cols-2 gap-space-sm mt-space-sm">
              <div className="rounded-lg bg-surface-container p-space-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-outline uppercase">RAM Użycie</span>
                  <span className="font-code-mono text-label-sm text-secondary font-medium">
                    {cpuTelemetry.ramPct}%
                  </span>
                </div>
                <div className="my-space-xs font-code-mono">
                  <span className="font-headline-md text-headline-md font-semibold text-on-surface">
                    {cpuTelemetry.ramUsed}
                  </span>
                  <span className="text-label-sm text-outline">/ {cpuTelemetry.ramTotal} GB</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-1 overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${cpuTelemetry.ramPct}%` }} />
                </div>
              </div>

              <div className="rounded-lg bg-surface-container p-space-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-outline uppercase">V8 Sterta</span>
                  <span className="font-code-mono text-label-sm text-tertiary font-medium">
                    {cpuTelemetry.v8Pct}%
                  </span>
                </div>
                <div className="my-space-xs font-code-mono">
                  <span className="font-headline-md text-headline-md font-semibold text-on-surface">
                    {cpuTelemetry.v8Used}
                  </span>
                  <span className="text-label-sm text-outline">/ {cpuTelemetry.v8Total} MB</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-1 overflow-hidden">
                  <div className="bg-tertiary h-full rounded-full" style={{ width: `${cpuTelemetry.v8Pct}%` }} />
                </div>
              </div>
            </div>

            {/* Metadata Footnote */}
            <div className="flex items-center justify-between mt-space-sm pt-space-xs font-code-mono text-[10px] text-outline border-t border-white/[0.04]">
              <span>Arch: x86_64 Core-i7</span>
              <span>PID: 10421 (Node v20.11)</span>
            </div>
          </div>
        )}

        {/* 2. MARKET WATCH & WALUTY / KRYPTO (xl:col-span-4) */}
        {activeWidgets.market && (
          <div className="xl:col-span-4 rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between shadow-sm border border-white/[0.05]">
            <div className="flex items-center justify-between pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[18px]">candlestick_chart</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold uppercase tracking-wider">
                  Market Telemetry
                </span>
              </div>
              <span className="font-code-mono text-label-sm text-outline">NBP &amp; Binance Spot</span>
            </div>

            <div className="space-y-space-xs flex-1 flex flex-col justify-around">
              {/* USD/PLN */}
              <div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors">
                <div className="flex flex-col">
                  <span className="font-code-mono text-label-md text-on-surface font-semibold">USD/PLN</span>
                  <span className="font-code-mono text-[10px] text-outline">NBP Fix C</span>
                </div>
                <svg className="w-20 h-5" fill="none" viewBox="0 0 80 20">
                  <polyline className="text-error" points="0,6 15,9 30,7 45,14 60,11 80,16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
                <div className="text-right font-code-mono">
                  <div className="text-on-surface font-medium text-body-md">3.9602</div>
                  <div className="text-error text-label-sm">-0.24%</div>
                </div>
              </div>

              {/* EUR/PLN */}
              <div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors">
                <div className="flex flex-col">
                  <span className="font-code-mono text-label-md text-on-surface font-semibold">EUR/PLN</span>
                  <span className="font-code-mono text-[10px] text-outline">NBP Fix A</span>
                </div>
                <svg className="w-20 h-5" fill="none" viewBox="0 0 80 20">
                  <polyline className="text-secondary" points="0,14 18,12 36,15 54,8 68,10 80,5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
                <div className="text-right font-code-mono">
                  <div className="text-on-surface font-medium text-body-md">4.3120</div>
                  <div className="text-secondary text-label-sm">+0.12%</div>
                </div>
              </div>

              {/* BTC/USD */}
              <div className="flex items-center justify-between p-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors">
                <div className="flex flex-col">
                  <span className="font-code-mono text-label-md text-on-surface font-semibold">BTC/USD</span>
                  <span className="font-code-mono text-[10px] text-outline">Binance Spot</span>
                </div>
                <svg className="w-20 h-5" fill="none" viewBox="0 0 80 20">
                  <polyline className="text-primary" points="0,16 20,13 40,8 60,10 80,3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
                <div className="text-right font-code-mono">
                  <div className="text-on-surface font-medium text-body-md">67,420</div>
                  <div className="text-primary text-label-sm">+2.84%</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-space-sm pt-space-xs font-code-mono text-[10px] text-outline border-t border-white/[0.04]">
              <span>Częstotliwość: 60s polling</span>
              <span className="text-secondary">Płynność wysoka</span>
            </div>
          </div>
        )}

        {/* 3. SYSTEM MONITOR (xl:col-span-4) */}
        {activeWidgets.networkMonitor && (
          <div className="xl:col-span-4 rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between shadow-sm border border-white/[0.05]">
            <SystemMonitor />
          </div>
        )}

        {/* 4. CRYPTO TRACKER (xl:col-span-6) */}
        {activeWidgets.cryptoTracker && (
          <div className="xl:col-span-6 rounded-xl bg-surface-container-low p-space-md shadow-sm border border-white/[0.05]">
            <CryptoTracker />
          </div>
        )}

        {/* 5. NETWORK MONITOR (xl:col-span-6) */}
        {activeWidgets.networkMonitor && (
          <div className="xl:col-span-6 rounded-xl bg-surface-container-low p-space-md shadow-sm border border-white/[0.05]">
            <NetworkMonitor />
          </div>
        )}

        {/* 6. QUICK NOTES & PROMPTS (xl:col-span-6) */}
        {activeWidgets.quickNotes && (
          <div className="xl:col-span-6 rounded-xl bg-surface-container-low p-space-md shadow-sm border border-white/[0.05]">
            <QuickNotes />
          </div>
        )}

        {/* 7. TOKEN TRACKER & AI QUEUE (xl:col-span-6) */}
        {activeWidgets.tokenTracker && (
          <div className="xl:col-span-6 rounded-xl bg-surface-container-low p-space-md shadow-sm border border-white/[0.05]">
            <TokenTracker />
          </div>
        )}

        {/* 8. AGENT QUEUE (xl:col-span-12) */}
        {activeWidgets.agentQueue && (
          <div className="xl:col-span-12 rounded-xl bg-surface-container-low p-space-md shadow-sm border border-white/[0.05]">
            <AgentQueue />
          </div>
        )}
      </div>
    </div>
  );
};

export default WidgetsPage;
