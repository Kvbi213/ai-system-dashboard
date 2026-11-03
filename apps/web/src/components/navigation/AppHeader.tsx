import React, { useState, useEffect } from 'react';
import { Wifi, Sparkles, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme, toggleTheme } = useTheme();
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

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
      setDateStr(
        now.toLocaleDateString('pl-PL', {
          timeZone: 'Europe/Warsaw',
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-20 w-full border-b border-white/80 bg-white/65 backdrop-blur-2xl px-4 py-3 sm:px-6 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: View Title & Subtitle */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              {title}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 border border-sky-200 shadow-sm">
              LIVE
            </span>
          </div>
          {subtitle && <p className="text-xs text-slate-500 hidden sm:block font-medium">{subtitle}</p>}
        </div>

        {/* Right: Warsaw Live Clock, Telemetry Status, Action Triggers */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Warsaw Clock & Current Day */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200/80 font-mono text-xs text-slate-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-500 font-bold uppercase">{dateStr || 'DZIŚ'}</span>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-sky-700">{timeStr || '--:--:--'}</span>
          </div>

          {/* Network Health Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs text-emerald-700 font-medium shadow-sm">
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline font-mono text-[11px] font-bold">EDGE ON</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Przełącz na motyw jasny' : 'Przełącz na motyw ciemny'}
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-sky-300 dark:hover:border-sky-500 transition active:scale-95 shadow-sm"
            aria-label="Przełącz motyw"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Quick Tasks Slide-over trigger */}
          {onOpenTasksDrawer && (
            <button
              onClick={onOpenTasksDrawer}
              className="relative p-2 rounded-xl bg-white/80 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-sky-300 transition active:scale-95 shadow-sm"
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/90 text-xs text-sky-800 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            <span className="font-semibold hidden sm:inline">AI Agent</span>
            <span className="font-mono text-[10px] text-slate-500 font-bold">v4</span>
          </div>
        </div>
      </div>
    </header>
  );
};
