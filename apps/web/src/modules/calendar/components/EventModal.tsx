import React, { useState } from 'react';
import { X, Calendar, Plus } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: { title: string; date: string; category: string; description: string }) => void;
  selectedDate?: string;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  selectedDate
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(selectedDate || new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('Sprawdzian');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      date,
      category,
      description: description.trim()
    });
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Dodaj Nowe Wydarzenie</h3>
              <p className="text-[11px] text-slate-400">Terminarz, sprawdziany i wydarzenia osobiste</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Tytuł wydarzenia:</label>
            <input
              type="text"
              required
              placeholder="np. Sprawdzian z Systemów Operacyjnych"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Data:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Kategoria:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="Sprawdzian">Sprawdzian</option>
                <option value="Kartkówka">Kartkówka</option>
                <option value="Nieobecność nauczyciela">Nieobecność nauczyciela</option>
                <option value="Wydarzenie osobiste">Wydarzenie osobiste</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Opis / Zagadnienia:</label>
            <textarea
              rows={3}
              placeholder="np. Dział 3: Zarządzanie pamięcią i procesy systemowe"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dodaj do terminarza</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
