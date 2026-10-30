import React, { useState } from 'react';
import { Newspaper, ChevronRight } from 'lucide-react';

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
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % DEFAULT_NEWS.length);
  };

  const current = DEFAULT_NEWS[activeIndex];

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
          <Newspaper className="w-3 h-3" />
          <span>{current.category}</span>
        </div>
        <div className="truncate">
          <span className="text-xs text-slate-400 font-mono mr-1.5 font-medium">
            [{current.source}]
          </span>
          <span className="text-xs text-slate-200 font-medium">{current.title}</span>
        </div>
      </div>

      <button
        onClick={handleNext}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0 ml-2 transition"
        title="Następny news"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
