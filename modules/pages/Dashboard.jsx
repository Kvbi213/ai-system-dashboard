import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import WeatherWidget from '../components/WeatherWidget';
import TodoList from '../components/TodoList';
import ITNewsTicker from '../components/ITNewsTicker';
import NewsFeed from '../components/NewsFeed';
import RoutinesWidget from '../components/RoutinesWidget';

const Dashboard = () => {
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
        className="glass-panel flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 px-5 py-3 rounded-xl border border-border opacity-0 animate-fade-in-up"
        style={{ animationDelay: '80ms' }}
      >
        <div className="flex flex-col">
          <span className="font-mono text-3xl text-accentPrimary font-bold tracking-tighter tabular-nums neon-text" style={{ textShadow: 'none', animation: 'none', color: 'var(--color-accent-primary-hex)' }}>
            {time.toLocaleTimeString('pl-PL', { hour12: false })}
          </span>
          <span className="font-mono text-xs text-textMuted uppercase tracking-widest mt-0.5">
            {time.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-mono text-xs text-accentPrimary uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-accentPrimary animate-pulse inline-block" />
            Status: Nominal
          </div>
          <WeatherWidget />
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-[1fr_auto] gap-4 flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
        {/* Todo (col 1, row 1-2) */}
        <div id="tour-todo" className="md:col-span-1 md:row-span-2 h-[380px] md:h-full min-h-0 opacity-0 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <TodoList />
        </div>

        {/* IT News (col 2-3, row 1) */}
        <div className="md:col-span-2 h-[420px] md:h-full min-h-0 opacity-0 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
          <ITNewsTicker selectedCategories={newsCategories} />
        </div>

        {/* Routines & System Logs (col 2 & 3, row 2) */}
        <div className="md:col-span-1 h-52 flex-shrink-0 opacity-0 animate-fade-in-up" style={{ animationDelay: '320ms' }}>
          <RoutinesWidget />
        </div>
        <div className="md:col-span-1 h-52 flex-shrink-0 opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <NewsFeed />
        </div>
      </main>

      {/* Floating Widgets Button */}
      <button 
        onClick={() => navigate('/widgets')}
        className="hidden md:flex fixed bottom-8 right-8 w-14 h-14 bg-black/60 backdrop-blur-md border border-accentPrimary/40 rounded-full items-center justify-center text-accentPrimary shadow-[0_0_20px_rgba(0,255,102,0.15)] hover:scale-110 hover:border-accentPrimary hover:shadow-[0_0_30px_rgba(0,255,102,0.3)] transition-all z-50 group"
        title="Otwórz Katalog Widżetów"
      >
        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

export default Dashboard;
