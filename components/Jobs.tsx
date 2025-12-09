import React, { useState, useMemo, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Loader2, Sparkles, AlertTriangle, Search, CheckCircle, RefreshCw } from 'lucide-react';
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

  if (!resumeAnalysis) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] text-center p-12 border-dashed border-2 bg-zinc-900/30">
        <Briefcase className="w-12 h-12 text-zinc-600 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Resume Required</h3>
        <p className="text-zinc-500">Analyze your resume first to unlock job matching.</p>
      </Card>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Job Intelligence</h2>
          <p className="text-zinc-400">AI-curated roles matching your {resumeAnalysis.skills?.length || 0} skills.</p>
        </div>
        <Button onClick={handleGenerateJobs} disabled={isGeneratingJobs} variant="secondary" className="gap-2">
          <RefreshCw className={cn("w-4 h-4", isGeneratingJobs && "animate-spin")} /> Refresh
        </Button>
      </div>

      <div className="flex gap-3 sticky top-0 z-10 bg-zinc-950/80 backdrop-blur py-2 -mx-2 px-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles..."
            className="pl-9"
          />
        </div>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-10 bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-sm text-zinc-300 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="All">All Types</option>
          <option value="Full-time">Full-time</option>
          <option value="Contract">Contract</option>
          <option value="Remote">Remote</option>
        </select>
      </div>

      <div className="space-y-4">
        {isGeneratingJobs ? (
          <div className="text-center py-20 text-zinc-500">
             <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
             <p>Scanning market data...</p>
          </div>
        ) : filteredAndSortedJobs.map((job) => (
          <motion.div key={job.id} variants={itemVariants}>
            <Card className="hover:border-zinc-700 transition-colors group">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">{job.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-zinc-500 mt-1">
                        <span className="font-medium text-zinc-300">{job.company}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {job.salary}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.slice(0, 4).map((r, i) => (
                      <Badge key={i} variant="neutral" className="bg-zinc-800/50">{r}</Badge>
                    ))}
                    <Badge variant="neutral">{job.type}</Badge>
                    <span className="text-xs text-zinc-600 self-center ml-2">{job.postedAt}</span>
                  </div>
                </div>

                <div className="flex-none flex flex-col items-end gap-3 min-w-[140px]">
                  {matches[job.id] ? (
                    <div className={cn(
                      "flex flex-col items-end p-3 rounded-lg border w-full",
                      matches[job.id].matchScore >= 80 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      matches[job.id].matchScore >= 60 ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                      "bg-red-500/10 border-red-500/20 text-red-400"
                    )}>
                      <span className="text-2xl font-bold">{matches[job.id].matchScore}%</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Match</span>
                    </div>
                  ) : (
                    <Button onClick={() => handleAnalyzeFit(job)} disabled={analyzingId === job.id} variant="primary" className="w-full">
                      {analyzingId === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" /> Analyze Fit</>}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="w-full">Details</Button>
                </div>
              </div>

              {matches[job.id] && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 pt-4 border-t border-zinc-800/50">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-emerald-400 text-xs uppercase tracking-wide">Pros</h4>
                      <ul className="space-y-1 text-zinc-400">
                        {matches[job.id].pros.map((p, i) => (
                          <li key={i} className="flex gap-2"><CheckCircle className="w-4 h-4 text-emerald-500/50 flex-none" /> {p}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-amber-400 text-xs uppercase tracking-wide">Gaps</h4>
                      <ul className="space-y-1 text-zinc-400">
                        {matches[job.id].missingKeywords.map((k, i) => (
                          <li key={i} className="flex gap-2"><AlertTriangle className="w-4 h-4 text-amber-500/50 flex-none" /> Missing: {k}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Jobs;