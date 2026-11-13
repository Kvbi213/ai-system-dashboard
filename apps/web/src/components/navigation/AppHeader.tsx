import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon } from 'lucide-react';
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
    <header className="sticky top-0 z-20 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0e1424]/95 backdrop-blur-md px-4 py-3 sm:px-6 transition-colors duration-200">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: View Title & Subtitle */}
        <div className="flex flex-col">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{subtitle}</p>}
        </div>

        {/* Right: Warsaw Live Clock, Theme Toggle, Action Triggers */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Warsaw Clock & Current Day */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 font-mono text-xs text-slate-700 dark:text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-slate-500 dark:text-slate-400 font-medium uppercase text-[11px]">{dateStr || 'DZIŚ'}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{timeStr || '--:--:--'}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Przełącz na motyw jasny' : 'Przełącz na motyw ciemny'}
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
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
              className="relative p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
              aria-label="Otwórz zadania wykonawcze"
            >
              <Bell className="w-4 h-4" />
              {pendingTasksCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 text-[9px] font-bold text-white dark:text-slate-900 shadow-sm">
                  {pendingTasksCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
