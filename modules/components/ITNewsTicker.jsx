import React, { useState, useEffect, useCallback } from 'react';
import { Rss, ExternalLink, RefreshCw, Cpu, Shield, Zap, Lock, ChevronRight, AlertCircle } from 'lucide-react';
import { CATEGORY_CONFIG } from '../config/constants';

const ITNewsTicker = ({ selectedCategories }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [tickerIndex, setTickerIndex] = useState(0);

  const categories = selectedCategories && selectedCategories.length > 0
    ? selectedCategories
    : ['ai', 'security'];

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(false);
    const cat = activeCategory || categories[0];
    const config = CATEGORY_CONFIG[cat];
    if (!config) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/news?q=${encodeURIComponent(config.query)}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setArticles(data.results || []);
      setLastFetch(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, categories.join(',')]);

  useEffect(() => {
    const cat = activeCategory || categories[0];
    if (!activeCategory) setActiveCategory(cat);
    fetchNews();
    const iv = setInterval(fetchNews, 120000);
    return () => clearInterval(iv);
  }, [activeCategory, fetchNews]);

  // Ticker animation
  useEffect(() => {
    if (articles.length < 2) return;
    const t = setInterval(() => setTickerIndex(i => (i + 1) % articles.length), 5000);
    return () => clearInterval(t);
  }, [articles.length]);

  const currentCatConfig = CATEGORY_CONFIG[activeCategory] || CATEGORY_CONFIG['ai'];
  const IconComponent = currentCatConfig.icon;

  return (
    <div className="glass-panel h-full rounded-xl p-4 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <IconComponent className="w-5 h-5" style={{ color: currentCatConfig.color }} />
          <h2 className="font-mono text-sm uppercase tracking-widest text-textMuted">IT Intel Feed</h2>
          <span className="w-2 h-2 rounded-full animate-pulse ml-1" style={{ backgroundColor: currentCatConfig.color }} />
        </div>
        <div className="flex items-center gap-2">
          {lastFetch && (
            <span className="font-mono text-[10px] text-textMuted hidden sm:block">
              {lastFetch.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchNews}
            className="p-1.5 rounded-lg text-textMuted hover:text-accentPrimary hover:bg-accentPrimary/10 transition-all"
            title="Odśwież"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 flex-wrap flex-shrink-0">
        {categories.map(cat => {
          const cfg = CATEGORY_CONFIG[cat];
          if (!cfg) return null;
          const CatIcon = cfg.icon;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all border"
              style={{
                backgroundColor: isActive ? `${cfg.color}20` : 'transparent',
                borderColor: isActive ? `${cfg.color}60` : 'rgba(255,255,255,0.05)',
                color: isActive ? cfg.color : 'var(--color-text-muted)',
                boxShadow: isActive ? `0 0 10px ${cfg.color}30` : 'none'
              }}
            >
              <CatIcon className="w-3 h-3" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Ticker bar (live headline) */}
      {articles.length > 0 && !loading && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: `${currentCatConfig.color}10`, borderLeft: `2px solid ${currentCatConfig.color}` }}
        >
          <span className="font-mono text-[9px] uppercase tracking-widest flex-shrink-0" style={{ color: currentCatConfig.color }}>LIVE</span>
          <p className="font-mono text-xs text-textPrimary truncate">
            {articles[tickerIndex]?.title}
          </p>
        </div>
      )}

      {/* Articles */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 skeleton rounded w-3/4" style={{ animationDelay: `${i * 100}ms` }} />
              <div className="h-2.5 skeleton rounded w-full" style={{ animationDelay: `${i * 100 + 50}ms` }} />
            </div>
          ))
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <AlertCircle className="w-8 h-8 text-textMuted opacity-40" />
            <p className="text-xs font-mono text-textMuted">Brak połączenia z feed. Serwer pobiera dane...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center text-textMuted text-xs font-mono mt-6">Brak wyników dla tej kategorii.</div>
        ) : (
          articles.map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-2 p-2.5 rounded-lg border border-transparent hover:border-border hover:bg-surface/50 transition-all duration-200 block"
            >
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-textMuted group-hover:translate-x-0.5 transition-transform" style={{ color: currentCatConfig.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-sans font-semibold text-textPrimary group-hover:text-accentSecondary transition-colors leading-tight line-clamp-2">
                  {article.title}
                </p>
                {article.description && (
                  <p className="text-[10px] text-textMuted mt-1 leading-relaxed line-clamp-2 font-sans">{article.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  {article.source && (
                    <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: currentCatConfig.color }}>
                      {article.source}
                    </span>
                  )}
                  <ExternalLink className="w-2.5 h-2.5 text-textMuted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
};

export default ITNewsTicker;
