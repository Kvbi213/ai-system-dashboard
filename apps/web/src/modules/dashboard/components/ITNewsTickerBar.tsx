import React, { useState, useEffect } from 'react';
import { Newspaper, ChevronRight } from 'lucide-react';
import { newsApi } from '../../../api/client';

interface NewsItem {
  id: string;
  source: string;
  title: string;
  category: string;
}

const DEFAULT_NEWS: NewsItem[] = [
  {
    id: '1',
    source: 'CERT Polska',
    title: 'Analiza podatności CVE-2025-48757 oraz wytyczne Zero-Trust dla usług brzegowych',
    category: 'Cybersec'
  },
  {
    id: '2',
    source: 'Docker News',
    title: 'Docker Compose v2.30 wprowadza natywne healthchecki dla kontenerów LXC',
    category: 'DevOps'
  },
  {
    id: '3',
    source: 'Linux Kernel',
    title: 'Kernel 6.13 z optymalizacjami harmonogramu zadań EEVDF dla serwerów brzegowych',
    category: 'Linux'
  }
];

export const ITNewsTickerBar: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>(DEFAULT_NEWS);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    newsApi.getTicker()
      .then(res => {
        if (res?.news && res.news.length > 0) {
          setNews(res.news);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_NEWS
      });
  }, []);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % news.length);
  };

  const current = news[activeIndex] || DEFAULT_NEWS[0];

  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl glass-panel shadow-xs">
      <div className="flex items-center gap-3 overflow-hidden min-w-0">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 shrink-0">
          <Newspaper className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>{current.category}</span>
        </div>
        <div className="truncate flex items-center text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium mr-2 shrink-0">
            {current.source}:
          </span>
          <span className="text-slate-800 dark:text-slate-200 truncate">{current.title}</span>
        </div>
      </div>

      <button
        onClick={handleNext}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 ml-2 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
        title="Następna wiadomość"
        aria-label="Następna wiadomość"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
