import React from 'react';
import { Mic, FileText, Briefcase, Mail, Clock, Star, Zap, Activity, ChevronRight, Plus } from 'lucide-react';
import { AppView, ResumeAnalysis, ActivityLog } from '../types';
import { motion } from 'framer-motion';
import { Card, Button, Badge } from './ui/DesignSystem';
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
      className="max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
            {getGreeting()}, <span className="text-brand-600 capitalize">{user.name}</span>
          </h1>
          <p className="text-slate-500 mt-2 text-base">Your career control center is ready.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setCurrentView(AppView.RESUME)} variant="secondary" className="shadow-sm">
            <FileText className="w-4 h-4 mr-2" /> Upload Resume
          </Button>
          <Button onClick={() => setCurrentView(AppView.INTERVIEW)} variant="primary" className="shadow-brand-500/20">
             <Mic className="w-4 h-4 mr-2" /> Start Practice
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Resume Score" 
          value={resumeAnalysis ? `${resumeAnalysis.score}` : "--"} 
          suffix="/100"
          icon={<Activity className="w-5 h-5 text-emerald-600" />}
          desc="Based on ATS standards"
          variant="success"
        />
        <StatCard 
          title="Jobs Matched" 
          value={jobsAnalyzed.toString()} 
          icon={<Briefcase className="w-5 h-5 text-brand-600" />}
          desc="Opportunities found"
          variant="info"
        />
        <StatCard 
          title="Interview Hours" 
          value={`${interviewSessions}`} 
          suffix="hrs"
          icon={<Mic className="w-5 h-5 text-purple-600" />}
          desc="Practice time total"
          variant="purple"
        />
        <StatCard 
          title="Verified Skills" 
          value={resumeAnalysis?.skills?.length.toString() || "0"} 
          icon={<Star className="w-5 h-5 text-amber-600" />}
          desc="Detected in profile"
          variant="warning"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          
          {/* Quick Actions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 font-display">Recommended Actions</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <ActionCard 
                 title="Mock Interview" 
                 desc="Practice behavioral & technical questions with AI." 
                 icon={<Mic className="w-5 h-5" />}
                 color="text-purple-600"
                 bg="bg-purple-50"
                 border="hover:border-purple-200"
                 onClick={() => setCurrentView(AppView.INTERVIEW)}
              />
              <ActionCard 
                 title="Smart Job Match" 
                 desc="Find roles that perfectly fit your skill set." 
                 icon={<Briefcase className="w-5 h-5" />}
                 color="text-brand-600"
                 bg="bg-brand-50"
                 border="hover:border-brand-200"
                 onClick={() => setCurrentView(AppView.JOBS)}
              />
              <ActionCard 
                 title="Resume Optimizer" 
                 desc="Get line-by-line feedback to pass ATS scans." 
                 icon={<FileText className="w-5 h-5" />}
                 color="text-emerald-600"
                 bg="bg-emerald-50"
                 border="hover:border-emerald-200"
                 onClick={() => setCurrentView(AppView.RESUME)}
              />
              <ActionCard 
                 title="Cover Letter Writer" 
                 desc="Generate tailored letters for any job description." 
                 icon={<Mail className="w-5 h-5" />}
                 color="text-pink-600"
                 bg="bg-pink-50"
                 border="hover:border-pink-200"
                 onClick={() => setCurrentView(AppView.COVER_LETTER)}
              />
            </div>
          </section>

          {/* Documents Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-bold text-slate-900 font-display">My Documents</h3>
               <Button variant="ghost" size="sm" className="text-brand-600">View All</Button>
            </div>
            <Card className="p-0 overflow-hidden">
               {resumeAnalysis ? (
                 <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                          <FileText className="w-5 h-5" />
                       </div>
                       <div>
                          <h4 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">Software_Engineer_Resume.pdf</h4>
                          <p className="text-xs text-slate-500">Last updated today</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <Badge variant={resumeAnalysis.score > 70 ? 'success' : 'warning'}>Score: {resumeAnalysis.score}</Badge>
                       <Button size="sm" variant="secondary">Edit</Button>
                    </div>
                 </div>
               ) : (
                 <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                       <FileText className="w-6 h-6 text-slate-300" />
                    </div>
                    <h4 className="text-slate-900 font-medium">No resumes uploaded</h4>
                    <p className="text-slate-500 text-sm mb-4">Upload your first resume to get started.</p>
                    <Button onClick={() => setCurrentView(AppView.RESUME)} size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Upload PDF</Button>
                 </div>
               )}
            </Card>
          </section>
        </motion.div>

        {/* Sidebar Activity Feed */}
        <motion.div variants={itemVariants} className="space-y-6">
          <section>
             <h3 className="text-lg font-bold text-slate-900 font-display mb-4">Recent Activity</h3>
             <Card className="p-0">
              {activities.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No activity yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activities.map((act) => (
                    <div key={act.id} className="p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "mt-0.5 w-2 h-2 rounded-full flex-none",
                          act.type === 'resume' ? 'bg-emerald-500' :
                          act.type === 'interview' ? 'bg-purple-500' :
                          act.type === 'job_match' ? 'bg-brand-500' : 'bg-pink-500'
                        )} />
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">{act.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{act.meta}</p>
                          <span className="text-[10px] text-slate-400 mt-2 block">
                            {new Date(act.timestamp).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 text-center">
                    <button className="text-xs font-medium text-slate-500 hover:text-brand-600 transition-colors">View Full History</button>
                  </div>
                </div>
              )}
             </Card>
          </section>

          <Card className="bg-brand-900 text-white border-none p-6 relative overflow-hidden">
             <div className="relative z-10">
               <h4 className="font-bold text-lg mb-2">Upgrade to Pro</h4>
               <p className="text-brand-100 text-sm mb-4">Unlock unlimited resume scans and mock interviews.</p>
               <Button size="sm" className="bg-white text-brand-900 hover:bg-brand-50 border-none w-full">View Plans</Button>
             </div>
             <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand-700/50 rounded-full blur-2xl" />
             <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-brand-500/50 rounded-full blur-xl" />
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ title, value, suffix, icon, desc, variant }: any) => {
  return (
    <motion.div variants={itemVariants}>
      <Card className="p-5 hover:shadow-md transition-all duration-300 border-l-4 border-l-transparent hover:border-l-brand-500">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
            {icon}
          </div>
          {variant === 'success' && <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</div>}
        </div>
        <div>
          <div className="flex items-baseline gap-1">
             <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
             {suffix && <span className="text-sm font-medium text-slate-500">{suffix}</span>}
          </div>
          <p className="text-slate-500 text-sm mt-1">{title}</p>
        </div>
      </Card>
    </motion.div>
  );
};

const ActionCard = ({ title, desc, icon, color, bg, border, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all text-left flex items-start gap-4 group relative",
      border
    )}
  >
    <div className={cn("p-3 rounded-lg transition-transform group-hover:scale-110 flex-none", bg, color)}>
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors text-sm">{title}</h3>
      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{desc}</p>
    </div>
    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
  </button>
);

export default Dashboard;