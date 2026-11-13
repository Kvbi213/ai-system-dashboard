import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  GraduationCap,
  Calendar,
  Wallet,
  Car,
  Server,
  Settings
} from 'lucide-react';
import { useDesignSystem } from '../../context/DesignSystemContext';

const DOCK_ITEMS = [
  { to: '/', label: 'Pulpit', icon: LayoutDashboard },
  { to: '/chat', label: 'Asystent', icon: MessageSquare },
  { to: '/school', label: 'Plan lekcji', icon: Calendar },
  { to: '/grades', label: 'Librus', icon: GraduationCap },
  { to: '/finance', label: 'Finanse', icon: Wallet },
  { to: '/traffic', label: 'Trasa', icon: Car },
  { to: '/server', label: 'Mikrus', icon: Server },
  { to: '/settings', label: 'Opcje', icon: Settings }
];

export const SpatialDock: React.FC = () => {
  const { mode } = useDesignSystem();

  // Spatial dock is the signature hero feature for Liquid Studio mode
  if (mode !== 'liquid') return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 hidden md:block">
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-3xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.3)]"
        aria-label="Spatial Liquid Dock"
      >
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group relative p-2.5 rounded-2xl transition-all duration-200 flex flex-col items-center justify-center hover:scale-115 active:scale-95 ${
                  isActive
                    ? 'bg-white/90 dark:bg-white/20 text-sky-600 dark:text-sky-300 shadow-md shadow-sky-500/10'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5 h-5 transition-transform" />
                  {isActive && (
                    <motion.div
                      layoutId="dock-dot"
                      className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  {/* Floating tooltip */}
                  <span className="absolute -top-9 px-2 py-0.5 rounded-lg bg-slate-900/90 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </motion.nav>
    </div>
  );
};
