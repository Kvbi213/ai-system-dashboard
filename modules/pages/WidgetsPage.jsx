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

  return (
    <div className="flex flex-col h-full gap-4 sm:gap-5 pb-20 md:pb-0">
      <header className="glass-panel p-4 sm:p-5 rounded-xl border border-border flex items-center gap-3 sm:gap-4 flex-shrink-0 opacity-0 animate-soft-enter" style={{ animationDelay: '50ms' }}>
        <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
          <LayoutGrid className="w-5 h-5 text-textPrimary" />
        </div>
        <div className="flex flex-col">
          <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-textMuted mb-0.5">
            <span className="flex items-center text-base sm:text-lg font-medium text-textMuted/70">OmniDash</span>
            <span className="shrink-0 text-base sm:text-lg font-medium text-textMuted/70">/</span>
            <span className="flex items-center text-base sm:text-lg font-medium text-textPrimary">Widżety</span>
          </nav>
          <p className="font-sans text-xs text-textMuted mt-0.5">Rozszerzone moduły systemu</p>
        </div>
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 auto-rows-[340px] sm:auto-rows-[360px] flex-1 min-h-0 overflow-y-auto pr-0 sm:pr-1 pb-6 custom-scrollbar">
        
        {/* System Monitor Widget */}
        {activeWidgets.systemMonitor && (
          <div className="opacity-0 animate-soft-enter h-[340px] sm:h-[360px] flex flex-col" style={{ animationDelay: '100ms' }}>
            <SystemMonitor />
          </div>
        )}

        {/* Network Monitor */}
        {activeWidgets.networkMonitor && (
          <div className="opacity-0 animate-soft-enter h-[360px] flex flex-col" style={{ animationDelay: '200ms' }}>
            <NetworkMonitor />
          </div>
        )}

        {/* Crypto Tracker */}
        {activeWidgets.cryptoTracker && (
          <div className="opacity-0 animate-soft-enter h-[360px] flex flex-col" style={{ animationDelay: '300ms' }}>
            <CryptoTracker />
          </div>
        )}

        {/* Quick Notes */}
        {activeWidgets.quickNotes && (
          <div className="opacity-0 animate-soft-enter h-[360px] flex flex-col" style={{ animationDelay: '400ms' }}>
            <QuickNotes />
          </div>
        )}

        {/* Token Tracker */}
        {activeWidgets.tokenTracker && (
          <div className="opacity-0 animate-soft-enter h-[360px] flex flex-col" style={{ animationDelay: '500ms' }}>
            <TokenTracker />
          </div>
        )}

        {/* Model Status */}
        {activeWidgets.modelStatus && (
          <div className="opacity-0 animate-soft-enter h-[360px] flex flex-col" style={{ animationDelay: '600ms' }}>
            <ModelStatus />
          </div>
        )}

        {/* Prompt Vault */}
        {activeWidgets.promptVault && (
          <div className="opacity-0 animate-soft-enter h-[360px] flex flex-col" style={{ animationDelay: '700ms' }}>
            <PromptVault />
          </div>
        )}

        {/* Agent Queue */}
        {activeWidgets.agentQueue && (
          <div className="opacity-0 animate-soft-enter h-[360px] flex flex-col" style={{ animationDelay: '800ms' }}>
            <AgentQueue />
          </div>
        )}

      </main>
    </div>
  );
};

export default WidgetsPage;
