import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { FileText, Copy, Trash2, Check } from 'lucide-react';

const STORAGE_KEY = 'omnidash_quick_notes_scratchpad';
const DEFAULT_NOTE = `## Szybkie Notatki Robocze
- [x] Sprawdzić status portów 3000, 5000, 4173
- [ ] Zaktualizować wagę ocen cząstkowych w module szkolnym
- [ ] Przygotować backup relacyjnej bazy Drizzle`;

export const QuickNotesCard: React.FC = () => {
  const [note, setNote] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_NOTE;
  });
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Zapisano');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, note);
    setSaveStatus('Zapisano');
  }, [note]);

  const handleCopy = () => {
    navigator.clipboard.writeText(note);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setNote('');
  };

  const charCount = note.length;
  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;

  return (
    <GlassCard className="p-4 sm:p-5 flex flex-col justify-between" glow="sky">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Szybki Notatnik (Scratchpad)</h3>
              <p className="text-xs text-slate-500 font-medium">Błyskawiczny auto-save w pamięci lokalnej</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 bg-white/80 transition"
              title="Kopiuj notatkę"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 bg-white/80 transition"
              title="Wyczyść treść"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setSaveStatus('Zapisywanie...');
          }}
          placeholder="Wpisz dowolne notatki, fragmenty kodu lub polecenia..."
          className="w-full h-36 p-3 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-inner resize-none scrollbar-thin"
        />
      </div>

      <div className="pt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-100 mt-2">
        <span>{wordCount} słów • {charCount} znaków</span>
        <span className="text-emerald-700 font-bold">{saveStatus}</span>
      </div>
    </GlassCard>
  );
};
