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
    <div className="flex items-center justify-between p-3 rounded-2xl glass-panel shadow-sm">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-sky-100 border border-sky-200 text-sky-800 text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-sm">
          <Newspaper className="w-3 h-3 text-sky-700" />
          <span>{current.category}</span>
        </div>
        <div className="truncate">
          <span className="text-xs text-slate-500 font-mono mr-1.5 font-bold">
            [{current.source}]
          </span>
          <span className="text-xs text-slate-800 font-semibold">{current.title}</span>
        </div>
      </div>

      <button
        onClick={handleNext}
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/80 shrink-0 ml-2 transition shadow-sm"
        title="Następny news"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
