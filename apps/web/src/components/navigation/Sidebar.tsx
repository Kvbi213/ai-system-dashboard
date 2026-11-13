import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  MessageSquare,
  GraduationCap,
  Wallet,
  Dumbbell,
  Radio,
  Sliders,
  Server,
  Cpu,
  ChevronDown,
  ChevronsUpDown,
  Globe,
  BrainCircuit,
  UserCheck,
  Search,
  Calendar,
  Network,
  Command,
  Activity
} from 'lucide-react';

interface SidebarProps {
  systemStatus?: 'nominal' | 'degraded' | 'offline';
  onOpenCommandPalette?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  badge?: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavCategory {
  id: string;
  title: string;
  items: NavItem[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    id: 'core',
    title: 'Główne',
    items: [
      { to: '/', label: 'Pulpit', shortcut: '1', icon: LayoutGrid },
      { to: '/chat', label: 'Asystent AI', shortcut: '2', icon: MessageSquare },
      { to: '/search', label: 'Wyszukiwarka', shortcut: '3', icon: Search },
      { to: '/widgets', label: 'Narzędzia', icon: Cpu }
    ]
  },
  {
    id: 'organization',
    title: 'Harmonogram i finanse',
    items: [
      { to: '/school', label: 'Plan lekcji', shortcut: '4', icon: GraduationCap },
      { to: '/calendar', label: 'Kalendarz', icon: Calendar },
      { to: '/private', label: 'Dziennik osobisty', icon: UserCheck },
      { to: '/finance', label: 'Budżet domowy', shortcut: '5', icon: Wallet }
    ]
  },
  {
    id: 'activity',
    title: 'Aktywność',
    items: [
      { to: '/workouts', label: 'Trening FBW', icon: Dumbbell },
      { to: '/traffic', label: 'Trasa i ruch', icon: Radio }
    ]
  },
  {
    id: 'system',
    title: 'System i wiedza',
    items: [
      { to: '/entities', label: 'Baza wiedzy', icon: Network },
      { to: '/memory', label: 'Pamięć asystenta', icon: BrainCircuit },
      { to: '/osint', label: 'Narzędzia OSINT', icon: Globe },
      { to: '/server', label: 'Stan serwera', icon: Server },
      { to: '/settings', label: 'Ustawienia', icon: Sliders }
    ]
  }
];

const STORAGE_KEY = 'omnidash_sidebar_collapsed_categories';

const NAV_ROUTE_MAP: Record<string, string> = {
  '/': 'dashboard',
  '/chat': 'chat',
  '/school': 'school',
  '/private': 'private',
  '/finance': 'finance',
  '/workouts': 'workouts',
  '/traffic': 'cameras'
};

export const Sidebar: React.FC<SidebarProps> = ({
  systemStatus = 'nominal',
  onOpenCommandPalette
}) => {
  const location = useLocation();

  const [navVisible, setNavVisible] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('omnidash_nav_visible');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleNavChanged = () => {
      try {
        const saved = localStorage.getItem('omnidash_nav_visible');
        if (saved) setNavVisible(JSON.parse(saved));
      } catch {
        // ignore
      }
    };
    window.addEventListener('omnidash_nav_changed', handleNavChanged);
    return () => window.removeEventListener('omnidash_nav_changed', handleNavChanged);
  }, []);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Auto-expand category containing active route
  useEffect(() => {
    const activeCat = NAV_CATEGORIES.find((cat) =>
      cat.items.some((item) => (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)))
    );
    if (activeCat && collapsed[activeCat.id]) {
      setCollapsed((prev) => {
        const next = { ...prev, [activeCat.id]: false };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  }, [location.pathname]);

  const toggleCategory = (id: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleAll = () => {
    const areAnyExpanded = NAV_CATEGORIES.some((cat) => !collapsed[cat.id]);
    const nextState: Record<string, boolean> = {};
    NAV_CATEGORIES.forEach((cat) => {
      nextState[cat.id] = areAnyExpanded;
    });
    setCollapsed(nextState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // ignore
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0c101b] px-3.5 py-4 z-30 select-none transition-colors duration-200">
      {/* Workspace Header */}
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold shadow-xs">
            <span className="text-xs font-mono font-extrabold tracking-tighter">OD</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                OmniDash
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold">
                v2.5
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Sovereign Station
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleAll}
          title="Zwiń / Rozwiń wszystkie sekcje"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
          aria-label="Przełącz wszystkie kategorie"
        >
          <ChevronsUpDown className="w-4 h-4" />
        </button>
      </div>

      {/* Omnibox / Search Quick Button (Linear style) */}
      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="w-full flex items-center justify-between px-3 py-2 mb-4 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition shadow-2xs group"
      >
        <span className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          <span>Szukaj funkcji...</span>
        </span>
        <span className="flex items-center gap-0.5 font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/5">
          <Command className="w-3 h-3" />K
        </span>
      </button>

      {/* Navigation Categories */}
      <div className="flex-1 space-y-3.5 overflow-y-auto pr-1">
        {NAV_CATEGORIES.map((cat) => {
          const visibleItems = cat.items.filter((item) => {
            const key = NAV_ROUTE_MAP[item.to];
            if (!key) return true;
            return navVisible[key] !== false;
          });
          if (visibleItems.length === 0) return null;
          const isCollapsed = Boolean(collapsed[cat.id]);
          return (
            <div key={cat.id} className="transition-all">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                aria-expanded={!isCollapsed}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition rounded-lg group focus-visible:outline-hidden"
              >
                <div className="flex items-center gap-1.5">
                  <span>{cat.title}</span>
                  <span className="text-[10px] px-1 rounded bg-slate-200/60 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 font-mono">
                    {visibleItems.length}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 ${
                    isCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                />
              </button>

              {/* Items Container */}
              <div
                className={`space-y-0.5 transition-all duration-200 ease-in-out ${
                  isCollapsed ? 'max-h-0 opacity-0 overflow-hidden py-0' : 'max-h-96 opacity-100 py-1'
                }`}
              >
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 ${
                        isActive
                          ? 'bg-slate-900 dark:bg-white/[0.12] text-white font-medium shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.05]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 truncate">
                          <item.icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.shortcut && (
                          <span
                            className={`text-[10px] font-mono px-1 rounded ${
                              isActive
                                ? 'text-slate-300 dark:text-slate-300 bg-white/10'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {item.shortcut}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer System Telemetry Status (Raycast pill) */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
        <div className="p-2.5 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] text-xs shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] font-medium">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              Klaster Mikrus
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {systemStatus === 'nominal' ? '24/7 Aktywny' : 'Degraded'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
