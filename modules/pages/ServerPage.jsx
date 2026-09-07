import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Server, Cpu, Activity, RotateCcw, Power } from 'lucide-react';
import axios from 'axios';

const ServerPage = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState({ online: true, uptime: '00:00:00', memory: '0 MB', cpu: '0%' });

  useEffect(() => {
    // In a real scenario, this would fetch actual server metrics via API
    const fetchStatus = () => {
      setStatus(prev => ({
        ...prev,
        memory: Math.floor(Math.random() * 50 + 100) + ' MB',
        cpu: Math.floor(Math.random() * 20) + '%'
      }));
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full gap-4 pb-20 md:pb-0">
      <header className="glass-panel p-5 rounded-xl border border-border flex items-center justify-between gap-4 flex-shrink-0 opacity-0 animate-soft-enter" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
            <Server className="w-5 h-5 text-textPrimary" />
          </div>
          <div className="flex flex-col">
            <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-textMuted mb-0.5">
              <span className="flex items-center text-lg font-medium text-textMuted/70">OmniDash</span>
              <span className="shrink-0 text-lg font-medium text-textMuted/70">/</span>
              <span className="flex items-center text-lg font-medium text-textPrimary">Serwer</span>
            </nav>
            <p className="font-sans text-xs text-textMuted mt-0.5">Zarządzanie serwerem głównym</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 font-sans text-sm font-medium text-accentPrimary">
            <span className="w-2.5 h-2.5 rounded-full bg-accentPrimary animate-pulse inline-block" />
            ONLINE
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-0 animate-soft-enter" style={{ animationDelay: '100ms' }}>
          <div className="glass-panel p-6 flex flex-col justify-center items-center text-center gap-2">
            <Activity className="w-8 h-8 text-accentPrimary mb-2" />
            <span className="text-textMuted text-sm uppercase tracking-widest">Uptime</span>
            <span className="font-mono text-3xl font-bold">{status.uptime}</span>
          </div>
          <div className="glass-panel p-6 flex flex-col justify-center items-center text-center gap-2">
            <Cpu className="w-8 h-8 text-accentSecondary mb-2" />
            <span className="text-textMuted text-sm uppercase tracking-widest">Użycie CPU</span>
            <span className="font-mono text-3xl font-bold">{status.cpu}</span>
          </div>
          <div className="glass-panel p-6 flex flex-col justify-center items-center text-center gap-2">
            <Server className="w-8 h-8 text-purple-400 mb-2" />
            <span className="text-textMuted text-sm uppercase tracking-widest">Użycie RAM</span>
            <span className="font-mono text-3xl font-bold">{status.memory}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="glass-panel p-6 opacity-0 animate-soft-enter" style={{ animationDelay: '200ms' }}>
          <h2 className="font-mono text-lg font-bold mb-4 border-b border-border pb-2">Akcje Administracyjne</h2>
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 hover:border-red-500 transition-colors">
              <Power className="w-4 h-4" />
              Zatrzymaj Serwer
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 hover:border-yellow-500 transition-colors">
              <RotateCcw className="w-4 h-4" />
              Restart Backend
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServerPage;
