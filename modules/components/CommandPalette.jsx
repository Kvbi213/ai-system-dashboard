import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Terminal, CheckSquare, FileText, Calendar, Wallet, 
  Dumbbell, Shield, Settings, Lock, Sun, Moon, Sparkles, Globe, 
  Cpu, ArrowRight, CornerDownLeft, Plus, GraduationCap 
} from 'lucide-react';
import { saveCloudDocument } from '../services/cloudSync';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [subMode, setSubMode] = useState(null); // null | 'quick_task' | 'quick_note'
  const [subInput, setSubInput] = useState('');
  const [notification, setNotification] = useState(null);

  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Globalny listener skrótu klawiszowego Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        if (subMode) {
          setSubMode(null);
          setSubInput('');
        } else {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, subMode]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setSubMode(null);
      setSubInput('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAction = async (action) => {
    if (action.type === 'navigate') {
      navigate(action.path);
      setIsOpen(false);
    } else if (action.type === 'submode') {
      setSubMode(action.mode);
      setSubInput('');
      setTimeout(() => inputRef.current?.focus(), 50);
    } else if (action.type === 'theme') {
      const isLight = document.documentElement.classList.toggle('theme-light');
      localStorage.setItem('system_theme', isLight ? 'light' : 'dark');
      showToast(`Przełączono motyw na: ${isLight ? 'Jasny' : 'Ciemny'}`);
      setIsOpen(false);
    } else if (action.type === 'lock') {
      sessionStorage.removeItem('dashboard_token');
      window.location.reload();
    } else if (action.type === 'clear_chat') {
      localStorage.removeItem('system_chat_history');
      localStorage.removeItem('system_mentor_history');
      showToast('Pamięć podręczna konwersacji wyczyszczona.');
      setIsOpen(false);
    }
  };

  const handleSubSubmit = async (e) => {
    e.preventDefault();
    if (!subInput.trim()) return;

    if (subMode === 'quick_task') {
      const newTask = {
        id: Date.now().toString(),
        title: subInput.trim(),
        status: 'pending',
        priority: 'MEDIUM',
        category: 'jednorazowe',
        created_at: new Date().toISOString()
      };
      await saveCloudDocument('tasks', newTask.id, newTask);
      showToast('Dodano nowe zadanie do Cloud Firestore!');
    } else if (subMode === 'quick_note') {
      const newNote = {
        id: Date.now().toString(),
        text: subInput.trim(),
        created_at: new Date().toISOString()
      };
      await saveCloudDocument('notes', newNote.id, newNote);
      showToast('Zapisano notatkę w chmurze!');
    }

    setIsOpen(false);
    setSubMode(null);
    setSubInput('');
  };

  const actions = [
    // Nawigacja
    { id: 'nav_dash', label: 'Przejdź do: Pulpit Główny', category: 'Nawigacja', icon: Cpu, type: 'navigate', path: '/' },
    { id: 'nav_chat', label: 'Przejdź do: Asystent AI (Chat Terminal)', category: 'Nawigacja', icon: Terminal, type: 'navigate', path: '/chat' },
    { id: 'nav_timetable', label: 'Przejdź do: Plan Lekcji & Zajęć', category: 'Nawigacja', icon: GraduationCap, type: 'navigate', path: '/timetable' },
    { id: 'nav_fin', label: 'Przejdź do: Finanse & Budżet 50/30/20', category: 'Nawigacja', icon: Wallet, type: 'navigate', path: '/finances' },
    { id: 'nav_cal', label: 'Przejdź do: Kalendarz Operacyjny', category: 'Nawigacja', icon: Calendar, type: 'navigate', path: '/calendar' },
    { id: 'nav_work', label: 'Przejdź do: Treningi & Fitness', category: 'Nawigacja', icon: Dumbbell, type: 'navigate', path: '/workouts' },
    { id: 'nav_search', label: 'Przejdź do: Wyszukiwarka Web', category: 'Nawigacja', icon: Search, type: 'navigate', path: '/search' },
    { id: 'nav_browser', label: 'Przejdź do: Przeglądarka Wewnętrzna', category: 'Nawigacja', icon: Globe, type: 'navigate', path: '/browser' },
    { id: 'nav_osint', label: 'Przejdź do: Moduł OSINT & Wywiad', category: 'Nawigacja', icon: Shield, type: 'navigate', path: '/osint' },
    { id: 'nav_settings', label: 'Przejdź do: Ustawienia Systemu', category: 'Nawigacja', icon: Settings, type: 'navigate', path: '/settings' },

    // Szybkie Akcje
    { id: 'act_task', label: 'Szybkie Zadanie: Dodaj do Listy To-Do', category: 'Szybka Akcja', icon: Plus, type: 'submode', mode: 'quick_task' },
    { id: 'act_note', label: 'Szybka Notatka: Zapisz Myśl w Chmurze', category: 'Szybka Akcja', icon: FileText, type: 'submode', mode: 'quick_note' },
    { id: 'act_theme', label: 'Przełącz Motyw (Ciemny / Jasny)', category: 'System', icon: Sun, type: 'theme' },
    { id: 'act_clear', label: 'Wyczyść Historię Czatu (Reset AI)', category: 'System', icon: Sparkles, type: 'clear_chat' },
    { id: 'act_lock', label: 'Zablokuj Terminal (Ekran Blokady)', category: 'Bezpieczeństwo', icon: Lock, type: 'lock' },
  ];

  const filtered = actions.filter(a => 
    a.label.toLowerCase().includes(query.toLowerCase()) || 
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (subMode) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleAction(filtered[selectedIndex]);
      }
    }
  };

  if (!isOpen) {
    return (
      <>
        {/* Dyskretny wskaźnik skrótu klawiszowego w prawym dolnym rogu */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-40 hidden sm:flex items-center gap-2 px-3 py-1.5 bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/10 hover:border-accentPrimary/50 text-textMuted hover:text-accentPrimary rounded-full text-xs font-mono transition-all shadow-lg group"
          title="Otwórz Omni Command Palette (Ctrl+K)"
        >
          <Terminal className="w-3.5 h-3.5 text-accentPrimary" />
          <span className="group-hover:inline">Omni Cmd</span>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-textPrimary">Ctrl+K</kbd>
        </button>

        {/* Globalny Toast Notification */}
        {notification && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md border border-accentPrimary/50 text-accentPrimary px-4 py-2 rounded-xl text-xs font-mono shadow-2xl flex items-center gap-2 animate-soft-enter">
            <Sparkles className="w-4 h-4 text-accentPrimary" />
            <span>{notification}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-24 px-4 animate-fade-in">
      <div 
        className="w-full max-w-xl bg-[#0e1015]/95 border border-white/15 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/[0.02]">
          <Search className="w-5 h-5 text-accentPrimary shrink-0" />
          
          {subMode ? (
            <form onSubmit={handleSubSubmit} className="flex-1 flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={subInput}
                onChange={e => setSubInput(e.target.value)}
                placeholder={subMode === 'quick_task' ? 'Wpisz treść zadania do zapisania...' : 'Wpisz treść szybkiej notatki...'}
                className="w-full bg-transparent text-textPrimary text-sm font-mono outline-none placeholder:text-textMuted"
                autoFocus
              />
            </form>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Wpisz polecenie lub szukaj modułu... (np. finanse, zadanie, motyw)"
              className="w-full bg-transparent text-textPrimary text-sm font-mono outline-none placeholder:text-textMuted"
              autoFocus
            />
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {subMode && (
              <button 
                onClick={() => setSubMode(null)} 
                className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-textMuted hover:text-white rounded text-[11px] font-mono transition-colors"
              >
                Cofnij
              </button>
            )}
            <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/10 text-[10px] font-mono text-textMuted rounded">
              ESC
            </kbd>
          </div>
        </div>

        {/* Action List / Submode View */}
        {subMode ? (
          <div className="p-5 text-xs font-mono text-textMuted flex flex-col gap-3">
            <div className="flex items-center gap-2 text-accentPrimary font-semibold">
              <Plus className="w-4 h-4" />
              <span>{subMode === 'quick_task' ? 'Dodawanie zadania do synchronizacji chmurowej' : 'Tworzenie nowej notatki w chmurze'}</span>
            </div>
            <p>Naciśnij <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-textPrimary">Enter</kbd>, aby zatwierdzić i natychmiast zsynchronizować wpis z bazą Firestore.</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-xs font-mono text-textMuted">
                Nie znaleziono pasujących poleceń.
              </div>
            ) : (
              filtered.map((action, idx) => {
                const Icon = action.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                      isSelected 
                        ? 'bg-accentPrimary/15 border border-accentPrimary/30 text-accentPrimary shadow-[0_0_15px_rgba(0,229,255,0.1)]' 
                        : 'text-textPrimary hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${
                        isSelected ? 'bg-accentPrimary/20 border-accentPrimary/40 text-accentPrimary' : 'bg-white/5 border-white/10 text-textMuted'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-mono text-xs font-medium text-textPrimary">{action.label}</p>
                        <span className="text-[10px] font-mono text-textMuted uppercase tracking-wider">{action.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <span className="text-[10px] font-mono flex items-center gap-1 text-accentPrimary">
                          Wykonaj <CornerDownLeft className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-2.5 border-t border-white/10 bg-black/40 flex items-center justify-between text-[10px] font-mono text-textMuted px-4">
          <div className="flex items-center gap-3">
            <span>Nawigacja: <kbd className="px-1 bg-white/10 rounded">↑</kbd> <kbd className="px-1 bg-white/10 rounded">↓</kbd></span>
            <span>Wybór: <kbd className="px-1 bg-white/10 rounded">Enter</kbd></span>
            <span>Zamknij: <kbd className="px-1 bg-white/10 rounded">Esc</kbd></span>
          </div>
          <span className="text-accentPrimary/70">OmniDash Engine v2.3.0</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
