import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Brain, Plus, Trash2, Pin } from 'lucide-react';

interface CognitiveFact {
  id: string;
  category: string;
  fact: string;
  pinned: boolean;
}

const STORAGE_KEY = 'omnidash_cognitive_facts';

const INITIAL_FACTS: CognitiveFact[] = [
  { id: '1', category: 'Preferencje', fact: 'Operator preferuje styl Apple Liquid Glass w jasnej tonacji porcelany oraz minimalizm tokenowy.', pinned: true },
  { id: '2', category: 'Architektura', fact: 'Monorepo OmniDash korzysta z pnpm workspaces: apps/web, apps/api, apps/worker, packages/contracts.', pinned: true },
  { id: '3', category: 'Sport', fact: 'Główny plan treningowy to FBW kalistenika (drążek nachwyt, dipy, pompki z deficytem) z przerwami 90s.', pinned: false },
  { id: '4', category: 'Finanse', fact: 'Zarządzanie budżetem według modelu 50/30/20 z automatyczną klasyfikacją SMS bankowych przez Pushbullet.', pinned: false }
];

export const CognitiveFactsList: React.FC = () => {
  const [facts, setFacts] = useState<CognitiveFact[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_FACTS;
    } catch {
      return INITIAL_FACTS;
    }
  });

  const [newCategory, setNewCategory] = useState('Ogólne');
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(facts));
  }, [facts]);

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const item: CognitiveFact = {
      id: Date.now().toString(),
      category: newCategory,
      fact: newText.trim(),
      pinned: false
    };
    setFacts([item, ...facts]);
    setNewText('');
    setIsAdding(false);
  };

  const handleDeleteFact = (id: string) => {
    setFacts(facts.filter((f) => f.id !== id));
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="indigo">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Pamięć Długoterminowa (Fakty)</h3>
            <p className="text-xs text-slate-500 font-medium">Baza kontekstu asystenta z pamięcią sesyjną</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Dodaj fakt</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddFact} className="p-3 mb-3 rounded-xl bg-sky-50 border border-sky-300 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Kategoria..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 font-medium"
            />
            <input
              type="text"
              placeholder="Treść faktu kognitywnego..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="sm:col-span-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition"
          >
            Zapisz fakt w pamięci
          </button>
        </form>
      )}

      <div className="space-y-2.5">
        {facts.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl bg-white/80 border border-slate-200 flex items-start justify-between gap-3 shadow-xs hover:bg-white transition"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                {item.pinned && <Pin className="w-3 h-3 text-amber-500 rotate-45" />}
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {item.category}
                </span>
              </div>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">{item.fact}</p>
            </div>

            <button
              onClick={() => handleDeleteFact(item.id)}
              className="p-1 rounded text-slate-400 hover:text-rose-600 transition"
              title="Usuń fakt"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
