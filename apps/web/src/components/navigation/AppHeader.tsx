import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon, Search, Command } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { AiAssistantMascot } from '../mascot/AiAssistantMascot';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onOpenTasksDrawer?: () => void;
  onOpenCommandPalette?: () => void;
  pendingTasksCount?: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'Pulpit',
  subtitle,
  onOpenTasksDrawer,
  onOpenCommandPalette,
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
          minute: '2-digit'
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
    <header className="sticky top-0 z-20 w-full border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#0c101b]/90 backdrop-blur-md px-4 py-2.5 sm:px-6 transition-colors duration-200">
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-4">
        {/* Left: Breadcrumbs / Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium shrink-0">
            <span>OmniDash</span>
            <span>/</span>
          </div>
          <div className="truncate">
            <h1 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h1>
          </div>
          {subtitle && (
            <span className="hidden lg:inline-block text-xs text-slate-400 dark:text-slate-500 truncate ml-1 pl-2 border-l border-slate-200 dark:border-white/10">
              {subtitle}
            </span>
          )}
        </div>

        {/* Right: Actions, AI Status, Time & Settings */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Omnibox Trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/70 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
            title="Otwórz wyszukiwarkę poleceń (Cmd+K)"
            aria-label="Wyszukiwarka funkcji"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Szukaj...</span>
            <span className="hidden sm:flex items-center font-mono text-[10px] text-slate-400 ml-1">
              <Command className="w-2.5 h-2.5 mr-0.5" />K
            </span>
          </button>

          {/* AI Mascot & Engine Status */}
          <AiAssistantMascot className="hidden md:inline-flex" />


          {/* Warsaw Clock */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] font-mono text-xs text-slate-700 dark:text-slate-300">
            <span className="text-slate-400 text-[11px] hidden sm:inline">{dateStr}</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{timeStr || '--:--'}</span>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Przełącz na motyw jasny' : 'Przełącz na motyw ciemny'}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/70 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
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
              type="button"
              onClick={onOpenTasksDrawer}
              className="relative p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/70 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08] transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
              aria-label="Otwórz zadania na dziś"
              title="Zadania na dziś"
            >
              <Bell className="w-4 h-4" />
              {pendingTasksCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-[9px] font-bold text-white dark:text-slate-900 shadow-2xs">
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
