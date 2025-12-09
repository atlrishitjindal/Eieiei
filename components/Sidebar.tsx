import React from 'react';
import { LayoutDashboard, Mic, FileText, TrendingUp, Briefcase, LogOut, Mail, Command } from 'lucide-react';
import { AppView } from '../types';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isOpen: boolean;
  user: { name: string; email: string };
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, user, onLogout }) => {
  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => setCurrentView(view)}
        className={cn(
          "group w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium relative",
          isActive
            ? "text-white bg-zinc-800/50 shadow-sm"
            : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/30"
        )}
      >
        <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300")} />
        {label}
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 w-1 h-4 bg-blue-500 rounded-r-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </button>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 256 : 0, opacity: isOpen ? 1 : 0 }}
      className="h-full bg-zinc-950 border-r border-zinc-800/50 flex flex-col z-30 absolute md:relative overflow-hidden"
    >
      <div className="p-6 pb-2">
        <div className="flex items-center gap-2 mb-6 text-zinc-100">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Command className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">CareerCraft</span>
        </div>

        <nav className="space-y-6">
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-3">Main</div>
            <div className="space-y-0.5">
              <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
              <NavItem view={AppView.RESUME} icon={FileText} label="Resume" />
              <NavItem view={AppView.JOBS} icon={Briefcase} label="Jobs" />
            </div>
          </div>
          
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-3">Tools</div>
            <div className="space-y-0.5">
              <NavItem view={AppView.COVER_LETTER} icon={Mail} label="Cover Letter" />
              <NavItem view={AppView.INTERVIEW} icon={Mic} label="Interview" />
              <NavItem view={AppView.INSIGHTS} icon={TrendingUp} label="Insights" />
            </div>
          </div>
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-zinc-800/50 bg-zinc-900/20">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 font-medium text-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate capitalize">{user.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/5 px-3 py-2 rounded-md transition-colors text-xs font-medium border border-transparent hover:border-red-500/10"
        >
          <LogOut className="w-3 h-3" />
          Sign Out
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;