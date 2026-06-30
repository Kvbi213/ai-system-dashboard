import React, { useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';

const CryptoMonitor = () => {
  const [news] = useState([
    { id: 1, title: "OpenAI zapowiada model o kodowej nazwie Orion", source: "TechCrunch", time: "10m ago" },
    { id: 2, title: "Claude 3.5 zyskuje nowe możliwości analityczne", source: "AI Insider", time: "1h ago" },
    { id: 3, title: "Nowe regulacje UE dotyczące modeli generatywnych", source: "Reuters", time: "3h ago" }
  ]);

  return (
    <div className="glass-panel h-full rounded-xl p-4 flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
        <Cpu className="text-accentPrimary w-5 h-5" />
        <h2 className="font-mono text-sm uppercase tracking-widest text-textMuted">AI Intel Feed</h2>
      </div>

      <div className="space-y-3 overflow-y-auto pr-1">
        {news.map((item) => (
          <div key={item.id} className="flex flex-col font-mono">
            <span className="text-textPrimary text-xs font-bold leading-tight truncate" title={item.title}>
              {item.title}
            </span>
            <div className="flex items-center justify-between text-[10px] text-textMuted mt-1">
              <span>{item.source}</span>
              <span className="text-accentSecondary">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CryptoMonitor;