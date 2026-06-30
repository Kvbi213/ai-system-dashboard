import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cpu, HardDrive, Clock, Activity } from 'lucide-react';

const SystemMonitor = () => {
  const [metrics, setMetrics] = useState(null);
  const [prefs, setPrefs] = useState({ cpu: true, ram: true, uptime: true });

  useEffect(() => {
    const savedSys = localStorage.getItem('system_sysmonitor');
    if (savedSys) setPrefs(JSON.parse(savedSys));

    const handlePrefsChange = (e) => setPrefs(e.detail);
    window.addEventListener('sysMonitorPrefsChanged', handlePrefsChange);

    return () => window.removeEventListener('sysMonitorPrefsChanged', handlePrefsChange);
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await axios.get('/api/system/metrics');
        setMetrics(data);
      } catch (e) {
        console.error('Failed to fetch system metrics:', e);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return (
      <div className="glass-panel p-5 rounded-xl border border-border h-full flex items-center justify-center">
        <Activity className="w-8 h-8 text-accentPrimary animate-pulse" />
      </div>
    );
  }

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="glass-panel p-5 rounded-xl border border-border flex flex-col h-fit relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accentPrimary/10 border border-accentPrimary/30 flex items-center justify-center">
            <Activity className="w-5 h-5 text-accentPrimary" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-accentPrimary tracking-tight">System Monitor</h2>
            <p className="font-sans text-xs text-textMuted uppercase tracking-wider">Live Metrics</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {prefs.cpu && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm text-textMuted flex items-center gap-2"><Cpu className="w-4 h-4" /> CPU</span>
              <span className={`font-mono text-sm font-bold ${metrics.cpu > 85 ? 'text-red-400' : 'text-textPrimary'}`}>{metrics.cpu}%</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden border border-border">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ 
                  width: `${metrics.cpu}%`, 
                  backgroundColor: metrics.cpu > 85 ? '#FF3366' : 'var(--color-accent-primary-hex)' 
                }} 
              />
            </div>
          </div>
        )}

        {prefs.ram && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm text-textMuted flex items-center gap-2"><HardDrive className="w-4 h-4" /> RAM</span>
              <span className={`font-mono text-sm font-bold ${metrics.ram > 85 ? 'text-red-400' : 'text-textPrimary'}`}>{metrics.ram}%</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden border border-border">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ 
                  width: `${metrics.ram}%`, 
                  backgroundColor: metrics.ram > 85 ? '#FF3366' : 'var(--color-accent-primary-hex)' 
                }} 
              />
            </div>
          </div>
        )}

        {prefs.uptime && (
          <div className="p-4 rounded-xl border border-border bg-black/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-accentPrimary" />
              <span className="font-mono text-sm text-textMuted">Uptime</span>
            </div>
            <span className="font-mono text-base font-bold tracking-widest">{formatUptime(metrics.uptime)}</span>
          </div>
        )}

        {!prefs.cpu && !prefs.ram && !prefs.uptime && (
          <p className="text-sm text-textMuted italic text-center mt-10">Wszystkie wskaźniki wyłączone w Ustawieniach.</p>
        )}
      </div>
    </div>
  );
};

export default SystemMonitor;
