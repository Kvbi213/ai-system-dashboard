import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveCloudDocument, clearChatHistoryCloud } from '../services/cloudSync';

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
      const clearTimestamp = Date.now();
      localStorage.setItem('system_chat_cleared_worker', String(clearTimestamp));
      localStorage.setItem('system_chat_cleared_mentor', String(clearTimestamp));
      localStorage.removeItem('system_chat_history');
      localStorage.removeItem('system_mentor_history');
      clearChatHistoryCloud('all').catch(() => {});
      window.dispatchEvent(new CustomEvent('chatCleared', { detail: { timestamp: clearTimestamp, mode: 'all' } }));
      showToast('Pamięć konwersacji wyczyszczona w chmurze i lokalnie.');
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
    { id: 'nav_dash', label: 'Przejdź do: Pulpit Główny', category: 'Nawigacja', icon: 'dashboard', type: 'navigate', path: '/' },
    { id: 'nav_chat', label: 'Przejdź do: Asystent AI (Chat Terminal)', category: 'Nawigacja', icon: 'smart_toy', type: 'navigate', path: '/chat' },
    { id: 'nav_timetable', label: 'Przejdź do: Plan Lekcji & Zajęć', category: 'Nawigacja', icon: 'schedule', type: 'navigate', path: '/timetable' },
    { id: 'nav_grades', label: 'Przejdź do: Oceny Librus & Średnia', category: 'Nawigacja', icon: 'school', type: 'navigate', path: '/grades' },
    { id: 'nav_fin', label: 'Przejdź do: Finanse & Budżet 50/30/20', category: 'Nawigacja', icon: 'account_balance_wallet', type: 'navigate', path: '/finances' },
    { id: 'nav_cal', label: 'Przejdź do: Kalendarz Operacyjny', category: 'Nawigacja', icon: 'calendar_month', type: 'navigate', path: '/calendar' },
    { id: 'nav_work', label: 'Przejdź do: Treningi & Fitness FBW', category: 'Nawigacja', icon: 'fitness_center', type: 'navigate', path: '/workouts' },
    { id: 'nav_osint', label: 'Przejdź do: Centrum Wywiadu OSINT', category: 'Nawigacja', icon: 'radar', type: 'navigate', path: '/osint' },
    { id: 'nav_entities', label: 'Przejdź do: Podmioty & Graf Relacji', category: 'Nawigacja', icon: 'hub', type: 'navigate', path: '/entities' },
    { id: 'nav_memory', label: 'Przejdź do: Pamięć Długoterminowa AI', category: 'Nawigacja', icon: 'memory', type: 'navigate', path: '/memory' },
    { id: 'nav_widgets', label: 'Przejdź do: Widżety & Telemetria', category: 'Nawigacja', icon: 'monitoring', type: 'navigate', path: '/widgets' },
    { id: 'nav_server', label: 'Przejdź do: Status Serwera & Logi SSE', category: 'Nawigacja', icon: 'terminal', type: 'navigate', path: '/server' },
    { id: 'nav_settings', label: 'Przejdź do: Ustawienia Systemu', category: 'Nawigacja', icon: 'settings', type: 'navigate', path: '/settings' },

    // Szybkie Akcje
    { id: 'act_task', label: 'Szybkie Zadanie: Dodaj do Listy To-Do', category: 'Szybka Akcja', icon: 'add_task', type: 'submode', mode: 'quick_task' },
    { id: 'act_note', label: 'Szybka Notatka: Zapisz Myśl w Chmurze', category: 'Szybka Akcja', icon: 'note_add', type: 'submode', mode: 'quick_note' },
    { id: 'act_theme', label: 'Przełącz Motyw (Ciemny / Jasny)', category: 'System', icon: 'palette', type: 'theme' },
    { id: 'act_clear', label: 'Wyczyść Historię Czatu (Reset AI)', category: 'System', icon: 'delete_sweep', type: 'clear_chat' },
    { id: 'act_lock', label: 'Zablokuj Terminal (Ekran Blokady)', category: 'Bezpieczeństwo', icon: 'lock', type: 'lock' },
  ];

  const filtered = actions.filter(a => 
    a.label.toLowerCase().includes(query.toLowerCase()) || 
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyNav = (e) => {
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
        {/* Floating Quick Action trigger in bottom right */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-40 hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-container-low/90 hover:bg-surface-container backdrop-blur-md border border-white/[0.08] hover:border-primary/50 text-outline hover:text-primary rounded-full text-xs font-code-mono transition-all shadow-lg group active:scale-95"
          title="Otwórz Omni Command Palette (Ctrl+K)"
        >
          <span className="material-symbols-outlined text-[15px] text-primary">terminal</span>
          <span className="group-hover:inline">Omni Cmd</span>
          <kbd className="px-1.5 py-0.5 bg-surface-container-high rounded text-[10px] text-on-surface">Ctrl+K</kbd>
        </button>

        {/* Global Toast Notification */}
        {notification && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface-container-lowest/90 backdrop-blur-md border border-primary/50 text-primary px-4 py-2 rounded-xl text-xs font-code-mono shadow-2xl flex items-center gap-2 animate-soft-enter">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>{notification}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-24 px-4 animate-fade-in">
      <div 
        className="w-full max-w-xl bg-surface-container-low/95 border border-white/[0.08] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.08] bg-surface-container-lowest/80">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0">search</span>
          
          {subMode ? (
            <form onSubmit={handleSubSubmit} className="flex-1 flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={subInput}
                onChange={e => setSubInput(e.target.value)}
                placeholder={subMode === 'quick_task' ? 'Wpisz treść zadania do zapisania...' : 'Wpisz treść szybkiej notatki...'}
                className="w-full bg-transparent text-on-surface text-sm font-code-mono outline-none placeholder:text-outline"
                autoFocus
              />
            </form>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyNav}
              placeholder="Wpisz polecenie lub szukaj modułu... (np. finanse, zadanie, motyw)"
              className="w-full bg-transparent text-on-surface text-sm font-code-mono outline-none placeholder:text-outline"
              autoFocus
            />
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {subMode && (
              <button 
                onClick={() => setSubMode(null)} 
                className="px-2 py-0.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded text-[11px] font-code-mono transition-colors active:scale-95"
              >
                Cofnij
              </button>
            )}
            <kbd className="px-2 py-0.5 bg-surface-container-high border border-white/[0.08] text-[10px] font-code-mono text-outline rounded">
              ESC
            </kbd>
          </div>
        </div>

        {/* Action List / Submode View */}
        {subMode ? (
          <div className="p-5 text-xs font-code-mono text-on-surface-variant flex flex-col gap-3">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>{subMode === 'quick_task' ? 'Dodawanie zadania do synchronizacji chmurowej' : 'Tworzenie nowej notatki w chmurze'}</span>
            </div>
            <p>Naciśnij <kbd className="px-1.5 py-0.5 bg-surface-container-high border border-white/[0.08] rounded text-on-surface">Enter</kbd>, aby zatwierdzić i natychmiast zsynchronizować wpis z bazą Firestore.</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-xs font-code-mono text-outline">
                Nie znaleziono pasujących poleceń.
              </div>
            ) : (
              filtered.map((action, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all active:scale-[0.98] ${
                      isSelected 
                        ? 'bg-surface-container-high border border-primary/40 text-primary shadow-sm' 
                        : 'text-on-surface hover:bg-surface-container border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${
                        isSelected ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-surface-container border-white/[0.06] text-outline'
                      }`}>
                        <span className="material-symbols-outlined text-[18px]">{action.icon}</span>
                      </div>
                      <div>
                        <p className="font-code-mono text-xs font-medium text-on-surface">{action.label}</p>
                        <span className="text-[10px] font-code-mono text-outline uppercase tracking-wider">{action.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <span className="text-[10px] font-code-mono flex items-center gap-1 text-primary">
                          Wykonaj <span className="material-symbols-outlined text-[14px]">subdirectory_arrow_left</span>
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
        <div className="p-2.5 border-t border-white/[0.08] bg-surface-container-lowest flex items-center justify-between text-[10px] font-code-mono text-outline px-4">
          <div className="flex items-center gap-3">
            <span>Nawigacja: <kbd className="px-1 bg-surface-container rounded">↑</kbd> <kbd className="px-1 bg-surface-container rounded">↓</kbd></span>
            <span>Wybór: <kbd className="px-1 bg-surface-container rounded">Enter</kbd></span>
            <span>Zamknij: <kbd className="px-1 bg-surface-container rounded">Esc</kbd></span>
          </div>
          <span className="text-primary font-medium">OmniDash Engine v3.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
