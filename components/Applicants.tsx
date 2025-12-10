import React, { useState, useEffect } from 'react';
import { Users, Mail, CheckCircle, XCircle, Clock, Search, Filter, MoreHorizontal, FileText, Eye, Download, Calendar, X, ThumbsUp, ThumbsDown, Bookmark, ArrowRight, ExternalLink } from 'lucide-react';
import { Application, Job } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Badge, Input } from './ui/DesignSystem';
import { containerVariants, itemVariants, cn } from '../lib/utils';

interface ApplicantsProps {
  applications: Application[];
  jobs: Job[];
  onUpdateStatus?: (id: string, status: Application['status'], interviewDate?: Date) => void;
  showShortlistedOnly?: boolean;
}

const Applicants: React.FC<ApplicantsProps> = ({ applications, jobs, onUpdateStatus, showShortlistedOnly = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  
  // Scheduling State
  const [showScheduleInput, setShowScheduleInput] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Keep selectedApp in sync with applications prop (so when link is generated, it shows up)
  useEffect(() => {
    if (selectedApp) {
      const updated = applications.find(a => a.id === selectedApp.id);
      if (updated) setSelectedApp(updated);
    }
  }, [applications]);

  const filteredApplications = applications.filter(app => {
    // If showShortlistedOnly is true, ignore the dropdown filter (or force it) and only show shortlisted
    if (showShortlistedOnly && app.status !== 'Shortlisted') return false;

    const matchesSearch = app.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Normal filtering if not in forced shortlisted mode
    const matchesStatus = showShortlistedOnly ? true : (statusFilter === 'All' || app.status === statusFilter);
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: string, status: Application['status']) => {
    if (status === 'Interview') {
       // Don't update immediately if it's interview, show scheduler first
       setShowScheduleInput(true);
       return;
    }

    if (onUpdateStatus) {
      onUpdateStatus(id, status);
    }
    // Optimistic update (will be overwritten by useEffect above when prop changes)
    if (selectedApp && selectedApp.id === id) {
      setSelectedApp({ ...selectedApp, status });
    }
  };

  const handleConfirmSchedule = () => {
     if (selectedApp && scheduleDate && scheduleTime && onUpdateStatus) {
        const dateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        onUpdateStatus(selectedApp.id, 'Interview', dateTime);
        // Note: The meeting link is generated in App.tsx and will propagate back via props/useEffect
        setShowScheduleInput(false);
        setScheduleDate('');
        setScheduleTime('');
     }
  };

  const openModal = (app: Application) => {
     setSelectedApp(app);
     setShowScheduleInput(false); // Reset schedule state on new open
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      
      {/* Resume Review Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden"
            >
              {/* Left: Resume Preview (Mock) */}
              <div className="flex-1 bg-slate-100 border-r border-slate-200 p-8 overflow-y-auto hidden md:block">
                 <div className="bg-white shadow-lg min-h-[800px] w-full max-w-[800px] mx-auto p-12 space-y-8 text-slate-800">
                    <div className="border-b border-slate-200 pb-8 flex justify-between items-start">
                       <div>
                          <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-900">{selectedApp.candidateName}</h1>
                          <p className="text-slate-500 mt-2 font-medium">Senior Software Engineer</p>
                       </div>
                       <div className="text-right text-sm text-slate-500 space-y-1">
                          <p>{selectedApp.candidateEmail}</p>
                          <p>+1 (555) 123-4567</p>
                          <p>San Francisco, CA</p>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Summary</h3>
                       <p className="text-sm leading-relaxed text-slate-600">
                         Results-oriented professional with 5+ years of experience in full-stack development. 
                         Proven track record of delivering high-quality software solutions and driving team success. 
                         Passionate about leveraging technology to solve complex business problems.
                       </p>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Experience</h3>
                       <div className="space-y-4">
                          <div>
                             <div className="flex justify-between items-baseline">
                                <h4 className="font-bold text-slate-900">Tech Solutions Inc.</h4>
                                <span className="text-xs text-slate-400">2021 - Present</span>
                             </div>
                             <p className="text-xs font-semibold text-slate-600 mb-2">Senior Developer</p>
                             <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                <li>Led a team of 5 developers to rebuild the core payment infrastructure.</li>
                                <li>Reduced latency by 40% through code optimization and caching strategies.</li>
                             </ul>
                          </div>
                          <div>
                             <div className="flex justify-between items-baseline">
                                <h4 className="font-bold text-slate-900">StartUp Lab</h4>
                                <span className="text-xs text-slate-400">2018 - 2021</span>
                             </div>
                             <p className="text-xs font-semibold text-slate-600 mb-2">Frontend Engineer</p>
                             <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                <li>Implemented responsive designs using React and TypeScript.</li>
                                <li>Collaborated with UX designers to improve user engagement metrics.</li>
                             </ul>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Skills</h3>
                       <div className="flex flex-wrap gap-2">
                          {["React", "TypeScript", "Node.js", "AWS", "GraphQL", "Docker", "System Design"].map(s => (
                             <span key={s} className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 font-medium">{s}</span>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Right: Controls & Info */}
              <div className="w-full md:w-96 bg-white flex flex-col z-10 shadow-xl">
                 <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Application Review</h3>
                    <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                       <X className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Match Score */}
                    <div className="text-center">
                       <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 border-4 border-white shadow-lg mb-3 relative">
                          <svg className="w-full h-full transform -rotate-90">
                             <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200" />
                             <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                strokeDasharray={226} 
                                strokeDashoffset={226 - (226 * selectedApp.matchScore) / 100}
                                className={cn("transition-all duration-1000", selectedApp.matchScore > 80 ? 'text-emerald-500' : selectedApp.matchScore > 60 ? 'text-amber-500' : 'text-red-500')} 
                             />
                          </svg>
                          <span className="absolute text-xl font-bold text-slate-900">{selectedApp.matchScore}%</span>
                       </div>
                       <p className="text-sm font-medium text-slate-500">AI Match Score</p>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Status</h4>
                       <div className="grid grid-cols-2 gap-3">
                          <button 
                             onClick={() => handleStatusChange(selectedApp.id, 'Shortlisted')}
                             className={cn("p-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center gap-2", selectedApp.status === 'Shortlisted' ? "bg-purple-50 border-purple-200 text-purple-700" : "hover:bg-slate-50 border-slate-200")}
                          >
                             <Bookmark className="w-5 h-5" /> Shortlist
                          </button>
                          <button 
                             onClick={() => setShowScheduleInput(true)}
                             className={cn("p-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center gap-2", selectedApp.status === 'Interview' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "hover:bg-slate-50 border-slate-200")}
                          >
                             <Calendar className="w-5 h-5" /> Interview
                          </button>
                          <button 
                             onClick={() => handleStatusChange(selectedApp.id, 'Rejected')}
                             className={cn("p-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center gap-2", selectedApp.status === 'Rejected' ? "bg-red-50 border-red-200 text-red-700" : "hover:bg-slate-50 border-slate-200")}
                          >
                             <ThumbsDown className="w-5 h-5" /> Reject
                          </button>
                          <button 
                             onClick={() => handleStatusChange(selectedApp.id, 'Reviewed')}
                             className={cn("p-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center gap-2", selectedApp.status === 'Reviewed' ? "bg-blue-50 border-blue-200 text-blue-700" : "hover:bg-slate-50 border-slate-200")}
                          >
                             <Eye className="w-5 h-5" /> Reviewing
                          </button>
                       </div>

                       {/* Interview Scheduler */}
                       {showScheduleInput && (
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mt-4 animate-in fade-in slide-in-from-top-2">
                             <h4 className="text-sm font-bold text-slate-900 mb-3">Schedule Interview</h4>
                             <div className="space-y-3">
                                <div>
                                   <label className="text-xs font-semibold text-slate-500 mb-1 block">Date</label>
                                   <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="bg-white" />
                                </div>
                                <div>
                                   <label className="text-xs font-semibold text-slate-500 mb-1 block">Time</label>
                                   <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="bg-white" />
                                </div>
                                <div className="flex gap-2 pt-2">
                                   <Button onClick={handleConfirmSchedule} disabled={!scheduleDate || !scheduleTime} size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">Confirm</Button>
                                   <Button onClick={() => setShowScheduleInput(false)} variant="secondary" size="sm">Cancel</Button>
                                </div>
                             </div>
                          </div>
                       )}

                       {selectedApp.interviewDate && !showScheduleInput && selectedApp.status === 'Interview' && (
                          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg mt-4 space-y-3">
                             <div className="flex items-start gap-3">
                               <Calendar className="w-5 h-5 text-emerald-600 mt-0.5" />
                               <div>
                                  <h4 className="text-sm font-bold text-emerald-900">Interview Scheduled</h4>
                                  <p className="text-xs text-emerald-700">
                                     {new Date(selectedApp.interviewDate).toLocaleDateString()} at {new Date(selectedApp.interviewDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                               </div>
                             </div>
                             
                             {selectedApp.meetingLink && (
                                <div className="pl-8">
                                   <a href={selectedApp.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 font-medium hover:underline flex items-center gap-1 bg-emerald-100/50 px-2 py-1 rounded w-fit">
                                     Join Meeting <ExternalLink className="w-3 h-3" />
                                   </a>
                                </div>
                             )}
                          </div>
                       )}
                    </div>

                    <div className="space-y-3">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Application Details</h4>
                       <div className="bg-slate-50 p-4 rounded-lg space-y-3 text-sm">
                          <div className="flex justify-between">
                             <span className="text-slate-500">Role</span>
                             <span className="font-medium text-slate-900">{selectedApp.jobTitle}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-slate-500">Applied</span>
                             <span className="font-medium text-slate-900">{new Date(selectedApp.timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-slate-500">Email</span>
                             <span className="font-medium text-slate-900">{selectedApp.candidateEmail}</span>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <Button 
                        onClick={() => handleStatusChange(selectedApp.id, 'Shortlisted')} 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={selectedApp.status === 'Shortlisted'}
                    >
                       {selectedApp.status === 'Shortlisted' ? (
                          <><CheckCircle className="w-4 h-4 mr-2" /> Shortlisted</>
                       ) : (
                          <><Bookmark className="w-4 h-4 mr-2" /> Shortlist Candidate</>
                       )}
                    </Button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            {showShortlistedOnly ? 'Shortlisted Candidates' : 'Applicants'}
          </h2>
          <p className="text-slate-500">
            {showShortlistedOnly 
              ? 'Review and manage your shortlisted talent.' 
              : 'Manage candidates across all your active job postings.'}
          </p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="gap-2">
             <Filter className="w-4 h-4" /> Filter
           </Button>
           <Button variant="primary" className="bg-purple-600 hover:bg-purple-700">
             Export CSV
           </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidates or roles..."
              className="pl-10 bg-white"
            />
          </div>
          
          {/* Hide filters if we are in Shortlisted-only mode to prevent confusion */}
          {!showShortlistedOnly && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
               {['All', 'New', 'Reviewed', 'Shortlisted', 'Interview', 'Rejected'].map(status => (
                 <button
                   key={status}
                   onClick={() => setStatusFilter(status)}
                   className={cn(
                     "px-3 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap",
                     statusFilter === status 
                       ? "bg-purple-100 text-purple-700" 
                       : "text-slate-500 hover:bg-slate-100"
                   )}
                 >
                   {status}
                 </button>
               ))}
            </div>
          )}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:grid">
          <div className="col-span-3">Candidate</div>
          <div className="col-span-3">Applied For</div>
          <div className="col-span-2">Match</div>
          <div className="col-span-1">Resume</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100">
          {filteredApplications.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>
                  {showShortlistedOnly 
                     ? "No candidates have been shortlisted yet." 
                     : "No applicants found matching your criteria."}
              </p>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <motion.div key={app.id} variants={itemVariants} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors group">
                 {/* Candidate Info */}
                 <div className="col-span-1 md:col-span-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold capitalize">
                       {app.candidateName.charAt(0)}
                    </div>
                    <div>
                       <h4 className="font-semibold text-slate-900">{app.candidateName}</h4>
                       <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {app.candidateEmail}
                       </p>
                    </div>
                 </div>

                 {/* Job Info */}
                 <div className="col-span-1 md:col-span-3">
                    <p className="text-sm font-medium text-slate-700">{app.jobTitle}</p>
                    <p className="text-xs text-slate-500">{new Date(app.timestamp).toLocaleDateString()}</p>
                 </div>

                 {/* Match Score */}
                 <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2">
                       <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full", app.matchScore > 80 ? "bg-emerald-500" : app.matchScore > 60 ? "bg-amber-500" : "bg-red-500")}
                            style={{ width: `${app.matchScore}%` }}
                          />
                       </div>
                       <span className="text-sm font-bold text-slate-700">{app.matchScore}%</span>
                    </div>
                 </div>
                 
                 {/* Resume Preview Link */}
                 <div className="col-span-1 md:col-span-1">
                    <button onClick={() => openModal(app)} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-purple-600 transition-colors px-2 py-1 hover:bg-purple-50 rounded">
                       <FileText className="w-3.5 h-3.5" />
                       View PDF
                    </button>
                 </div>

                 {/* Status */}
                 <div className="col-span-1 md:col-span-1">
                    <Badge variant={
                      app.status === 'New' ? 'info' :
                      app.status === 'Shortlisted' ? 'brand' :
                      app.status === 'Interview' ? 'success' :
                      app.status === 'Rejected' ? 'error' : 'neutral'
                    }>
                       {app.status}
                    </Badge>
                 </div>

                 {/* Actions */}
                 <div className="col-span-1 md:col-span-2 text-right flex items-center justify-end gap-2">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleStatusChange(app.id, 'Shortlisted')} title="Shortlist" className="p-1.5 rounded-full hover:bg-purple-50 text-slate-400 hover:text-purple-600">
                          <Bookmark className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleStatusChange(app.id, 'Rejected')} title="Reject" className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600">
                          <XCircle className="w-4 h-4" />
                       </button>
                    </div>
                    <Button onClick={() => openModal(app)} variant="secondary" size="sm" className="h-8">
                       Review
                    </Button>
                 </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default Applicants;