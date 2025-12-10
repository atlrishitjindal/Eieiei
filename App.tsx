import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import LiveInterview from './components/LiveInterview';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import MarketInsights from './components/MarketInsights';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Jobs from './components/Jobs';
import Applicants from './components/Applicants';
import CoverLetter from './components/CoverLetter';
import SkillSuggestions from './components/SkillSuggestions';
import MyApplications from './components/MyApplications';
import CalendarView from './components/CalendarView';
import Settings from './components/Settings';
import { AppView, ResumeAnalysis, ActivityLog, UserRole, Job, Application } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabaseClient';

function App() {
  const [user, setUser] = useState<{name: string, email: string, role: UserRole} | null>(null);
  const [viewState, setViewState] = useState<'landing' | 'auth_login' | 'auth_signup' | 'app'>('landing');
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Global State for Shared Data
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  
  // Shared Job/Recruitment State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  // Initialize Auth Listener
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
            name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: (session.user.user_metadata.role as UserRole) || 'candidate'
        });
        setViewState('app');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
            name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: (session.user.user_metadata.role as UserRole) || 'candidate'
        });
        setViewState('app');
        
        // Handle password recovery specific flow
        if (_event === 'PASSWORD_RECOVERY') {
            setCurrentView(AppView.SETTINGS);
        }
      } else if (_event === 'SIGNED_OUT') {
        setUser(null);
        setViewState('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handlers
  const handleLogin = (u: {name: string, email: string, role: UserRole}) => {
    setUser(u);
    setViewState('app');
    // Set default view based on role
    if (u.role === 'employer') {
        setCurrentView(AppView.EMPLOYER_DASHBOARD);
    } else {
        setCurrentView(AppView.DASHBOARD);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setViewState('landing');
    setCurrentView(AppView.DASHBOARD);
    setResumeAnalysis(null);
    setActivities([]);
  };

  const handleUpdateProfile = (name: string) => {
    if (user) {
      setUser({ ...user, name });
    }
  };

  const addActivity = (title: string, meta: string) => {
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      type: title.toLowerCase().includes('resume') ? 'resume' : 
            title.toLowerCase().includes('interview') ? 'interview' : 
            title.toLowerCase().includes('job') ? 'job_match' : 
            title.toLowerCase().includes('skill') ? 'skills' : 'cover_letter',
      title,
      meta,
      timestamp: new Date()
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 20));
  };

  const handleApplyToJob = (job: Job) => {
    if (!user) return;

    // Create a new application
    const newApplication: Application = {
      id: Date.now().toString(),
      jobId: job.id,
      jobTitle: job.title,
      candidateName: user.name,
      candidateEmail: user.email,
      matchScore: resumeAnalysis ? resumeAnalysis.score : Math.floor(Math.random() * (98 - 70 + 1) + 70), // Mock score if not analyzed
      status: 'New',
      timestamp: new Date(),
      resumeFile: resumeAnalysis?.file
    };

    setApplications(prev => [newApplication, ...prev]);
    addActivity("Job Application", `Applied to ${job.company}`);
  };

  const handlePostJob = (job: Job) => {
    setJobs(prev => [job, ...prev]);
    addActivity("Job Posted", job.title);
  };

  const handleUpdateApplicationStatus = (id: string, newStatus: Application['status'], interviewDate?: Date) => {
    setApplications(prev => prev.map(app => {
      if (app.id === id) {
          const updates: Partial<Application> = { status: newStatus };
          
          if (newStatus === 'Interview' && interviewDate) {
             updates.interviewDate = interviewDate;
             // Auto-generate Google Meet link if not present
             if (!app.meetingLink) {
                // Generate Google Meet style link (abc-defg-hij)
                const chars = 'abcdefghijklmnopqrstuvwxyz';
                const segment = (len: number) => Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                updates.meetingLink = `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`;
             }
          }
          return { ...app, ...updates };
      }
      return app;
    }));

    const app = applications.find(a => a.id === id);
    if (app) {
        let meta = `Marked ${app.candidateName} as ${newStatus}`;
        if (newStatus === 'Interview' && interviewDate) {
            meta += ` on ${interviewDate.toLocaleDateString()}`;
        }
        addActivity("Application Update", meta);
    }
  };

  // Render Views
  if (viewState === 'landing') {
    return (
      <LandingPage 
        onGetStarted={() => setViewState('auth_signup')} 
        onLogin={() => setViewState('auth_login')}
      />
    );
  }

  if (viewState === 'auth_login' || viewState === 'auth_signup') {
    return (
      <Auth 
        initialMode={viewState === 'auth_login' ? 'login' : 'signup'}
        onComplete={handleLogin} 
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpen={isSidebarOpen}
        user={user!}
        onLogout={handleLogout}
        applications={applications}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
               {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
             </button>
             <span className="font-bold text-slate-900 tracking-tight">CarrerX</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {/* SHARED OR CANDIDATE VIEWS */}
              {(currentView === AppView.DASHBOARD || currentView === AppView.EMPLOYER_DASHBOARD) && (
                 <Dashboard 
                   user={user!} 
                   setCurrentView={setCurrentView} 
                   resumeAnalysis={resumeAnalysis}
                   activities={activities}
                   applications={applications}
                   jobs={jobs}
                 />
              )}

              {currentView === AppView.MY_APPLICATIONS && (
                <MyApplications 
                  applications={applications}
                  jobs={jobs}
                  userEmail={user?.email || ''}
                />
              )}

              {currentView === AppView.INTERVIEW && (
                <LiveInterview 
                  resumeAnalysis={resumeAnalysis} 
                />
              )}
              
              {currentView === AppView.RESUME && (
                <ResumeAnalyzer 
                  analysisResult={resumeAnalysis}
                  onAnalysisComplete={(result) => {
                    setResumeAnalysis(result);
                    addActivity("Resume Analysis", `Scored ${result.score}/100`);
                  }}
                  onActivity={addActivity}
                />
              )}
              
              {currentView === AppView.INSIGHTS && <MarketInsights />}
              
              {currentView === AppView.JOBS && (
                <Jobs 
                  resumeAnalysis={resumeAnalysis} 
                  onActivity={addActivity}
                  jobs={jobs}
                  setJobs={setJobs}
                  onApply={handleApplyToJob}
                  appliedJobIds={new Set(applications.filter(a => a.candidateEmail === user?.email).map(a => a.jobId))}
                  userRole={user?.role}
                  applications={applications}
                  onPostJob={handlePostJob}
                />
              )}

              {currentView === AppView.APPLICANTS && (
                <Applicants 
                  applications={applications}
                  jobs={jobs}
                  onUpdateStatus={handleUpdateApplicationStatus}
                />
              )}

              {currentView === AppView.SHORTLISTED && (
                <Applicants 
                  applications={applications}
                  jobs={jobs}
                  onUpdateStatus={handleUpdateApplicationStatus}
                  showShortlistedOnly={true}
                />
              )}
              
              {currentView === AppView.COVER_LETTER && (
                <CoverLetter 
                  resumeAnalysis={resumeAnalysis} 
                  onActivity={addActivity}
                />
              )}

              {currentView === AppView.SKILLS && (
                <SkillSuggestions 
                  resumeAnalysis={resumeAnalysis} 
                  onActivity={addActivity}
                />
              )}

              {currentView === AppView.CALENDAR && (
                <CalendarView 
                  applications={applications}
                  user={user!}
                />
              )}

              {currentView === AppView.SETTINGS && (
                <Settings 
                  user={user!} 
                  onUpdateProfile={handleUpdateProfile} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;