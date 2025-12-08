import React, { useState, useMemo, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, CheckCircle, XCircle, Loader2, Sparkles, AlertTriangle, Search, Filter, SortAsc, RefreshCw } from 'lucide-react';
import { Job, JobMatchResult, ResumeAnalysis } from '../types';
import { analyzeJobMatch, generateTailoredJobs } from '../services/gemini';

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

  // Generate jobs when resume is available and no jobs are present
  useEffect(() => {
    if (resumeAnalysis && !hasGenerated && jobs.length === 0) {
      handleGenerateJobs();
    }
  }, [resumeAnalysis]);

  const handleGenerateJobs = async () => {
    if (!resumeAnalysis) return;
    
    setIsGeneratingJobs(true);
    setJobs([]); // Clear any old jobs
    try {
      const tailoredJobs = await generateTailoredJobs(resumeAnalysis.summary, resumeAnalysis.skills || []);
      setJobs(tailoredJobs);
      setHasGenerated(true);
      onActivity("Job Search", `Found ${tailoredJobs.length} relevant roles`);
    } catch (error) {
      console.error("Failed to generate jobs", error);
    } finally {
      setIsGeneratingJobs(false);
    }
  };

  // Smart Sort & Filter Logic
  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobs];

    // 1. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(q) || 
        job.company.toLowerCase().includes(q) ||
        job.requirements.some(r => r.toLowerCase().includes(q))
      );
    }

    // 2. Filter by Type (Optional extension)
    if (filterType !== 'All') {
      result = result.filter(job => job.type === filterType);
    }

    // 3. Smart Sort: If resume exists, sort by skill overlap
    if (resumeAnalysis?.skills) {
      result.sort((a, b) => {
        const getOverlap = (job: Job) => {
          // Count how many required skills match the resume skills
          const overlap = job.requirements.filter(req => 
             resumeAnalysis.skills.some(skill => 
               skill.toLowerCase().includes(req.toLowerCase()) || 
               req.toLowerCase().includes(skill.toLowerCase())
             )
          ).length;
          return overlap;
        };

        return getOverlap(b) - getOverlap(a);
      });
    }

    return result;
  }, [jobs, searchQuery, filterType, resumeAnalysis]);

  const handleAnalyzeFit = async (job: Job) => {
    if (!resumeAnalysis) return;
    
    setAnalyzingId(job.id);
    try {
      const result = await analyzeJobMatch(
        resumeAnalysis.summary,
        resumeAnalysis.skills || [],
        job.description
      );
      setMatches(prev => ({ ...prev, [job.id]: result }));
      onActivity("Job Analysis", `Analyzed fit for ${job.title} at ${job.company}`);
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyzingId(null);
    }
  };

  const getRecommendationLabel = (job: Job) => {
    if (!resumeAnalysis?.skills) return null;

    const overlap = job.requirements.filter(req => 
      resumeAnalysis.skills.some(skill => 
        skill.toLowerCase().includes(req.toLowerCase()) || 
        req.toLowerCase().includes(skill.toLowerCase())
      )
    ).length;

    // Heuristic: If > 50% of requirements match, it's a good match
    if (job.requirements.length > 0 && overlap / job.requirements.length >= 0.5) {
      return (
        <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/30 font-bold uppercase tracking-wide">
          Best Match
        </span>
      );
    }

    return null;
  };

  if (!resumeAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 bg-slate-900 rounded-2xl border border-slate-800">
        <Briefcase className="w-16 h-16 text-slate-700 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Resume Required</h3>
        <p className="text-slate-400 max-w-md">
          Please analyze your resume in the Resume Optimizer tab first. We need your profile data to find relevant jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Job Intelligence Engine</h2>
          <p className="text-slate-400">AI-curated opportunities tailored to your specific skill profile.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-sm text-slate-300 hidden md:block">
            Profile: <span className="text-blue-400 font-semibold">{resumeAnalysis.skills?.length || 0} skills detected</span>
          </div>
          <button 
            onClick={handleGenerateJobs}
            disabled={isGeneratingJobs}
            className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg border border-slate-700 transition-colors"
            title="Refresh Recommendations"
          >
            <RefreshCw className={`w-5 h-5 ${isGeneratingJobs ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur py-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input 
              type="text"
              placeholder="Filter by title, company, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>
          <div className="flex-none">
             <select 
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
               className="h-full bg-slate-900 border border-slate-800 rounded-xl px-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
             >
               <option value="All">All Types</option>
               <option value="Full-time">Full-time</option>
               <option value="Contract">Contract</option>
               <option value="Hybrid">Hybrid</option>
               <option value="Remote">Remote</option>
             </select>
          </div>
        </div>
        {resumeAnalysis && !searchQuery && (
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <SortAsc className="w-3 h-3" />
            AI-Ranked by relevance
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {isGeneratingJobs && jobs.length === 0 ? (
          <div className="text-center py-20">
             <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
             <h3 className="text-xl font-bold text-white">Curating Opportunities...</h3>
             <p className="text-slate-400">Analyzing your resume against market data to find the best roles.</p>
          </div>
        ) : filteredAndSortedJobs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No jobs found. Try adjusting your filters or refreshing.</p>
          </div>
        ) : (
          filteredAndSortedJobs.map((job) => (
            <div key={job.id} className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-colors animate-in slide-in-from-bottom-2">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white">{job.title}</h3>
                      {getRecommendationLabel(job)}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 mt-1">
                      <span className="font-medium text-slate-300">{job.company}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {job.salary}</span>
                    </div>
                  </div>
                  {matches[job.id] ? (
                    <div className={`flex flex-col items-end px-4 py-2 rounded-lg border ${
                      matches[job.id].matchScore >= 80 ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                      matches[job.id].matchScore >= 60 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                      'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      <span className="text-2xl font-bold">{matches[job.id].matchScore}%</span>
                      <span className="text-xs font-medium uppercase tracking-wider">Match Score</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAnalyzeFit(job)}
                      disabled={analyzingId === job.id}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 min-w-[130px] justify-center"
                    >
                      {analyzingId === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Analyze Fit
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.requirements.map((req, i) => {
                     const isMatch = resumeAnalysis.skills.some(s => s.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.toLowerCase()));
                     return (
                      <span key={i} className={`px-2.5 py-1 rounded-md border text-xs ${
                        isMatch ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}>
                        {req}
                      </span>
                     );
                  })}
                  <span className="px-2.5 py-1 text-xs text-slate-500 border border-transparent">{job.type}</span>
                  <span className="px-2.5 py-1 text-xs text-slate-500 border border-transparent">{job.postedAt}</span>
                </div>
                
                <p className="text-slate-400 text-sm line-clamp-2 mb-4">{job.description}</p>

                {/* Match Analysis Result */}
                {matches[job.id] && (
                  <div className="mt-6 pt-6 border-t border-slate-800 bg-slate-950/30 -mx-6 -mb-6 px-6 pb-6">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" /> AI Analysis
                    </h4>
                    <p className="text-sm text-slate-300 mb-4">{matches[job.id].summary}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">Why you fit</div>
                        <ul className="space-y-1">
                          {matches[job.id].pros.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-none" /> {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Missing Keywords</div>
                        <ul className="space-y-1">
                          {matches[job.id].missingKeywords.map((k, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                              <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-none" /> {k}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/50 flex gap-3">
                       <button className="flex-1 bg-white text-slate-900 py-2 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-colors">
                         Apply Now
                       </button>
                       <button className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors">
                         Save
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Jobs;