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
  Globe
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
    title: 'Centrum Operacyjne',
    items: [
      { to: '/', label: 'Pulpit Główny', icon: LayoutGrid },
      { to: '/chat', label: 'Czat Asystenta AI', icon: MessageSquare }
    ]
  },
  {
    id: 'organization',
    title: 'Harmonogram i Finanse',
    items: [
      { to: '/school', label: 'Harmonogram & Edukacja', icon: GraduationCap },
      { to: '/finance', label: 'Budżet 50/30/20', icon: Wallet }
    ]
  },
  {
    id: 'activity',
    title: 'Aktywność i Pomiary',
    items: [
      { to: '/workouts', label: 'Trening FBW & Nawyki', icon: Dumbbell },
      { to: '/traffic', label: 'Monitoring Tras & Radary', icon: Radio }
    ]
  },
  {
    id: 'system',
    title: 'System i Administracja',
    items: [
      { to: '/osint', label: 'OSINT & Telemetria IP', icon: Globe },
      { to: '/server', label: 'Infrastruktura Serwera', icon: Server },
      { to: '/settings', label: 'Ustawienia Zero-Trust', icon: Sliders }
    ]
  }
];

const STORAGE_KEY = 'omnidash_sidebar_collapsed_categories';

export const Sidebar: React.FC<SidebarProps> = ({ systemStatus = 'nominal' }) => {
  const location = useLocation();

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
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-white/80 bg-white/60 backdrop-blur-3xl px-4 py-6 z-30 select-none shadow-sm">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-1 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 border border-white/80">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-slate-900">OmniDash</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 font-bold">
                v4.0
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">Workspace System</p>
          </div>
        </div>

        {/* Global Collapse/Expand Toggle Button */}
        <button
          type="button"
          onClick={toggleAll}
          title="Zwiń / Rozwiń wszystkie kategorie"
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 border border-transparent hover:border-slate-200 transition"
        >
          <ChevronsUpDown className="w-4 h-4" />
        </button>
      </div>

      {/* Collapsible Categories Navigation */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {NAV_CATEGORIES.map((cat) => {
          const isCollapsed = Boolean(collapsed[cat.id]);
          return (
            <div key={cat.id} className="rounded-2xl transition-all">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                aria-expanded={!isCollapsed}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition rounded-xl hover:bg-white/50 group"
              >
                <div className="flex items-center gap-1.5">
                  <span>{cat.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200/60 text-slate-600 font-mono font-semibold">
                    {cat.items.length}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 group-hover:text-slate-600 ${
                    isCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                />
              </button>

              {/* Items Container */}
              <div
                className={`space-y-1 transition-all duration-200 ease-in-out ${
                  isCollapsed ? 'max-h-0 opacity-0 overflow-hidden py-0' : 'max-h-96 opacity-100 py-1'
                }`}
              >
                {cat.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-sky-500/15 text-sky-700 border border-sky-300/60 shadow-sm shadow-sky-100 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer System Telemetry Capsule */}
      <div className="pt-4 border-t border-slate-200/80">
        <div className="p-3 rounded-2xl bg-white/80 border border-white/90 shadow-sm text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Cpu className="w-3.5 h-3.5 text-sky-600" />
              Węzeł Systemu
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {systemStatus === 'nominal' ? 'NOMINAL' : 'DEGRADED'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">SSE Stream :: 20 ms</p>
        </div>
      </div>
    </aside>
  );
};
