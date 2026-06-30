import React, { useState, useEffect } from 'react';
import { LayoutGrid } from 'lucide-react';
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

  useEffect(() => {
    const saved = localStorage.getItem('system_active_widgets');
    if (saved) {
      setActiveWidgets(JSON.parse(saved));
    }

    const handler = (e) => {
      setActiveWidgets(e.detail);
    };

    window.addEventListener('activeWidgetsChanged', handler);
    return () => window.removeEventListener('activeWidgetsChanged', handler);
  }, []);

  return (
    <div className="flex flex-col h-full gap-5 pb-20 md:pb-0">
      <header className="glass-panel p-5 rounded-xl border border-border flex items-center gap-4 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-accentPrimary/10 border border-accentPrimary/30 flex items-center justify-center flex-shrink-0">
          <LayoutGrid className="w-5 h-5 text-accentPrimary" />
        </div>
        <div>
          <h1 className="font-mono text-xl text-accentPrimary font-bold tracking-tight">Katalog Widżetów</h1>
          <p className="font-sans text-xs text-textMuted mt-0.5">Rozszerzone moduły systemu System</p>
        </div>
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 flex-1 min-h-0 overflow-y-auto pr-1">
        
        {/* System Monitor Widget */}
        {activeWidgets.systemMonitor && (
          <div className="opacity-0 animate-fade-in-up flex flex-col gap-5" style={{ animationDelay: '100ms' }}>
            <SystemMonitor />
          </div>
        )}

        {/* Network Monitor */}
        {activeWidgets.networkMonitor && (
          <div className="opacity-0 animate-fade-in-up h-[250px] md:h-[350px]" style={{ animationDelay: '200ms' }}>
            <NetworkMonitor />
          </div>
        )}

        {/* Crypto Tracker */}
        {activeWidgets.cryptoTracker && (
          <div className="opacity-0 animate-fade-in-up h-[250px] md:h-[350px]" style={{ animationDelay: '300ms' }}>
            <CryptoTracker />
          </div>
        )}

        {/* Quick Notes */}
        {activeWidgets.quickNotes && (
          <div className="opacity-0 animate-fade-in-up h-[250px] md:h-[350px]" style={{ animationDelay: '400ms' }}>
            <QuickNotes />
          </div>
        )}

        {/* Token Tracker */}
        {activeWidgets.tokenTracker && (
          <div className="opacity-0 animate-fade-in-up h-[250px] md:h-[350px]" style={{ animationDelay: '600ms' }}>
            <TokenTracker />
          </div>
        )}

        {/* Model Status */}
        {activeWidgets.modelStatus && (
          <div className="opacity-0 animate-fade-in-up h-[250px] md:h-[350px]" style={{ animationDelay: '700ms' }}>
            <ModelStatus />
          </div>
        )}

        {/* Prompt Vault */}
        {activeWidgets.promptVault && (
          <div className="opacity-0 animate-fade-in-up h-[250px] md:h-[350px]" style={{ animationDelay: '800ms' }}>
            <PromptVault />
          </div>
        )}

        {/* Agent Queue */}
        {activeWidgets.agentQueue && (
          <div className="opacity-0 animate-fade-in-up h-[250px] md:h-[350px]" style={{ animationDelay: '900ms' }}>
            <AgentQueue />
          </div>
        )}

      </main>
    </div>
  );
};

export default WidgetsPage;
