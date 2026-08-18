import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, FileSearch, BarChart2, Settings, MessageSquare } from 'lucide-react';
import { cn } from '../utils';

export function MobileLayout() {
  const location = useLocation();
  const hideBottomNav = location.pathname.includes('/incidents/');

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-slate-50 dark:bg-[#0c0d10] text-slate-600 dark:text-slate-300 overflow-hidden relative shadow-2xl sm:border-[12px] sm:border-slate-200 dark:sm:border-[#1e2128] sm:rounded-[60px] sm:h-[90vh] sm:my-auto sm:max-h-[850px]">
      
      {/* Main scrollable content area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[env(safe-area-inset-bottom)] scroll-smooth bg-slate-50 dark:bg-[#0c0d10] flex flex-col">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      {!hideBottomNav && (
        <nav className="flex-shrink-0 bg-slate-50 dark:bg-[#0c0d10] border-t border-slate-200 dark:border-slate-800 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2 relative">
          <div className="flex justify-around items-center h-16 px-2">
            <NavItem to="/" icon={<Home className="w-5 h-5" />} label="Home" />
            <NavItem to="/import" icon={<FileSearch className="w-5 h-5" />} label="Import" />
            <NavItem to="/results" icon={<BarChart2 className="w-5 h-5" />} label="Results" />
            <NavItem to="/chat" icon={<MessageSquare className="w-5 h-5" />} label="Assistant" />
            <NavItem to="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
          </div>
          <div className='absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full hidden sm:block'></div>
        </nav>
      )}
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center space-y-1 transition-all",
          isActive ? "text-[#38bdf8]" : "text-slate-500 opacity-40 hover:opacity-100"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className={cn(
            "rounded-md flex items-center justify-center",
            isActive ? "w-6 h-6 bg-[#38bdf8] text-white dark:text-[#0c0d10] shadow-[0_0_10px_rgba(56,189,248,0.4)]" : "mb-1"
          )}>
            {icon}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
        </>
      )}
    </NavLink>
  );
}
