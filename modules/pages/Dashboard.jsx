import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
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
    <div className="flex flex-col h-full gap-3 sm:gap-4 overflow-hidden">
      {/* Header Bar */}
      <header
        className="glass-panel flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 p-3.5 sm:p-5 opacity-0 animate-soft-enter"
        style={{ animationDelay: '50ms' }}
      >
        <div className="flex flex-col">
          <nav aria-label="breadcrumb" className="hidden sm:flex items-center space-x-2 text-sm text-textMuted mb-1">
            <span className="flex items-center text-base font-medium text-textMuted/70">OmniDash</span>
            <span className="shrink-0 text-lg font-medium text-textMuted/70">/</span>
            <span className="flex items-center text-base font-medium text-textPrimary">Pulpit</span>
          </nav>
          <p className="hidden md:block text-xs sm:text-sm font-medium text-textMuted mb-2">Przeglądaj wszystkie moduły i aktywności systemu.</p>
          
          <div className="flex items-baseline gap-3 sm:gap-4">
            <span className="font-sans text-2xl sm:text-3xl text-textPrimary font-bold tracking-tight tabular-nums">
              {time.toLocaleTimeString(currentLocale, { hour12: false })}
            </span>
            <span className="font-sans text-xs sm:text-sm text-textMuted">
              {time.toLocaleDateString(currentLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
          <div className="flex items-center gap-2 font-sans text-xs sm:text-sm text-accentPrimary font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-accentPrimary animate-pulse inline-block" />
            Wszystko działa prawidłowo
          </div>
          <WeatherWidget />
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-6 flex-1 overflow-y-auto p-1 min-h-0">
        {/* Todo */}
        <div id="tour-todo" className="lg:col-span-1 lg:row-span-2 min-h-[350px] sm:min-h-[400px] opacity-0 animate-soft-enter" style={{ animationDelay: '100ms' }}>
          <TodoList />
        </div>

        {/* IT News */}
        <div className="lg:col-span-2 min-h-[250px] sm:min-h-[300px] opacity-0 animate-soft-enter" style={{ animationDelay: '150ms' }}>
          <ITNewsTicker selectedCategories={newsCategories} />
        </div>

        {/* Routines & NewsFeed */}
        <div className="lg:col-span-1 min-h-[220px] sm:min-h-[250px] opacity-0 animate-soft-enter" style={{ animationDelay: '200ms' }}>
          <RoutinesWidget />
        </div>
        <div className="lg:col-span-1 min-h-[220px] sm:min-h-[250px] opacity-0 animate-soft-enter" style={{ animationDelay: '250ms' }}>
          <NewsFeed />
        </div>
      </main>

      {/* Floating Widgets Button */}
      <button 
        onClick={() => navigate('/widgets')}
        className="hidden md:flex fixed bottom-8 right-8 w-14 h-14 bg-surface backdrop-blur-md border border-border rounded-full items-center justify-center text-textPrimary hover:scale-110 hover:border-accentPrimary hover:text-accentPrimary transition-all z-50 shadow-xl"
        title="Otwórz bibliotekę widżetów"
      >
        <Plus className="w-6 h-6 transition-transform" />
      </button>
    </div>
  );
};

export default Dashboard;
