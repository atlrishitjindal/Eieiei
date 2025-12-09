import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, TrendingUp, Lightbulb, ChevronDown, Download } from 'lucide-react';
import { analyzeResume, generateImprovementExample } from '../services/gemini';
import { ResumeAnalysis } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Badge } from './ui/DesignSystem';
import { cn, containerVariants, itemVariants } from '../lib/utils';

interface ResumeAnalyzerProps {
  analysisResult: ResumeAnalysis | null;
  onAnalysisComplete: (result: ResumeAnalysis) => void;
  onActivity: (title: string, meta: string) => void;
}

const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({ analysisResult, onAnalysisComplete, onActivity }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeExampleIndex, setActiveExampleIndex] = useState<number | null>(null);
  const [exampleLoading, setExampleLoading] = useState(false);
  const [examples, setExamples] = useState<Record<number, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setExamples({});
      setActiveExampleIndex(null);

      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !preview) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const base64Data = preview.split(',')[1];
      const analysis = await analyzeResume(base64Data, file.type);
      onAnalysisComplete(analysis);
      onActivity("Resume Analysis", `Scored ${analysis.score}/100`);
    } catch (err: any) {
      setError("Failed to analyze resume. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShowExample = async (index: number, improvement: string) => {
    if (activeExampleIndex === index) {
      setActiveExampleIndex(null);
      return;
    }
    setActiveExampleIndex(index);
    if (!examples[index]) {
      setExampleLoading(true);
      try {
        const example = await generateImprovementExample(improvement, analysisResult?.summary || "");
        setExamples(prev => ({ ...prev, [index]: example }));
      } finally {
        setExampleLoading(false);
      }
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Resume Analyzer</h2>
            <p className="text-slate-500 mt-1">Check your ATS compatibility and get detailed feedback.</p>
         </div>
         {analysisResult && (
           <Button variant="outline" size="sm" onClick={() => { onAnalysisComplete(null as any); setFile(null); setPreview(null); }}>
             Upload New Resume
           </Button>
         )}
      </div>

      {!analysisResult && (
        <Card className="border-dashed border-2 border-slate-300 bg-slate-50 hover:bg-white hover:border-brand-400 transition-all p-16 flex flex-col items-center justify-center text-center cursor-pointer relative group rounded-2xl shadow-none">
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            accept="image/png, image/jpeg, image/jpg, application/pdf"
            onChange={handleFileChange}
          />
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-md border border-slate-100">
            {preview ? <FileText className="w-8 h-8 text-brand-600" /> : <Upload className="w-8 h-8 text-slate-400 group-hover:text-brand-500 transition-colors" />}
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900">
              {file ? file.name : "Drag & drop your resume"}
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Supports PDF and Image formats. We'll analyze it instantly using GenAI.
            </p>
          </div>

          {file && !isAnalyzing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 z-20 relative pointer-events-none">
              <Button onClick={(e) => { e.stopPropagation(); handleAnalyze(); }} size="lg" className="pointer-events-auto shadow-xl shadow-brand-500/20">
                Analyze Now
              </Button>
            </motion.div>
          )}

          {isAnalyzing && (
             <div className="mt-8 flex flex-col items-center gap-3 text-brand-600 font-medium bg-white px-6 py-3 rounded-full shadow-lg border border-slate-100">
               <Loader2 className="w-6 h-6 animate-spin" /> 
               <span>Scanning for ATS keywords...</span>
             </div>
          )}
          {error && <p className="mt-4 text-red-500 text-sm font-medium bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
        </Card>
      )}

      {analysisResult && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
             <Card className="p-8 flex flex-col items-center text-center bg-white shadow-lg shadow-slate-200/50 border-t-4 border-t-brand-500">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Overall Score</h3>
                <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                   <svg className="w-full h-full -rotate-90">
                     <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                     <circle cx="80" cy="80" r="70" stroke={analysisResult.score > 75 ? "#10b981" : analysisResult.score > 50 ? "#f59e0b" : "#ef4444"} strokeWidth="12" fill="transparent" strokeDasharray={439.8} strokeDashoffset={439.8 - (439.8 * analysisResult.score) / 100} className="transition-all duration-1000 ease-out rounded-full" strokeLinecap="round" />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-5xl font-bold text-slate-900 tracking-tighter">{analysisResult.score}</span>
                   </div>
                </div>
                <p className="text-slate-500 text-sm">
                   Your resume is <strong className="text-slate-900">{analysisResult.score > 75 ? "Excellent" : "Needs Work"}</strong> compared to other candidates.
                </p>
             </Card>

             <Card className="p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                   <Lightbulb className="w-4 h-4 text-amber-500" /> Detected Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                   {analysisResult.skills.slice(0, 15).map((skill, i) => (
                      <Badge key={i} variant="neutral" className="bg-white border-slate-200 text-slate-700">{skill}</Badge>
                   ))}
                </div>
             </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
               <h3 className="font-bold text-slate-900 mb-2">Executive Summary</h3>
               <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {analysisResult.summary}
               </p>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
               <Card className="p-0 overflow-hidden border-t-4 border-t-emerald-500">
                  <div className="p-4 bg-emerald-50 border-b border-emerald-100">
                     <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" /> Strengths
                     </h3>
                  </div>
                  <div className="p-4 space-y-3">
                     {analysisResult.strengths.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
                           <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-none" />
                           {item}
                        </div>
                     ))}
                  </div>
               </Card>

               <Card className="p-0 overflow-hidden border-t-4 border-t-amber-500">
                  <div className="p-4 bg-amber-50 border-b border-amber-100">
                     <h3 className="font-bold text-amber-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-amber-600" /> Improvements
                     </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                     {analysisResult.improvements.map((item, i) => (
                        <div key={i} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => handleShowExample(i, item)}>
                           <div className="flex justify-between items-start gap-2">
                              <p className="text-sm text-slate-700 font-medium">{item}</p>
                              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform mt-0.5", activeExampleIndex === i ? "rotate-180" : "")} />
                           </div>
                           <AnimatePresence>
                              {activeExampleIndex === i && (
                                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="mt-3 text-xs text-brand-700 bg-brand-50 p-3 rounded border border-brand-100">
                                       <div className="font-bold mb-1 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Fix Example:</div>
                                       {exampleLoading && !examples[i] ? "Generating tailored example..." : examples[i]}
                                    </div>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ResumeAnalyzer;