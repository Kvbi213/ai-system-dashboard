import React, { useState } from 'react';
import { Database, Copy, Check } from 'lucide-react';

const PROMPTS = [
  { title: 'Code Review', text: 'Zrób rygorystyczny code review dla powyższego kodu. Szukaj luk bezpieczeństwa i nieoptymalnych zapytań. Zachowaj chłodny, profesjonalny ton.' },
  { title: 'Unit Testy', text: 'Wygeneruj testy jednostkowe w bibliotece Jest dla załączonych funkcji. Pokryj przypadki brzegowe i błędy typów.' },
  { title: 'Refaktoryzacja', text: 'Przeprowadź refaktoryzację kodu, stosując zasady SOLID. Skróć funkcje i usuń zbędne zagnieżdżenia.' }
];

const PromptVault = () => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="glass-panel p-5 rounded-xl border border-border flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center gap-3 mb-4 border-b border-border/50 pb-3">
        <div className="p-2 rounded-lg bg-accentPrimary/10 border border-accentPrimary/20">
          <Database className="w-5 h-5 text-accentPrimary" />
        </div>
        <div>
          <h3 className="font-mono text-sm font-bold text-textPrimary">Prompt Vault</h3>
          <p className="text-[10px] text-textMuted uppercase tracking-wider">Biblioteka Zaklęć</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar min-h-0">
        {PROMPTS.map((p, i) => (
          <div key={i} className="p-3 rounded-xl border border-border/50 bg-black/20 hover:border-accentPrimary/30 transition-colors group cursor-pointer" onClick={() => copyToClipboard(p.text, i)}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono text-xs font-bold text-accentPrimary">{p.title}</span>
              {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-accentPrimary" /> : <Copy className="w-3.5 h-3.5 text-textMuted group-hover:text-accentPrimary transition-colors" />}
            </div>
            <p className="text-[10px] text-textMuted line-clamp-2 leading-relaxed">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromptVault;
