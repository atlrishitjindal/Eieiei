import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Award, Zap, TrendingUp, Lightbulb, ChevronRight } from 'lucide-react';
import { analyzeResume, generateImprovementExample } from '../services/gemini';
import { ResumeAnalysis } from '../types';

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
  
  // Interactive example state
  const [activeExampleIndex, setActiveExampleIndex] = useState<number | null>(null);
  const [exampleLoading, setExampleLoading] = useState(false);
  const [examples, setExamples] = useState<Record<number, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Reset logic handled by parent state update essentially, but strictly we clear local previews
      setExamples({});
      setActiveExampleIndex(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
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
      console.error(err);
      setError("Failed to analyze resume. Please ensure it's a clear file.");
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
        const example = await generateImprovementExample(improvement, analysisResult?.summary || "General Context");
        setExamples(prev => ({ ...prev, [index]: example }));
      } catch (err) {
        setExamples(prev => ({ ...prev, [index]: "Could not generate example." }));
      } finally {
        setExampleLoading(false);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">AI Resume Optimizer</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Upload your resume. Our AI will score it, identify gaps, and provide actionable improvements instantly.
        </p>
      </div>

      {!analysisResult && (
        <div className="bg-slate-900 rounded-2xl shadow-sm border-2 border-dashed border-slate-700 p-12 text-center transition-all hover:border-blue-500 hover:bg-slate-900/80 group">
          <input
            type="file"
            id="resume-upload"
            className="hidden"
            accept="image/png, image/jpeg, image/jpg, application/pdf"
            onChange={handleFileChange}
          />
          <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center gap-4">
            {preview ? (
              <div className="relative group-hover:opacity-90 transition-opacity">
                {file?.type === 'application/pdf' ? (
                  <div className="w-64 h-64 bg-slate-950 rounded-lg border border-slate-700 flex flex-col items-center justify-center p-4 shadow-lg">
                    <FileText className="w-16 h-16 text-red-500 mb-4" />
                    <p className="text-sm font-medium text-slate-300 text-center break-all line-clamp-3">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">PDF Document</p>
                  </div>
                ) : (
                  <img src={preview} alt="Resume Preview" className="h-64 object-contain shadow-lg rounded-lg border border-slate-800" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 rounded-lg transition-opacity font-medium">
                  Change File
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 bg-slate-800 text-blue-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
            )}
            
            {!preview && (
              <>
                <h3 className="text-xl font-semibold text-white">Click to Upload Resume</h3>
                <p className="text-slate-500 text-sm">Supports PDF, JPG, PNG (Max 5MB)</p>
              </>
            )}
          </label>

          {file && !isAnalyzing && (
            <div className="mt-8">
              <button
                onClick={handleAnalyze}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg shadow-blue-900/20 transition-all hover:scale-105 flex items-center gap-2 mx-auto"
              >
                <Zap className="w-5 h-5" />
                Analyze Resume
              </button>
            </div>
          )}

          {isAnalyzing && (
             <div className="mt-8 flex flex-col items-center text-blue-400">
               <Loader2 className="w-8 h-8 animate-spin mb-2" />
               <p className="font-medium">Reading and Analyzing...</p>
             </div>
          )}
          
          {error && <p className="mt-4 text-red-400 font-medium">{error}</p>}
        </div>
      )}

      {analysisResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Score Card */}
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-none relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" 
                  strokeDasharray={351.86} 
                  strokeDashoffset={351.86 - (351.86 * analysisResult.score) / 100}
                  className={`transition-all duration-1000 ease-out ${analysisResult.score > 80 ? 'text-green-500' : analysisResult.score > 60 ? 'text-yellow-500' : 'text-red-500'}`} 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-3xl font-bold">{analysisResult.score}</span>
                <span className="text-xs uppercase tracking-wider text-slate-500">ATS Score</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-2xl font-bold text-white">Executive Summary</h3>
                <span className="bg-blue-900/30 text-blue-400 border border-blue-900/50 px-3 py-0.5 rounded-full text-sm font-semibold">AI Generated</span>
              </div>
              <p className="text-slate-400 leading-relaxed">{analysisResult.summary}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Strengths */}
            <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-4 text-green-400">
                <CheckCircle className="w-6 h-6" />
                <h3 className="font-bold text-lg text-white">Strengths</h3>
              </div>
              <ul className="space-y-3">
                {analysisResult.strengths.map((item, i) => (
                  <li key={i} className="flex gap-3 text-slate-300 text-sm">
                    <span className="flex-none w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-4 text-amber-400">
                <AlertCircle className="w-6 h-6" />
                <h3 className="font-bold text-lg text-white">ATS Gaps</h3>
              </div>
              <ul className="space-y-3">
                {analysisResult.weaknesses.map((item, i) => (
                  <li key={i} className="flex gap-3 text-slate-300 text-sm">
                    <span className="flex-none w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements with Interactive Examples */}
            <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-4 text-blue-400">
                <TrendingUp className="w-6 h-6" />
                <h3 className="font-bold text-lg text-white">Improvements</h3>
              </div>
              <ul className="space-y-4">
                {analysisResult.improvements.map((item, i) => (
                  <li key={i} className="text-slate-300 text-sm">
                    <div className="flex gap-3 mb-2">
                      <span className="flex-none w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                      <span>{item}</span>
                    </div>
                    
                    <button
                      onClick={() => handleShowExample(i, item)}
                      className="ml-5 text-blue-400 text-xs font-semibold flex items-center gap-1 hover:text-blue-300 transition-colors"
                    >
                      <Lightbulb className="w-3 h-3" />
                      {activeExampleIndex === i ? 'Hide Example' : 'See Example'}
                      <ChevronRight className={`w-3 h-3 transition-transform ${activeExampleIndex === i ? 'rotate-90' : ''}`} />
                    </button>

                    {activeExampleIndex === i && (
                      <div className="ml-5 mt-2 p-3 bg-slate-950 border border-slate-800 rounded-lg animate-in slide-in-from-top-2">
                         {exampleLoading && !examples[i] ? (
                           <div className="flex items-center gap-2 text-slate-500">
                             <Loader2 className="w-3 h-3 animate-spin" /> Generating...
                           </div>
                         ) : (
                           <div className="text-slate-400 italic">
                             "{examples[i]}"
                           </div>
                         )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;