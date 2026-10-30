import React from 'react';
import { NavLink } from 'react-router-dom';
import { BottomActionSheet } from '../ui/BottomActionSheet';
import { Wallet, Dumbbell, Radio, Sliders, ShieldCheck, ChevronRight } from 'lucide-react';

interface MoreDrawerSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoreDrawerSheet: React.FC<MoreDrawerSheetProps> = ({ isOpen, onClose }) => {
  const extraNav = [
    {
      to: '/finance',
      label: 'Finanse 50/30/20',
      desc: 'Koperty budżetowe, wydatki i saldo',
      icon: Wallet,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      to: '/workouts',
      label: 'Trening FBW (Poddasze)',
      desc: 'Drążek, dipy, progresja i serie',
      icon: Dumbbell,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      to: '/traffic',
      label: 'Radary CANARD & Ruch',
      desc: 'Kamery drogowe, utrudnienia GDDKiA',
      icon: Radio,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    },
    {
      to: '/settings',
      label: 'Ustawienia i Bezpieczeństwo',
      desc: 'Klucze API, sesja, logi Zero-Trust',
      icon: Sliders,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
    }
  ];

  return (
    <BottomActionSheet isOpen={isOpen} onClose={onClose} title="Więcej narzędzi">
      <div className="space-y-2 py-2">
        {extraNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 active:bg-slate-800/80 transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className={`p-2.5 rounded-xl border ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </NavLink>
        ))}

        <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500 px-1 font-mono">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            Zero-Trust Protected
          </span>
          <span>v4.0.0-reborn</span>
        </div>
      </div>
    </BottomActionSheet>
  );
};
