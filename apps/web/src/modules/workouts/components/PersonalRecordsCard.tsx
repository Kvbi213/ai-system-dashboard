import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Trophy, TrendingUp, Calendar, Plus, Trash2 } from 'lucide-react';

export interface RecordItem {
  id: string;
  exercise: string;
  record: string;
  date: string;
  extra: string;
}

const STORAGE_KEY = 'omnidash_personal_records';

const INITIAL_RECORDS: RecordItem[] = [
  { id: 'pr1', exercise: 'Podciąganie na drążku (nachwyt)', record: '14 powtórzeń', date: '18 paź 2026', extra: 'Czysta forma bez bujania' },
  { id: 'pr2', exercise: 'Dipy na poręczach (kalistenika)', record: '22 powtórzenia', date: '22 paź 2026', extra: 'Masa ciała + głębokie zejście' },
  { id: 'pr3', exercise: 'Dipy z obciążeniem zewnętrznym', record: '+15 kg x 6 powt.', date: '14 paź 2026', extra: 'Pas obciążeniowy' },
  { id: 'pr4', exercise: 'Wznosy prostych nóg do drążka', record: '16 powtórzeń', date: '26 paź 2026', extra: 'Dotknięcie stóp do drążka' }
];

export const PersonalRecordsCard: React.FC = () => {
  const [records, setRecords] = useState<RecordItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_RECORDS;
    } catch {
      return INITIAL_RECORDS;
    }
  });

  const [isAdding, setIsAdding] = useState(false);
  const [exercise, setExercise] = useState('');
  const [recordVal, setRecordVal] = useState('');
  const [extra, setExtra] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise.trim() || !recordVal.trim()) return;
    const now = new Date();
    const dateFormatted = `${now.getDate()} ${now.toLocaleString('pl-PL', { month: 'short' })} ${now.getFullYear()}`;
    const newPr: RecordItem = {
      id: Date.now().toString(),
      exercise: exercise.trim(),
      record: recordVal.trim(),
      date: dateFormatted,
      extra: extra.trim() || 'Osobisty rekord życiowy'
    };
    setRecords([newPr, ...records]);
    setExercise('');
    setRecordVal('');
    setExtra('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 shadow-sm">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Rekordy Siłowe i Osiągnięcia (PR)</h3>
            <p className="text-xs text-slate-500 font-medium">Osobiste maksima w kalistenice</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-xs text-sky-700 font-bold bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200 shadow-sm">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>PROGRES</span>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nowy rekord</span>
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-3 mb-3 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Ćwiczenie (np. Muscle-up)..."
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
            <input
              type="text"
              placeholder="Wynik (np. 5 powtórzeń)..."
              value={recordVal}
              onChange={(e) => setRecordVal(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
            <input
              type="text"
              placeholder="Notatka / wariant..."
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            Zapisz rekord PR
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {records.map((rec) => (
          <div
            key={rec.id}
            className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:bg-white transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900">{rec.exercise}</p>
                <button
                  onClick={() => handleDelete(rec.id)}
                  className="text-slate-300 hover:text-rose-500 transition p-1"
                  title="Usuń rekord"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-base font-bold font-mono text-sky-800 mt-1">{rec.record}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{rec.extra}</p>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-slate-100">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Osiągnięto: {rec.date}</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
