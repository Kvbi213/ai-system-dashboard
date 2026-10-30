import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { BookOpen, Plus, Trash2, Calendar } from 'lucide-react';

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: string;
}

const STORAGE_KEY = 'omnidash_private_journal';

const DEFAULT_ENTRIES: JournalEntry[] = [
  {
    id: '1',
    date: '30 paź 2026',
    title: 'Wdrożenie czystej architektury OmniDash v4.0',
    content: 'Przełomowy dzień: pełna dokeryzacja, brak błędów w Vitest i Playwright, uporządkowany pulpit bez scrolla.',
    mood: 'Sukces'
  },
  {
    id: '2',
    date: '29 paź 2026',
    title: 'Trening FBW i progresja na drążku',
    content: 'Udało się zrobić 4 pełne serie po 8 powtórzeń nachwytem. Regeneracja i dieta w normie.',
    mood: 'Spokój'
  }
];

export const PrivateJournalCard: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_ENTRIES;
    } catch {
      return DEFAULT_ENTRIES;
    }
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Skupienie');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' }),
      title: title.trim(),
      content: content.trim(),
      mood
    };
    setEntries([newEntry, ...entries]);
    setTitle('');
    setContent('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="indigo">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Dziennik Osobisty & Refleksje</h3>
          <p className="text-xs text-slate-500 font-medium">Rejestr przemyśleń, sukcesów i wniosków dnia</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nowy wpis</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-3 mb-4 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tytuł wpisu..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
            <input
              type="text"
              placeholder="Nastrój / Stan..."
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-28 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
          </div>
          <textarea
            placeholder="Treść refleksji..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 h-20 resize-none"
          />
          <button
            type="submit"
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            Zapisz wpis w dzienniku
          </button>
        </form>
      )}

      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="p-3.5 rounded-xl bg-white/90 border border-slate-200 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-900">{entry.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {entry.date}
                </span>
                <span className="text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  {entry.mood}
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="p-1 text-slate-300 hover:text-rose-500 transition"
                  title="Usuń wpis"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
              {entry.content}
            </p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
