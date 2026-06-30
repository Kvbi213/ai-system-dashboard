import React, { useState, useEffect } from 'react';
import { TerminalSquare, Save, Trash2 } from 'lucide-react';

const QuickNotes = () => {
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedNote = localStorage.getItem('system_quicknotes');
    if (savedNote) setNote(savedNote);
  }, []);

  const handleSave = () => {
    localStorage.setItem('system_quicknotes', note);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    if (confirm('Czy na pewno chcesz usunąć notatki?')) {
      setNote('');
      localStorage.removeItem('system_quicknotes');
    }
  };

  return (
    <div className="glass-panel p-5 rounded-xl border border-border h-full flex flex-col relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accentSecondary/10 border border-accentSecondary/30 flex items-center justify-center">
            <TerminalSquare className="w-4 h-4 text-accentSecondary" />
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold text-accentSecondary tracking-tight">Scratchpad</h2>
            <p className="font-sans text-[10px] text-textMuted uppercase tracking-wider">Local Storage</p>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleSave} 
            className="p-1.5 hover:bg-white/5 rounded-md text-textMuted hover:text-accentPrimary transition-colors"
            title="Zapisz"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleClear} 
            className="p-1.5 hover:bg-white/5 rounded-md text-textMuted hover:text-red-400 transition-colors"
            title="Wyczyść"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleSave}
          placeholder="Wpisz komendy, IP lub przemyślenia..."
          className="w-full h-full bg-transparent border-none resize-none outline-none font-mono text-xs text-textPrimary placeholder:text-textMuted/50 focus:ring-0 p-0"
        />
        {saved && (
          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-accentPrimary animate-fade-in-up">
            Zapisano.
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickNotes;
