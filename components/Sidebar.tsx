
import React from 'react';
import { View } from '../types';
import { ICONS, COLORS } from '../constants';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { view: View.DASHBOARD, label: 'Dashboard', icon: ICONS.Dashboard },
    { view: View.CHAT, label: 'Chat', icon: ICONS.Chat },
    { view: View.JOBS, label: 'Job Search', icon: ICONS.Jobs },
    { view: View.BOOKINGS, label: 'Bookings', icon: ICONS.Bookings },
    { view: View.SECURITY, label: 'Security', icon: ICONS.Security },
  ];

  return (
    <div className="w-20 lg:w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col p-4 transition-all duration-300">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <span className="text-white font-bold text-xl">S</span>
        </div>
        <span className="hidden lg:block font-bold text-xl tracking-tight text-white">Sylvie AI</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 ${
              currentView === item.view
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <item.icon />
            <span className="hidden lg:block font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-slate-800">
        <button className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200">
          <ICONS.Settings />
          <span className="hidden lg:block font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
