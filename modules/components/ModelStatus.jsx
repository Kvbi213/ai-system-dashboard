import React, { useState, useEffect } from 'react';
import { Server, Cpu, Activity } from 'lucide-react';
import axios from 'axios';

const ModelStatus = () => {
  const [statusData, setStatusData] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await axios.get('/api/model/status');
        setStatusData(data);
      } catch (err) {
        setStatusData({ status: 'offline', latency: 999, model: 'llama-3.3-70b-versatile' });
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!statusData) {
    return (
      <div className="glass-panel p-5 rounded-xl border border-border h-full flex items-center justify-center">
        <Activity className="w-6 h-6 text-accentPrimary animate-pulse" />
      </div>
    );
  }

  const isOnline = statusData.status === 'online';

  return (
    <div className="glass-panel p-5 rounded-xl border border-border flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center gap-3 mb-5 border-b border-border/50 pb-3">
        <div className="p-2 rounded-lg bg-accentPrimary/10 border border-accentPrimary/20">
          <Server className="w-5 h-5 text-accentPrimary" />
        </div>
        <div>
          <h3 className="font-mono text-sm font-bold text-textPrimary">Model Status</h3>
          <p className="text-[10px] text-textMuted uppercase tracking-wider">{statusData.model}</p>
        </div>
      </div>
      
      <div className="space-y-4 flex-1 flex flex-col">
        <div>
          <div className="flex justify-between text-[10px] uppercase text-textMuted font-mono mb-1.5">
            <span>Latencja (Ping do LLM API)</span>
            <span className={isOnline ? "text-accentPrimary" : "text-[#FF3366]"}>{statusData.latency} ms</span>
          </div>
          <div className="w-full bg-surface border border-border rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${isOnline ? 'bg-accentPrimary shadow-[0_0_10px_rgba(var(--color-accent-primary),0.8)]' : 'bg-[#FF3366]'}`}
              style={{ width: `${Math.min(statusData.latency / 10, 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div className={`flex items-center gap-3 mt-auto p-3 rounded-xl bg-black/20 border border-border/50`}>
          <div className="relative">
            <Cpu className={`w-5 h-5 ${isOnline ? 'text-accentPrimary' : 'text-[#FF3366]'}`} />
            {isOnline && <span className="absolute -top-1 -right-1 w-2 h-2 bg-accentPrimary rounded-full animate-ping"></span>}
          </div>
          <div>
            <p className="text-xs font-bold text-textPrimary">Status: {isOnline ? 'Online' : 'Offline'}</p>
            <p className="text-[10px] text-textMuted">{isOnline ? 'Połączenie z serwerami Groq stabilne.' : 'Brak odpowiedzi od API LLM.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelStatus;
