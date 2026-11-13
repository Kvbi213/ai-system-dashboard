import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, MessageSquare, GraduationCap, Wallet, MoreHorizontal } from 'lucide-react';

interface BottomTabBarProps {
  onOpenMore: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ onOpenMore }) => {
  const navItems = [
    { to: '/', label: 'Pulpit', icon: LayoutGrid },
    { to: '/chat', label: 'Czat AI', icon: MessageSquare },
    { to: '/school', label: 'Szkoła', icon: GraduationCap },
    { to: '/finance', label: 'Finanse', icon: Wallet }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0e1424]/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-colors">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full min-h-[48px] py-1 transition-colors rounded-xl focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none ${
                isActive
                  ? 'text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-lg transition ${isActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : ''}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* More Button */}
        <button
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center w-full min-h-[48px] py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors rounded-xl focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
        >
          <div className="p-1.5 rounded-lg">
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight font-medium">Więcej</span>
        </button>
      </div>
    </nav>
  );
};
