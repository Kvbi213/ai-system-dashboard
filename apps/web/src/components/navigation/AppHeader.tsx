import React, { useState, useEffect } from 'react';
import { Wifi, Sparkles, Bell } from 'lucide-react';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onOpenTasksDrawer?: () => void;
  pendingTasksCount?: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'OmniDash Hub',
  subtitle,
  onOpenTasksDrawer,
  pendingTasksCount = 2
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('pl-PL', {
          timeZone: 'Europe/Warsaw',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-xl px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: View Title & Subtitle */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {title}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              LIVE
            </span>
          </div>
          {subtitle && <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>}
        </div>

        {/* Right: Warsaw Live Clock, Telemetry Status, Action Triggers */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Warsaw Clock */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 font-mono text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-400">WARSZAWA:</span>
            <span className="font-semibold text-sky-300">{timeStr || '--:--:--'}</span>
          </div>

          {/* Network Health Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-emerald-400">
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-mono text-[11px]">EDGE ON</span>
          </div>

          {/* Quick Tasks Slide-over trigger */}
          {onOpenTasksDrawer && (
            <button
              onClick={onOpenTasksDrawer}
              className="relative p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-300 hover:text-white hover:border-sky-500/40 transition active:scale-95"
              aria-label="Otwórz zadania wykonawcze"
            >
              <Bell className="w-4 h-4" />
              {pendingTasksCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm">
                  {pendingTasksCount}
                </span>
              )}
            </button>
          )}

          {/* AI Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/30 text-xs text-sky-300">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="font-medium hidden sm:inline">AI Agent</span>
            <span className="font-mono text-[10px] text-slate-400">v4</span>
          </div>
        </div>
      </div>
    </header>
  );
};
