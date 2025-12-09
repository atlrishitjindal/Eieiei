import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, TrendingUp, Lightbulb, ChevronDown } from 'lucide-react';
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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">Resume Optimizer</h2>
        <p className="text-zinc-400">Upload your resume to receive an ATS score and actionable feedback.</p>
      </div>

      {!analysisResult && (
        <Card className="border-dashed border-2 border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all p-12 flex flex-col items-center justify-center text-center cursor-pointer relative group">
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            accept="image/png, image/jpeg, image/jpg, application/pdf"
            onChange={handleFileChange}
          />
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
            {preview ? <FileText className="w-8 h-8 text-blue-400" /> : <Upload className="w-8 h-8 text-zinc-400" />}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">
              {file ? file.name : "Drop your resume here"}
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              Supports PDF and Image formats up to 10MB.
            </p>
          </div>

          {file && !isAnalyzing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 z-20 relative pointer-events-none">
              <Button onClick={(e) => { e.stopPropagation(); handleAnalyze(); }} className="pointer-events-auto">
                Analyze Resume
              </Button>
            </motion.div>
          )}

          {isAnalyzing && (
             <div className="mt-8 flex items-center gap-2 text-blue-400 font-medium">
               <Loader2 className="w-4 h-4 animate-spin" /> Processing...
             </div>
          )}
          {error && <p className="mt-4 text-red-400 text-sm font-medium">{error}</p>}
        </Card>
      )}

      {analysisResult && (
        <div className="space-y-6">
          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
            <Card className="col-span-1 flex flex-col items-center justify-center p-8 bg-zinc-900/50">
               <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#27272a" strokeWidth="8" fill="transparent" />
                    <circle cx="64" cy="64" r="56" stroke={analysisResult.score > 75 ? "#10b981" : analysisResult.score > 50 ? "#f59e0b" : "#ef4444"} strokeWidth="8" fill="transparent" strokeDasharray={351.86} strokeDashoffset={351.86 - (351.86 * analysisResult.score) / 100} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white tracking-tighter">{analysisResult.score}</span>
                  </div>
               </div>
               <p className="mt-4 font-medium text-zinc-300">ATS Score</p>
            </Card>

            <Card className="col-span-2 space-y-4">
              <h3 className="font-semibold text-zinc-200">Executive Summary</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{analysisResult.summary}</p>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-800/50">
                {analysisResult.skills.slice(0, 8).map((skill, i) => (
                  <Badge key={i} variant="neutral">{skill}</Badge>
                ))}
                {analysisResult.skills.length > 8 && <Badge variant="neutral">+{analysisResult.skills.length - 8}</Badge>}
              </div>
            </Card>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div variants={itemVariants} className="space-y-4">
              <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Key Strengths
              </h3>
              <div className="space-y-3">
                {analysisResult.strengths.map((item, i) => (
                  <Card key={i} className="p-4 border-emerald-500/10 bg-emerald-500/5 flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-none" />
                    <p className="text-sm text-zinc-300">{item}</p>
                  </Card>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Suggested Improvements
              </h3>
              <div className="space-y-3">
                {analysisResult.improvements.map((item, i) => (
                  <div key={i} className="group">
                    <Card className="p-4 border-blue-500/10 bg-blue-500/5 hover:border-blue-500/30 transition-colors cursor-pointer" onClick={() => handleShowExample(i, item)}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3">
                           <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-none" />
                           <p className="text-sm text-zinc-300">{item}</p>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-blue-400 transition-transform", activeExampleIndex === i ? "rotate-180" : "")} />
                      </div>
                      
                      <AnimatePresence>
                        {activeExampleIndex === i && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                             <div className="mt-3 pt-3 border-t border-blue-500/20 text-xs text-blue-300 bg-blue-900/20 p-3 rounded">
                               <div className="flex items-center gap-2 mb-1 font-semibold"><Lightbulb className="w-3 h-3" /> AI Suggestion:</div>
                               {exampleLoading && !examples[i] ? "Generating example..." : examples[i]}
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ResumeAnalyzer;