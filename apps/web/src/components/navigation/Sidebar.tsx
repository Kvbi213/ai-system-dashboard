import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  MessageSquare,
  Clock,
  GraduationCap,
  Wallet,
  Dumbbell,
  Radio,
  Sliders,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface SidebarProps {
  systemStatus?: 'nominal' | 'degraded' | 'offline';
}

export const Sidebar: React.FC<SidebarProps> = ({ systemStatus = 'nominal' }) => {
  const mainNav = [
    { to: '/', label: 'Pulpit', icon: LayoutGrid },
    { to: '/chat', label: 'Czat AI', icon: MessageSquare },
    { to: '/timetable', label: 'Plan lekcji', icon: Clock },
    { to: '/grades', label: 'Oceny Librus', icon: GraduationCap }
  ];

  const secondaryNav = [
    { to: '/finance', label: 'Finanse 50/30/20', icon: Wallet },
    { to: '/workouts', label: 'Trening FBW', icon: Dumbbell },
    { to: '/traffic', label: 'Radary & Kamery', icon: Radio },
    { to: '/settings', label: 'Ustawienia', icon: Sliders }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-white/80 bg-white/60 backdrop-blur-3xl px-4 py-6 z-30 select-none shadow-sm">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 mb-8">
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
          <p className="text-xs text-slate-500 font-mono">Kvbi213 Core Edge</p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Główne moduły
          </p>
          <div className="space-y-1">
            {mainNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-700 border border-sky-300/60 shadow-sm shadow-sky-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Zarządzanie i Narzędzia
          </p>
          <div className="space-y-1">
            {secondaryNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-700 border border-sky-300/60 shadow-sm shadow-sky-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Footer System Telemetry Capsule */}
      <div className="pt-4 border-t border-slate-200/80">
        <div className="p-3 rounded-2xl bg-white/80 border border-white/90 shadow-sm text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Cpu className="w-3.5 h-3.5 text-sky-600" />
              Status węzła
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
