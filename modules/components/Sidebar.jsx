import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Search, Settings, ChevronLeft, ChevronRight, LayoutGrid, CalendarDays, BrainCircuit, Crosshair, Wallet, Dumbbell } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('system_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('system_sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-6 h-6" /> },
    { name: 'AI Terminal', path: '/chat', icon: <MessageSquare className="w-6 h-6" /> },
    { name: 'Memory', path: '/memory', icon: <BrainCircuit className="w-6 h-6" /> },
    { name: 'Web Search', path: '/search', icon: <Search className="w-6 h-6" /> },
    { name: 'OSINT', path: '/osint', icon: <Crosshair className="w-6 h-6" /> },
    { name: 'Calendar', path: '/calendar', icon: <CalendarDays className="w-6 h-6" /> },
    { name: 'Finances', path: '/finances', icon: <Wallet className="w-6 h-6" /> },
    { name: 'Workouts', path: '/workouts', icon: <Dumbbell className="w-6 h-6" /> },
    { name: 'Widgets', path: '/widgets', icon: <LayoutGrid className="w-6 h-6" /> },
  ];

  return (
    <nav id="tour-sidebar" className={`w-full ${isCollapsed ? 'md:w-20' : 'md:w-64'} h-16 md:h-full glass-panel border-t md:border-t-0 md:border-r border-border flex flex-row md:flex-col items-center md:items-start md:py-8 flex-shrink-0 z-50 transition-all duration-300 relative group`}>
      
      {/* Przycisk zwijania/rozwijania */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute -right-3.5 top-9 w-7 h-7 bg-surface border border-border rounded-full items-center justify-center text-textMuted hover:text-accentPrimary hover:border-accentPrimary transition-colors z-50"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`hidden md:flex w-full justify-center ${isCollapsed ? 'md:px-2' : 'md:justify-start md:px-8'} mb-12 transition-all`}>
        <div className="w-12 h-12 rounded-xl bg-accentPrimary/20 flex items-center justify-center border border-accentPrimary shadow-[0_0_15px_rgba(var(--color-accent-primary),0.2)] shrink-0">
          <span className="font-mono font-bold text-accentPrimary text-xl tracking-tighter">AG</span>
        </div>
      </div>
      
      <div className={`w-full flex flex-row md:flex-col justify-around md:justify-start ${isCollapsed ? 'md:items-center md:px-2' : 'md:items-stretch md:px-6'} gap-0 md:gap-4 px-2 flex-1 items-center transition-all`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-accentPrimary/10 border border-accentPrimary/50 text-accentPrimary shadow-[0_0_10px_rgba(var(--color-accent-primary),0.1)]' 
                  : 'text-textMuted hover:text-textPrimary hover:bg-surface border border-transparent'
              } ${isCollapsed ? 'justify-center w-12 h-12' : 'w-full'}`}
            >
              <div className={`${isActive ? 'text-accentPrimary' : 'group-hover:text-accentPrimary'} transition-colors shrink-0`}>
                {item.icon}
              </div>
              {!isCollapsed && (
                <span className="hidden md:block font-mono text-sm tracking-wider uppercase font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className={`w-auto md:w-full px-2 ${isCollapsed ? 'md:px-2 flex justify-center' : 'md:px-6'} mt-0 md:mt-auto flex items-center transition-all`} style={{ animationDelay: '200ms' }}>
        <Link 
          to="/settings"
          title={isCollapsed ? 'Settings' : undefined}
          className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 group ${
            location.pathname === '/settings'
              ? 'bg-accentPrimary/10 border border-accentPrimary/50 text-accentPrimary shadow-[0_0_10px_rgba(var(--color-accent-primary),0.1)]' 
              : 'text-textMuted hover:text-textPrimary hover:bg-surface border border-transparent'
          } ${isCollapsed ? 'justify-center w-12 h-12' : 'w-full justify-center md:justify-start'}`}
        >
          <Settings className={`w-6 h-6 shrink-0 transition-colors ${location.pathname === '/settings' ? 'text-accentPrimary' : 'group-hover:text-accentPrimary'}`} />
          {!isCollapsed && (
            <span className="hidden md:block font-mono text-sm tracking-wider uppercase font-medium whitespace-nowrap overflow-hidden text-ellipsis">Settings</span>
          )}
        </Link>
      </div>
    </nav>
  );
};

export default Sidebar;
