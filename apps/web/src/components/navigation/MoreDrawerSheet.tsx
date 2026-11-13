import React from 'react';
import { NavLink } from 'react-router-dom';
import { BottomActionSheet } from '../ui/BottomActionSheet';
import { Dumbbell, Radio, Server, Sliders, ShieldCheck, ChevronRight, Globe, Cpu, BrainCircuit, UserCheck, Calendar, Network, Search } from 'lucide-react';

interface MoreDrawerSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoreDrawerSheet: React.FC<MoreDrawerSheetProps> = ({ isOpen, onClose }) => {
  const extraNav = [
    {
      to: '/search',
      label: 'Wyszukiwarka',
      desc: 'Przeszukiwanie bazy i notatek',
      icon: Search
    },
    {
      to: '/calendar',
      label: 'Kalendarz',
      desc: 'Wydarzenia, sprawdziany i terminy',
      icon: Calendar
    },
    {
      to: '/entities',
      label: 'Baza wiedzy',
      desc: 'Katalog kontaktów, miejsc i rzeczy',
      icon: Network
    },
    {
      to: '/widgets',
      label: 'Narzędzia',
      desc: 'Skróty, rynek i notatnik',
      icon: Cpu
    },
    {
      to: '/memory',
      label: 'Pamięć asystenta',
      desc: 'Zapisane fakty i preferencje',
      icon: BrainCircuit
    },
    {
      to: '/private',
      label: 'Dziennik osobisty',
      desc: 'Cele, nawyki i przemyślenia',
      icon: UserCheck
    },
    {
      to: '/workouts',
      label: 'Trening i ruch',
      desc: 'Ćwiczenia, serie i postępy',
      icon: Dumbbell
    },
    {
      to: '/traffic',
      label: 'Trasa i ruch',
      desc: 'Kamery drogowe i sytuacja na trasie',
      icon: Radio
    },
    {
      to: '/osint',
      label: 'Narzędzia sieciowe',
      desc: 'Weryfikacja domen, IP i certyfikatów',
      icon: Globe
    },
    {
      to: '/server',
      label: 'Stan serwera',
      desc: 'Zasoby, kontenery i kopie zapasowe',
      icon: Server
    },
    {
      to: '/settings',
      label: 'Ustawienia',
      desc: 'Preferencje konta i bezpieczeństwo',
      icon: Sliders
    }
  ];

  return (
    <BottomActionSheet isOpen={isOpen} onClose={onClose} title="Więcej narzędzi">
      <div className="space-y-1.5 py-1">
        {extraNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{item.label}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </NavLink>
        ))}

        <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1.5 font-medium text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            Połączenie zabezpieczone
          </span>
          <span className="font-mono text-[10px]">OmniDash</span>
        </div>
      </div>
    </BottomActionSheet>
  );
};
