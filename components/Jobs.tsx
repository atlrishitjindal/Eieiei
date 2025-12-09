import React, { useState, useMemo, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Loader2, Sparkles, AlertTriangle, Search, CheckCircle, RefreshCw, Filter } from 'lucide-react';
import { Job, JobMatchResult, ResumeAnalysis } from '../types';
import { analyzeJobMatch, generateTailoredJobs } from '../services/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Badge, Input } from './ui/DesignSystem';
import { cn, containerVariants, itemVariants } from '../lib/utils';

interface JobsProps {
  resumeAnalysis: ResumeAnalysis | null;
  onActivity: (title: string, meta: string) => void;
}

const Jobs: React.FC<JobsProps> = ({ resumeAnalysis, onActivity }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, JobMatchResult>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isGeneratingJobs, setIsGeneratingJobs] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  // Application State
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    if (resumeAnalysis && !hasGenerated && jobs.length === 0) {
      handleGenerateJobs();
    }
  }, [resumeAnalysis]);

  const handleGenerateJobs = async () => {
    if (!resumeAnalysis) return;
    setIsGeneratingJobs(true);
    setJobs([]);
    try {
      const tailoredJobs = await generateTailoredJobs(resumeAnalysis.summary, resumeAnalysis.skills || []);
      setJobs(tailoredJobs);
      setHasGenerated(true);
      onActivity("Job Search", `Found ${tailoredJobs.length} roles`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingJobs(false);
    }
  };

  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobs];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(q) || 
        job.company.toLowerCase().includes(q)
      );
    }
    if (filterType !== 'All') {
      result = result.filter(job => job.type === filterType);
    }
    return result;
  }, [jobs, searchQuery, filterType]);

  const handleAnalyzeFit = async (job: Job) => {
    if (!resumeAnalysis) return;
    setAnalyzingId(job.id);
    try {
      const result = await analyzeJobMatch(resumeAnalysis.summary, resumeAnalysis.skills || [], job.description);
      setMatches(prev => ({ ...prev, [job.id]: result }));
      onActivity("Job Analysis", `Analyzed ${job.company}`);
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleApply = async (job: Job) => {
    setApplyingId(job.id);
    // Simulate network delay for application process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setAppliedJobs(prev => new Set(prev).add(job.id));
    setApplyingId(null);
    onActivity("Job Application", `Applied to ${job.company}`);
  };

  if (!resumeAnalysis) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] text-center p-12 bg-white shadow-none border border-slate-200 rounded-2xl">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
           <Briefcase className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Resume Required</h3>
        <p className="text-slate-500 max-w-md">We need to know your skills to find the perfect job matches. Please upload your resume first.</p>
      </Card>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Job Matches</h2>
            <p className="text-slate-500">Curated opportunities based on your {resumeAnalysis.skills?.length || 0} skills.</p>
          </div>
          <Button onClick={handleGenerateJobs} disabled={isGeneratingJobs} variant="outline" className="gap-2">
            <RefreshCw className={cn("w-4 h-4", isGeneratingJobs && "animate-spin")} /> Refresh Feed
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title or company..."
              className="pl-10"
            />
          </div>
          <div className="relative min-w-[180px]">
             <Filter className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
             <select 
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
               className="h-11 w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-brand-500/20 outline-none appearance-none"
             >
               <option value="All">All Job Types</option>
               <option value="Full-time">Full-time</option>
               <option value="Contract">Contract</option>
               <option value="Remote">Remote</option>
             </select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {isGeneratingJobs ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
             <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-brand-600" />
             <h3 className="text-lg font-semibold text-slate-900">Scanning Top Job Boards...</h3>
             <p className="text-slate-500">Finding roles that match your expertise.</p>
          </div>
        ) : filteredAndSortedJobs.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No jobs found matching your criteria.</div>
        ) : (
          filteredAndSortedJobs.map((job) => (
          <motion.div key={job.id} variants={itemVariants}>
            <Card className="hover:border-brand-300 hover:shadow-md transition-all group overflow-hidden border-l-4 border-l-transparent hover:border-l-brand-500">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors font-display">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">{job.company}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {job.salary}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{job.postedAt}</span>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      {job.requirements.slice(0, 4).map((r, i) => (
                        <Badge key={i} variant="neutral" className="bg-slate-100 text-slate-600">{r}</Badge>
                      ))}
                      <Badge variant="brand" className="bg-brand-50 text-brand-700 border-brand-100">{job.type}</Badge>
                    </div>
                  </div>

                  <div className="flex-none flex flex-row md:flex-col items-center md:items-end gap-3 justify-between md:justify-start min-w-[160px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    {matches[job.id] ? (
                      <div className={cn(
                        "flex flex-col items-center md:items-end justify-center p-3 rounded-lg border w-full text-center md:text-right",
                        matches[job.id].matchScore >= 80 ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                        matches[job.id].matchScore >= 60 ? "bg-amber-50 border-amber-100 text-amber-700" :
                        "bg-red-50 border-red-100 text-red-700"
                      )}>
                        <span className="text-3xl font-bold tracking-tight">{matches[job.id].matchScore}%</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Fit Score</span>
                      </div>
                    ) : (
                      <Button onClick={() => handleAnalyzeFit(job)} disabled={analyzingId === job.id} variant="primary" className="w-full">
                        {analyzingId === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" /> Analyze Fit</>}
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => handleApply(job)}
                      disabled={appliedJobs.has(job.id) || applyingId === job.id}
                      variant={appliedJobs.has(job.id) ? "secondary" : "outline"} 
                      size="sm" 
                      className={cn("w-full transition-all duration-300", appliedJobs.has(job.id) && "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700")}
                    >
                      {appliedJobs.has(job.id) ? (
                        <><CheckCircle className="w-4 h-4 mr-2" /> Applied</>
                      ) : applyingId === job.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Applying...</>
                      ) : (
                        "Apply Now"
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {matches[job.id] && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-slate-50 border-t border-slate-200 px-6 py-4">
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <h4 className="font-bold text-emerald-700 text-xs uppercase tracking-wide mb-2">Why you're a match</h4>
                      <ul className="space-y-2">
                        {matches[job.id].pros.map((p, i) => (
                          <li key={i} className="flex gap-2 text-slate-700"><CheckCircle className="w-4 h-4 text-emerald-500 flex-none mt-0.5" /> {p}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-700 text-xs uppercase tracking-wide mb-2">Missing Skills</h4>
                      <ul className="space-y-2">
                        {matches[job.id].missingKeywords.map((k, i) => (
                          <li key={i} className="flex gap-2 text-slate-700"><AlertTriangle className="w-4 h-4 text-amber-500 flex-none mt-0.5" /> Missing: <span className="font-medium text-slate-900">{k}</span></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )))}
      </div>
    </motion.div>
  );
};

export default Jobs;