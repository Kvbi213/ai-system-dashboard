import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WeatherWidget from '../components/WeatherWidget';
import TodoList from '../components/TodoList';
import ITNewsTicker from '../components/ITNewsTicker';
import NewsFeed from '../components/NewsFeed';
import RoutinesWidget from '../components/RoutinesWidget';

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const langMap = { pl: 'pl-PL', en: 'en-US', uk: 'uk-UA', zh: 'zh-CN' };
  const currentLocale = langMap[i18n.language] || 'pl-PL';
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [newsCategories, setNewsCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('system_news_categories')) || ['ai', 'security']; }
    catch { return ['ai', 'security']; }
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e) => setNewsCategories(e.detail);
    window.addEventListener('newsCategoriesChanged', handler);
    return () => window.removeEventListener('newsCategoriesChanged', handler);
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-space-md animate-soft-enter">
      {/* Top Ambient Glow Field */}
      <div className="relative w-full overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-[560px] h-48 bg-primary-container/10 rounded-full blur-[110px]"></div>
        <div className="absolute -top-24 right-1/4 w-[480px] h-40 bg-secondary-container/15 rounded-full blur-[90px]"></div>
      </div>

      {/* Header Bar */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-space-md p-space-md bg-surface-container-low rounded-xl border border-white/[0.04] shadow-sm">
        <div className="flex flex-col gap-space-xs">
          <nav aria-label="breadcrumb" className="flex items-center space-x-2 font-code-mono text-label-sm text-outline">
            <span className="hover:text-primary transition-colors cursor-pointer">OmniDash</span>
            <span className="text-outline-variant">/</span>
            <span>Core Systems</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-medium">Pulpit Główny</span>
          </nav>
          
          <div className="flex items-baseline gap-space-md flex-wrap">
            <span className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight tabular-nums">
              {time.toLocaleTimeString(currentLocale, { hour12: false })}
            </span>
            <span className="font-body-md text-body-md text-on-surface-variant capitalize">
              {time.toLocaleDateString(currentLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high text-primary font-code-mono text-[11px] font-semibold flex items-center gap-1 border border-white/[0.04]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Kognitywny Root HUD
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-space-md w-full lg:w-auto pt-space-xs lg:pt-0 border-t lg:border-t-0 border-white/[0.04]">
          <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container text-primary font-code-mono text-label-sm border border-white/[0.04]">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Nominalny Stan Systemu</span>
          </div>
          <WeatherWidget />
        </div>
      </header>

      {/* Main Grid Workstation */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-space-md flex-1 overflow-y-auto pb-20 md:pb-6">
        {/* Todo Column */}
        <div id="tour-todo" className="lg:col-span-1 lg:row-span-2 min-h-[420px] bg-surface-container-low rounded-xl border border-white/[0.04] p-space-sm shadow-sm">
          <TodoList />
        </div>

        {/* IT News Banner */}
        <div className="lg:col-span-2 min-h-[300px] bg-surface-container-low rounded-xl border border-white/[0.04] p-space-sm shadow-sm">
          <ITNewsTicker selectedCategories={newsCategories} />
        </div>

        {/* Routines & NewsFeed */}
        <div className="lg:col-span-1 min-h-[260px] bg-surface-container-low rounded-xl border border-white/[0.04] p-space-sm shadow-sm">
          <RoutinesWidget />
        </div>
        <div className="lg:col-span-1 min-h-[260px] bg-surface-container-low rounded-xl border border-white/[0.04] p-space-sm shadow-sm">
          <NewsFeed />
        </div>
      </main>

      {/* Floating Widgets Trigger Button */}
      <button 
        onClick={() => navigate('/widgets')}
        className="hidden md:flex fixed bottom-6 right-6 w-12 h-12 bg-primary text-on-primary rounded-xl items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 shadow-[0_0_24px_rgba(173,198,255,0.3)]"
        title="Otwórz widżety i telemetrię"
      >
        <span className="material-symbols-outlined text-[22px]">add</span>
      </button>
    </div>
  );
};

export default Dashboard;
