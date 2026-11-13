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
  ShieldCheck,
  Server,
  Cpu,
  ChevronDown,
  ChevronsUpDown,
  Globe,
  BrainCircuit,
  UserCheck,
  Search,
  Calendar,
  Network
} from 'lucide-react';

interface SidebarProps {
  systemStatus?: 'nominal' | 'degraded' | 'offline';
}

interface NavItem {
  to: string;
  label: string;
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
      { to: '/', label: 'Pulpit', icon: LayoutGrid },
      { to: '/chat', label: 'Asystent', icon: MessageSquare },
      { to: '/search', label: 'Wyszukiwarka', icon: Search },
      { to: '/widgets', label: 'Narzędzia', icon: Cpu }
    ]
  },
  {
    id: 'organization',
    title: 'Harmonogram i finanse',
    items: [
      { to: '/school', label: 'Plan lekcji', icon: GraduationCap },
      { to: '/calendar', label: 'Kalendarz', icon: Calendar },
      { to: '/private', label: 'Dziennik osobisty', icon: UserCheck },
      { to: '/finance', label: 'Budżet domowy', icon: Wallet }
    ]
  },
  {
    id: 'activity',
    title: 'Aktywność',
    items: [
      { to: '/workouts', label: 'Trening i ruch', icon: Dumbbell },
      { to: '/traffic', label: 'Trasa i ruch', icon: Radio }
    ]
  },
  {
    id: 'system',
    title: 'System',
    items: [
      { to: '/entities', label: 'Baza wiedzy', icon: Network },
      { to: '/memory', label: 'Pamięć asystenta', icon: BrainCircuit },
      { to: '/osint', label: 'Narzędzia sieciowe', icon: Globe },
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

export const Sidebar: React.FC<SidebarProps> = ({ systemStatus = 'nominal' }) => {
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
          // ignore storage errors
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
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1424] px-4 py-5 z-30 select-none transition-colors">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-1 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white block leading-tight">
              OmniDash
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Pulpit osobisty</span>
          </div>
        </div>

        {/* Global Collapse/Expand Toggle Button */}
        <button
          type="button"
          onClick={toggleAll}
          title="Zwiń / Rozwiń wszystkie kategorie"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
        >
          <ChevronsUpDown className="w-4 h-4" />
        </button>
      </div>

      {/* Collapsible Categories Navigation */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
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
                className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 group focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>{cat.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
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
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none ${
                        isActive
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer System Status Capsule */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              Stan systemu
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {systemStatus === 'nominal' ? 'Aktywny' : 'Ograniczony'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
