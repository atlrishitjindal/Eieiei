import React, { useState } from 'react';
import { Mail, Loader2, Copy, Check, FileText } from 'lucide-react';
import { ResumeAnalysis } from '../types';
import { generateCoverLetter } from '../services/gemini';

interface CoverLetterProps {
  resumeAnalysis: ResumeAnalysis | null;
  onActivity: (title: string, meta: string) => void;
}

const CoverLetter: React.FC<CoverLetterProps> = ({ resumeAnalysis, onActivity }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!resumeAnalysis || !jobDescription.trim()) return;
    
    setIsGenerating(true);
    try {
      const letter = await generateCoverLetter(resumeAnalysis.summary, jobDescription);
      setGeneratedLetter(letter);
      onActivity("Cover Letter", "Generated letter for new role");
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!resumeAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 bg-slate-900 rounded-2xl border border-slate-800">
        <FileText className="w-16 h-16 text-slate-700 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Resume Required</h3>
        <p className="text-slate-400 max-w-md">
          Please upload your resume first. We need your background to write a tailored cover letter.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
      {/* Input Side */}
      <div className="flex flex-col space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Cover Letter Generator</h2>
          <p className="text-slate-400 text-sm">Paste a job description. We'll write a persuasive letter connecting your resume to their needs.</p>
        </div>

        <div className="flex-1 flex flex-col">
          <label className="text-sm font-medium text-slate-300 mb-2">Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            placeholder="Paste the full job description here..."
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !jobDescription.trim()}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Writing Magic...
            </>
          ) : (
            <>
              <Mail className="w-5 h-5" /> Generate Letter
            </>
          )}
        </button>
      </div>

      {/* Output Side */}
      <div className="flex flex-col h-full bg-slate-50 text-slate-900 rounded-xl shadow-2xl overflow-hidden relative">
        <div className="bg-slate-200 border-b border-slate-300 p-4 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase">Preview</span>
          <button 
            onClick={copyToClipboard}
            disabled={!generatedLetter}
            className="text-slate-600 hover:text-blue-600 transition-colors"
            title="Copy to Clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="flex-1 p-8 overflow-y-auto font-serif leading-relaxed whitespace-pre-wrap">
          {generatedLetter ? (
            generatedLetter
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
              <Mail className="w-12 h-12 mb-4 opacity-20" />
              <p>Your generated letter will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoverLetter;