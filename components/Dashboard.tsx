import React from 'react';
import { Mic, FileText, TrendingUp, Briefcase, Mail, ArrowUpRight, Clock, Award, Star, BarChart3 } from 'lucide-react';
import { AppView, ResumeAnalysis, ActivityLog } from '../types';

interface DashboardProps {
  user: { name: string; email: string };
  setCurrentView: (view: AppView) => void;
  resumeAnalysis: ResumeAnalysis | null;
  activities: ActivityLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, setCurrentView, resumeAnalysis, activities }) => {
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Derived Stats
  const jobsAnalyzed = activities.filter(a => a.type === 'job_match').length;
  const interviewSessions = activities.filter(a => a.type === 'interview').length;
  const lettersGenerated = activities.filter(a => a.type === 'cover_letter').length;
  
  // Simple calculation for "time spent" based on interaction count (mock estimation)
  const estPrepHours = (interviewSessions * 0.5).toFixed(1); 

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">{getGreeting()}, <span className="capitalize text-blue-400">{user.name}</span></h2>
          <p className="text-slate-400 mt-1">Your career command center is ready.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setCurrentView(AppView.RESUME)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" /> Upload Resume
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Resume Score" 
          value={resumeAnalysis ? `${resumeAnalysis.score}/100` : "--"} 
          subtext="ATS Compatibility"
          icon={<Award className="w-5 h-5 text-purple-400" />}
          trend={resumeAnalysis ? "Analysis active" : "No resume"}
          trendColor={resumeAnalysis ? "text-green-400" : "text-slate-500"}
        />
        <StatCard 
          title="Jobs Analyzed" 
          value={jobsAnalyzed.toString()} 
          subtext="Matches checked"
          icon={<Briefcase className="w-5 h-5 text-blue-400" />}
          trend={jobsAnalyzed > 0 ? "Active" : "Start matching"}
          trendColor={jobsAnalyzed > 0 ? "text-blue-400" : "text-slate-500"}
        />
        <StatCard 
          title="Interview Prep" 
          value={`${estPrepHours} hrs`} 
          subtext="Practice time"
          icon={<Mic className="w-5 h-5 text-emerald-400" />}
          trend={interviewSessions > 0 ? `${interviewSessions} sessions` : "No sessions"}
          trendColor={interviewSessions > 0 ? "text-emerald-400" : "text-slate-500"}
        />
        <StatCard 
          title="Skills Verified" 
          value={resumeAnalysis?.skills?.length.toString() || "0"} 
          subtext="Detected in profile"
          icon={<Star className="w-5 h-5 text-amber-400" />}
          trend={resumeAnalysis ? "Skills extracted" : "Pending upload"}
          trendColor={resumeAnalysis ? "text-amber-400" : "text-slate-500"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-blue-500" /> Quick Actions
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <ActionCard 
               title="Mock Interview" 
               desc="Practice behavioral questions with AI." 
               icon={<Mic className="w-6 h-6 text-white" />}
               color="bg-blue-600"
               onClick={() => setCurrentView(AppView.INTERVIEW)}
            />
            <ActionCard 
               title="Job Matcher" 
               desc="Find roles that fit your skills perfectly." 
               icon={<Briefcase className="w-6 h-6 text-white" />}
               color="bg-indigo-600"
               onClick={() => setCurrentView(AppView.JOBS)}
            />
            <ActionCard 
               title="Resume Optimizer" 
               desc="Fix ATS errors and keyword gaps." 
               icon={<FileText className="w-6 h-6 text-white" />}
               color="bg-purple-600"
               onClick={() => setCurrentView(AppView.RESUME)}
            />
            <ActionCard 
               title="Cover Letter Gen" 
               desc="Write persuasive letters in seconds." 
               icon={<Mail className="w-6 h-6 text-white" />}
               color="bg-pink-600"
               onClick={() => setCurrentView(AppView.COVER_LETTER)}
            />
          </div>

          {/* Activity Graph Placeholder - Now Dynamic Empty State */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-white">Weekly Activity</h3>
             </div>
             {activities.length > 0 ? (
               <div className="h-48 flex items-end justify-between gap-2 px-2">
                  {/* Visualizing simple activity counts just to show movement */}
                  {[...Array(12)].map((_, i) => {
                    // Random-ish height based on index if activities exist, just for visual flair if data present
                    const hasActivity = i < activities.length;
                    const h = hasActivity ? 20 + (Math.random() * 60) : 5;
                    return (
                      <div key={i} className="w-full bg-blue-500/10 hover:bg-blue-500/30 rounded-t transition-colors relative group" style={{ height: `${h}%` }}>
                      </div>
                    )
                  })}
               </div>
             ) : (
               <div className="h-48 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/50">
                 <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                 <p className="text-sm">Activity analytics will appear here as you use the app.</p>
               </div>
             )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> Recent Activity
          </h3>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 h-full min-h-[400px]">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                <Clock className="w-12 h-12 opacity-20" />
                <p className="text-center px-4">Your timeline is empty. <br/>Upload a resume or start an interview to see history.</p>
              </div>
            ) : (
              <div className="relative border-l border-slate-800 ml-3 space-y-8">
                {activities.map((act) => (
                  <div key={act.id} className="relative pl-8">
                    <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${
                      act.type === 'resume' ? 'bg-purple-500' :
                      act.type === 'interview' ? 'bg-blue-500' :
                      act.type === 'job_match' ? 'bg-indigo-500' : 'bg-pink-500'
                    }`} />
                    <p className="text-slate-400 text-xs mb-1">
                      {new Date(act.timestamp).toLocaleDateString()} • {new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <h4 className="text-slate-200 font-medium text-sm">{act.title}</h4>
                    <p className="text-slate-500 text-xs mt-1">{act.meta}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtext, icon, trend, trendColor }: any) => (
  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-colors">
    <div className="flex items-start justify-between mb-4">
      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">{icon}</div>
      <span className={`text-xs font-medium ${trendColor} bg-slate-950 border border-slate-800 px-2 py-1 rounded-full`}>{trend}</span>
    </div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-slate-500 text-sm">{title}</div>
    <div className="text-slate-600 text-xs mt-2">{subtext}</div>
  </div>
);

const ActionCard = ({ title, desc, icon, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-blue-500/30 hover:bg-slate-800 transition-all text-left flex items-start gap-4 group"
  >
    <div className={`${color} p-3 rounded-lg shadow-lg group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{title}</h3>
      <p className="text-slate-400 text-xs mt-1 leading-relaxed">{desc}</p>
    </div>
  </button>
);

export default Dashboard;