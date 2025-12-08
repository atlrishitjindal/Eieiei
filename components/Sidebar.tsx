import React from 'react';
import { LayoutDashboard, Mic, FileText, TrendingUp, Briefcase, LogOut, Mail, User } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isOpen: boolean;
  user: { name: string; email: string };
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, user, onLogout }) => {
  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${
        currentView === view
          ? 'bg-blue-500/10 text-blue-400 border-r-2 border-blue-400'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-r-2 border-transparent'
      }`}
    >
      <Icon className={`w-5 h-5 ${currentView === view ? 'text-blue-400' : 'text-slate-500'}`} />
      {label}
    </button>
  );

  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-0 -ml-4 opacity-0'
      } bg-slate-900 border-r border-slate-800 flex-none transition-all duration-300 ease-in-out flex flex-col z-20 absolute md:relative h-full shadow-xl md:shadow-none overflow-hidden`}
    >
      <div className="p-6 flex items-center gap-3 mb-2">
        <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-900/20">
          <Briefcase className="w-5 h-5" />
        </div>
        <h1 className="font-bold text-lg text-white tracking-tight">CareerCraft</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4 px-4">Workspace</div>
        <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
        <NavItem view={AppView.RESUME} icon={FileText} label="Resume Optimizer" />
        <NavItem view={AppView.JOBS} icon={Briefcase} label="Job Matcher" />
        
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-4">Tools</div>
        <NavItem view={AppView.COVER_LETTER} icon={Mail} label="Cover Letter Gen" />
        <NavItem view={AppView.INTERVIEW} icon={Mic} label="Mock Interview" />
        <NavItem view={AppView.INSIGHTS} icon={TrendingUp} label="Market Insights" />
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate capitalize">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-2 text-slate-500 hover:text-red-400 px-2 py-1.5 rounded transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;