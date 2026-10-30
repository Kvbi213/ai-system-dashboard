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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-dock pb-[max(0.6rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full min-h-[48px] py-1 transition-all duration-200 rounded-2xl ${
                isActive
                  ? 'text-sky-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition ${isActive ? 'bg-sky-500/15 text-sky-600 shadow-sm' : ''}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight font-semibold">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* More Button */}
        <button
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center w-full min-h-[48px] py-1 text-slate-500 hover:text-slate-800 transition-all rounded-2xl"
        >
          <div className="p-1.5 rounded-xl">
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight font-semibold">Więcej</span>
        </button>
      </div>
    </nav>
  );
};
