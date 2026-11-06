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
      label: 'Wyszukiwarka Omnibox',
      desc: 'Szybkie przeszukiwanie całej bazy i notatek',
      icon: Search,
      color: 'text-sky-600 bg-sky-50 border-sky-200'
    },
    {
      to: '/calendar',
      label: 'Terminarz & Kalendarz',
      desc: 'Sprawdziany, kartkówki, wydarzenia osobiste',
      icon: Calendar,
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    },
    {
      to: '/entities',
      label: 'Baza Wiedzy & Encje',
      desc: 'Graf relacji i rejestr majątku Matrix 120m²',
      icon: Network,
      color: 'text-teal-600 bg-teal-50 border-teal-200'
    },
    {
      to: '/widgets',
      label: 'Widżety & Narzędzia',
      desc: 'Hardware, rynek krypto, scratchpad notatek',
      icon: Cpu,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      to: '/memory',
      label: 'Pamięć Kognitywna AI',
      desc: 'Dyrektywy systemowe i baza wiedzy',
      icon: BrainCircuit,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      to: '/private',
      label: 'Strefa Prywatna',
      desc: 'Rutyny, cele osobiste i dziennik refleksji',
      icon: UserCheck,
      color: 'text-pink-600 bg-pink-50 border-pink-200'
    },
    {
      to: '/workouts',
      label: 'Trening FBW & Nawyki',
      desc: 'Drążek, dipy, streaki dnia i rekordy',
      icon: Dumbbell,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    {
      to: '/traffic',
      label: 'Radary CANARD & Ruch',
      desc: 'Kamery drogowe, utrudnienia GDDKiA',
      icon: Radio,
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    },
    {
      to: '/osint',
      label: 'OSINT & Telemetria Sieci',
      desc: 'Wyszukiwanie domen, IP i certyfikaty SSL',
      icon: Globe,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200'
    },
    {
      to: '/server',
      label: 'Infrastruktura & Docker',
      desc: 'Kontenery Mikr.us LXC, kopia danych',
      icon: Server,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
      to: '/settings',
      label: 'Ustawienia i Bezpieczeństwo',
      desc: 'Klucze API, sesja, logi Zero-Trust',
      icon: Sliders,
      color: 'text-sky-600 bg-sky-50 border-sky-200'
    }
  ];

  return (
    <BottomActionSheet isOpen={isOpen} onClose={onClose} title="Więcej narzędzi">
      <div className="space-y-2.5 py-1">
        {extraNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/80 border border-slate-200/80 active:bg-slate-100 hover:border-slate-300 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className={`p-2.5 rounded-xl border ${item.color} shadow-sm`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </NavLink>
        ))}

        <div className="pt-3 mt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 px-1 font-mono">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            Zero-Trust Protected
          </span>
          <span className="font-bold">v1.0.0</span>
        </div>
      </div>
    </BottomActionSheet>
  );
};
