import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutGrid,
  MessageSquare,
  GraduationCap,
  Wallet,
  Dumbbell,
  Radio,
  Sliders,
  Server,
  Cpu,
  Globe,
  BrainCircuit,
  UserCheck,
  Calendar,
  Network,
  Sun,
  Moon,
  Lock,
  ArrowRight,
  X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface CommandItem {
  id: string;
  title: string;
  category: 'Nawigacja' | 'Akcje' | 'System';
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  perform: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTasks?: () => void;
  onLockScreen?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenTasks,
  onLockScreen
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const commands: CommandItem[] = [
    // Nawigacja
    {
      id: 'nav-dashboard',
      title: 'Pulpit główny',
      category: 'Nawigacja',
      shortcut: 'G D',
      icon: LayoutGrid,
      perform: () => navigate('/')
    },
    {
      id: 'nav-chat',
      title: 'Asystent Omni AI',
      category: 'Nawigacja',
      shortcut: 'G C',
      icon: MessageSquare,
      perform: () => navigate('/chat')
    },
    {
      id: 'nav-school',
      title: 'Plan lekcji i szkoła',
      category: 'Nawigacja',
      shortcut: 'G S',
      icon: GraduationCap,
      perform: () => navigate('/school')
    },
    {
      id: 'nav-calendar',
      title: 'Kalendarz i sprawdziany',
      category: 'Nawigacja',
      shortcut: 'G K',
      icon: Calendar,
      perform: () => navigate('/calendar')
    },
    {
      id: 'nav-finance',
      title: 'Budżet domowy i wydatki',
      category: 'Nawigacja',
      shortcut: 'G F',
      icon: Wallet,
      perform: () => navigate('/finance')
    },
    {
      id: 'nav-workouts',
      title: 'Trening siłowy i ruch',
      category: 'Nawigacja',
      shortcut: 'G T',
      icon: Dumbbell,
      perform: () => navigate('/workouts')
    },
    {
      id: 'nav-traffic',
      title: 'Kamery drogowe i alerty',
      category: 'Nawigacja',
      shortcut: 'G R',
      icon: Radio,
      perform: () => navigate('/traffic')
    },
    {
      id: 'nav-widgets',
      title: 'Narzędzia i widżety',
      category: 'Nawigacja',
      shortcut: 'G W',
      icon: Cpu,
      perform: () => navigate('/widgets')
    },
    {
      id: 'nav-memory',
      title: 'Baza pamięci asystenta',
      category: 'Nawigacja',
      shortcut: 'G M',
      icon: BrainCircuit,
      perform: () => navigate('/memory')
    },
    {
      id: 'nav-private',
      title: 'Dziennik osobisty i nawyki',
      category: 'Nawigacja',
      shortcut: 'G P',
      icon: UserCheck,
      perform: () => navigate('/private')
    },
    {
      id: 'nav-entities',
      title: 'Baza wiedzy i encje',
      category: 'Nawigacja',
      icon: Network,
      perform: () => navigate('/entities')
    },
    {
      id: 'nav-osint',
      title: 'Narzędzia sieciowe OSINT',
      category: 'Nawigacja',
      icon: Globe,
      perform: () => navigate('/osint')
    },
    {
      id: 'nav-server',
      title: 'Telemetria serwera Mikrus',
      category: 'Nawigacja',
      shortcut: 'G V',
      icon: Server,
      perform: () => navigate('/server')
    },
    {
      id: 'nav-settings',
      title: 'Ustawienia systemu',
      category: 'Nawigacja',
      shortcut: 'G U',
      icon: Sliders,
      perform: () => navigate('/settings')
    },
    // Akcje
    {
      id: 'act-theme',
      title: theme === 'dark' ? 'Włącz motyw jasny' : 'Włącz motyw ciemny',
      category: 'Akcje',
      shortcut: 'T',
      icon: theme === 'dark' ? Sun : Moon,
      perform: () => toggleTheme()
    },
    {
      id: 'act-tasks',
      title: 'Otwórz panel zadań na dziś',
      category: 'Akcje',
      shortcut: 'Z',
      icon: LayoutGrid,
      perform: () => {
        if (onOpenTasks) onOpenTasks();
      }
    },
    {
      id: 'act-lock',
      title: 'Zablokuj ekran (PIN)',
      category: 'System',
      shortcut: 'L',
      icon: Lock,
      perform: () => {
        if (onLockScreen) onLockScreen();
      }
    }
  ];

  const filtered = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filtered[selectedIndex];
      if (selected) {
        selected.perform();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Wyszukiwarka funkcji i nawigacja"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#101524] border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-white/[0.08]">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj widoku, polecenia lub narzędzia... (np. zadania, kalendarz, serwer)"
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block text-[11px] font-mono px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 text-slate-400">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Nie znaleziono wyników dla &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.perform();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-slate-200 dark:bg-white/[0.12] text-slate-900 dark:text-white'
                          : 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{cmd.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/[0.04]">
                      {cmd.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 text-slate-400">
                        {cmd.shortcut}
                      </span>
                    )}
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-black/20 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-white dark:bg-white/10 px-1 rounded border border-slate-200 dark:border-white/10">↑↓</kbd> Nawiguj
            </span>
            <span>
              <kbd className="font-mono bg-white dark:bg-white/10 px-1 rounded border border-slate-200 dark:border-white/10">↵</kbd> Wybierz
            </span>
          </div>
          <span>OmniDash Omnibox</span>
        </div>
      </div>
    </div>
  );
};
