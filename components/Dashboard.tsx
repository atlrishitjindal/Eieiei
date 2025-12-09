import React from 'react';
import { Mic, FileText, Briefcase, Mail, ArrowUpRight, Clock, Star, Zap, Activity } from 'lucide-react';
import { AppView, ResumeAnalysis, ActivityLog } from '../types';
import { motion } from 'framer-motion';
import { Card, Button } from './ui/DesignSystem';
import { containerVariants, itemVariants, cn } from '../lib/utils';

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

  const jobsAnalyzed = activities.filter(a => a.type === 'job_match').length;
  const interviewSessions = activities.filter(a => a.type === 'interview').length;
  
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/50 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 capitalize">{user.name}</span>
          </h2>
          <p className="text-zinc-400 mt-2 text-sm font-medium">Here's your career performance overview.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setCurrentView(AppView.RESUME)} variant="primary">
            <FileText className="w-4 h-4 mr-2" /> Resume
          </Button>
          <Button onClick={() => setCurrentView(AppView.INTERVIEW)} variant="secondary">
             <Mic className="w-4 h-4 mr-2" /> Interview
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Resume Health" 
          value={resumeAnalysis ? `${resumeAnalysis.score}/100` : "--"} 
          icon={<Activity className="w-5 h-5 text-emerald-400" />}
          trend="ATS Score"
          variant="success"
        />
        <StatCard 
          title="Jobs Matched" 
          value={jobsAnalyzed.toString()} 
          icon={<Briefcase className="w-5 h-5 text-blue-400" />}
          trend="Opportunities"
          variant="info"
        />
        <StatCard 
          title="Interview Prep" 
          value={`${interviewSessions}h`} 
          icon={<Mic className="w-5 h-5 text-purple-400" />}
          trend="Session Time"
          variant="purple"
        />
        <StatCard 
          title="Skills Verified" 
          value={resumeAnalysis?.skills?.length.toString() || "0"} 
          icon={<Star className="w-5 h-5 text-amber-400" />}
          trend="Detected"
          variant="warning"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-zinc-400" /> Quick Actions
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <ActionCard 
               title="Mock Interview" 
               desc="Practice behavioral & technical Q&A." 
               icon={<Mic className="w-5 h-5" />}
               color="text-purple-400"
               bg="bg-purple-500/10"
               onClick={() => setCurrentView(AppView.INTERVIEW)}
            />
            <ActionCard 
               title="Job Matcher" 
               desc="Find best-fit roles for your skills." 
               icon={<Briefcase className="w-5 h-5" />}
               color="text-blue-400"
               bg="bg-blue-500/10"
               onClick={() => setCurrentView(AppView.JOBS)}
            />
            <ActionCard 
               title="Resume Optimizer" 
               desc="Analyze and improve ATS score." 
               icon={<FileText className="w-5 h-5" />}
               color="text-emerald-400"
               bg="bg-emerald-500/10"
               onClick={() => setCurrentView(AppView.RESUME)}
            />
            <ActionCard 
               title="Cover Letter" 
               desc="Generate tailored letters instantly." 
               icon={<Mail className="w-5 h-5" />}
               color="text-pink-400"
               bg="bg-pink-500/10"
               onClick={() => setCurrentView(AppView.COVER_LETTER)}
            />
          </div>

          {/* Activity Visualization */}
          <Card className="h-64 flex flex-col justify-between border-zinc-800/50">
             <div className="flex items-center justify-between">
               <h3 className="font-semibold text-zinc-200 text-sm">Activity Volume</h3>
               <select className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 rounded px-2 py-1 outline-none">
                 <option>This Week</option>
                 <option>Last Month</option>
               </select>
             </div>
             
             <div className="flex-1 flex items-end justify-between gap-2 mt-4 px-2">
                {activities.length > 0 ? (
                  [...Array(14)].map((_, i) => {
                    const h = 20 + Math.random() * 70;
                    return (
                      <motion.div 
                        key={i} 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.05 }}
                        className="flex-1 bg-zinc-800 hover:bg-blue-600/50 rounded-sm transition-colors relative group"
                      >
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-900 text-[10px] py-1 px-2 rounded border border-zinc-700 whitespace-nowrap z-10">
                           {Math.round(h)} interactions
                         </div>
                      </motion.div>
                    )
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm italic">
                    No data to display yet
                  </div>
                )}
             </div>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" /> Recent
          </h3>
          <Card className="h-full min-h-[400px] border-zinc-800/50 overflow-hidden flex flex-col">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 text-sm space-y-3">
                <Clock className="w-8 h-8 opacity-20" />
                <p>No recent activity.</p>
              </div>
            ) : (
              <div className="relative space-y-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-zinc-800" />
                {activities.map((act, i) => (
                  <motion.div 
                    key={act.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative pl-8"
                  >
                    <div className={cn(
                      "absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full border-4 border-zinc-950 flex items-center justify-center",
                      act.type === 'resume' ? 'bg-emerald-500' :
                      act.type === 'interview' ? 'bg-purple-500' :
                      act.type === 'job_match' ? 'bg-blue-500' : 'bg-pink-500'
                    )}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-zinc-500 mb-0.5">
                        {new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <h4 className="text-zinc-200 font-medium text-sm hover:text-blue-400 cursor-pointer transition-colors">{act.title}</h4>
                      <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{act.meta}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ title, value, icon, trend, variant }: any) => {
  const colors: any = {
    success: "text-emerald-400",
    info: "text-blue-400",
    purple: "text-purple-400",
    warning: "text-amber-400"
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="border-zinc-800/50 hover:border-zinc-700 transition-colors group">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
            {icon}
          </div>
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800", colors[variant])}>
            {trend}
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold text-zinc-100 tracking-tight">{value}</div>
          <div className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{title}</div>
        </div>
      </Card>
    </motion.div>
  );
};

const ActionCard = ({ title, desc, icon, color, bg, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-left flex items-start gap-4 group relative overflow-hidden"
  >
    <div className={cn("p-2.5 rounded-lg transition-transform group-hover:scale-110", bg, color)}>
      {icon}
    </div>
    <div className="z-10">
      <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors text-sm">{title}</h3>
      <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{desc}</p>
    </div>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none" />
  </button>
);

export default Dashboard;