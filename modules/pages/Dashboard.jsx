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
    <div className="flex flex-col h-full gap-4 pb-20 md:pb-0">
      {/* Header Bar */}
      <header
        className="glass-panel flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 px-5 py-3 opacity-0 animate-soft-enter"
        style={{ animationDelay: '50ms' }}
      >
        <div className="flex flex-col">
          <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-textMuted mb-1">
            <span className="flex items-center text-lg font-medium text-textMuted/70">OmniDash</span>
            <span className="shrink-0 text-xl font-medium text-textMuted/70">/</span>
            <span className="flex items-center text-xl font-medium text-textPrimary">Pulpit</span>
          </nav>
          <p className="text-sm font-medium text-textMuted mb-4">Przeglądaj wszystkie moduły i aktywności systemu.</p>
          
          <div className="flex items-baseline gap-4 mt-1">
            <span className="font-sans text-3xl text-textPrimary font-bold tracking-tight tabular-nums">
              {time.toLocaleTimeString(currentLocale, { hour12: false })}
            </span>
            <span className="font-sans text-sm text-textMuted">
              {time.toLocaleDateString(currentLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-sans text-sm text-accentPrimary font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-accentPrimary animate-pulse inline-block" />
            Wszystko działa prawidłowo
          </div>
          <WeatherWidget />
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto p-1">
        {/* Todo */}
        <div id="tour-todo" className="lg:col-span-1 lg:row-span-2 min-h-[400px] opacity-0 animate-soft-enter" style={{ animationDelay: '100ms' }}>
          <TodoList />
        </div>

        {/* IT News */}
        <div className="lg:col-span-2 min-h-[300px] opacity-0 animate-soft-enter" style={{ animationDelay: '150ms' }}>
          <ITNewsTicker selectedCategories={newsCategories} />
        </div>

        {/* Routines & NewsFeed */}
        <div className="lg:col-span-1 min-h-[250px] opacity-0 animate-soft-enter" style={{ animationDelay: '200ms' }}>
          <RoutinesWidget />
        </div>
        <div className="lg:col-span-1 min-h-[250px] opacity-0 animate-soft-enter" style={{ animationDelay: '250ms' }}>
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
