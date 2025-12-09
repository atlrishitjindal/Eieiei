import React from 'react';
import { ArrowRight, Mic, FileText, TrendingUp, CheckCircle, Zap, Shield, Globe, Star, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Card } from './ui/DesignSystem';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full border-b border-slate-200 bg-white/80 backdrop-blur-lg z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-lg">C</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 font-display">CareerMint</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors hidden sm:block">
              Log In
            </button>
            <Button onClick={onGetStarted} size="md" className="rounded-full px-6">
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
              New: AI Interview Coach
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] font-display">
              Build a professional resume in <span className="text-brand-600">minutes.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-lg">
              The AI-powered career assistant that writes your resume, practices interviews with you, and lands you more offers.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button onClick={onGetStarted} size="xl" className="shadow-xl shadow-brand-600/20">
                Build My Resume <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <div className="text-sm text-slate-500 font-medium px-4">
                No credit card required
              </div>
            </div>

            <div className="pt-8 flex items-center gap-4 text-sm text-slate-500">
               <div className="flex -space-x-2">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                 ))}
               </div>
               <p>Trusted by 10,000+ job seekers</p>
            </div>
          </motion.div>

          {/* Hero Visual - Resume Upload Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
             <div className="absolute inset-0 bg-brand-600/5 rounded-3xl transform rotate-3" />
             <Card className="relative bg-white shadow-2xl shadow-slate-200 p-8 border-slate-200">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                   <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-brand-600" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Resume</h3>
                   <p className="text-slate-500 text-sm">Drag & drop PDF to get your ATS score instantly</p>
                   <Button size="sm" className="mt-6 pointer-events-none">Select File</Button>
                </div>

                <div className="mt-6 flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 font-bold shadow-sm">94</div>
                      <div>
                         <p className="font-bold text-emerald-900 text-sm">Excellent Score</p>
                         <p className="text-emerald-700 text-xs">Ready for applications</p>
                      </div>
                   </div>
                   <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
             </Card>
          </motion.div>
        </div>
      </div>

      {/* Logos Section */}
      <div className="py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Works with all major ATS systems</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
             {/* Simple Text Placeholders for Logos to avoid external assets */}
             <span className="text-xl font-bold text-slate-800">Greenhouse</span>
             <span className="text-xl font-bold text-slate-800">Lever</span>
             <span className="text-xl font-bold text-slate-800">Workday</span>
             <span className="text-xl font-bold text-slate-800">Indeed</span>
             <span className="text-xl font-bold text-slate-800">LinkedIn</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 font-display">Everything you need to get hired fast.</h2>
            <p className="text-lg text-slate-500">Stop guessing what recruiters want. Our AI tools guide you through every step of the process.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FileText className="w-6 h-6 text-brand-600" />}
              title="Resume Intelligence"
              desc="Get instant feedback on your resume. We simulate top ATS algorithms to score your content."
            />
            <FeatureCard 
              icon={<Mic className="w-6 h-6 text-purple-600" />}
              title="Live Interview Sim"
              desc="Practice voice-to-voice with an AI hiring manager. Receive transcripts and performance coaching."
            />
            <FeatureCard 
              icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
              title="Smart Job Match"
              desc="Find jobs that match your skills perfectly. We analyze descriptions to highlight your gaps."
            />
          </div>
        </div>
      </div>

      <footer className="py-12 border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded flex items-center justify-center">
              <span className="font-bold text-xs text-white">C</span>
            </div>
            <span className="font-bold text-sm text-slate-900">CareerMint AI</span>
           </div>
           <div className="flex gap-6 text-sm text-slate-500 font-medium">
             <a href="#" className="hover:text-brand-600">Privacy</a>
             <a href="#" className="hover:text-brand-600">Terms</a>
             <a href="#" className="hover:text-brand-600">Support</a>
           </div>
           <p className="text-slate-400 text-sm">© 2025 CareerMint Inc.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-50 transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;