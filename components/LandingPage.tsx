import React from 'react';
import { ArrowRight, Mic, FileText, TrendingUp, CheckCircle, Zap, Shield, Globe, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/DesignSystem';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">C</span>
            </div>
            <span className="font-bold text-lg tracking-tight">CareerCraft AI</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={onLogin} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Sign In
            </button>
            <Button onClick={onGetStarted} size="sm" className="rounded-full">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-[100%] blur-[120px] -z-10 pointer-events-none opacity-50" />

        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400 mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            v2.0 is now live
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]"
          >
            The operating system for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">your career growth.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            Optimize your resume, practice interviews with AI, and track applications in one unified workspace. Built for high-performers.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 pt-4"
          >
            <Button onClick={onGetStarted} size="lg" className="rounded-full px-8 h-12 text-base shadow-xl shadow-blue-500/10">
              Start Building Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <button className="px-8 h-12 rounded-full border border-zinc-800 text-zinc-300 font-medium hover:bg-zinc-900 hover:text-white transition-all text-base">
              View Demo
            </button>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden aspect-[16/9] relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              {/* Mock UI */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="text-center space-y-4">
                   <div className="w-16 h-16 bg-zinc-800 rounded-2xl mx-auto flex items-center justify-center border border-zinc-700 shadow-lg">
                     <Cpu className="w-8 h-8 text-blue-500" />
                   </div>
                   <p className="text-zinc-500 font-medium">Dashboard Interface Preview</p>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-32 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Engineered for results.</h2>
            <p className="text-zinc-400 max-w-xl text-lg">Every tool you need to land your dream role, powered by Gemini 1.5 Pro.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<FileText className="w-6 h-6 text-blue-400" />}
              title="Resume Intelligence"
              desc="Real-time ATS scoring and line-by-line improvement suggestions."
            />
            <FeatureCard 
              icon={<Mic className="w-6 h-6 text-purple-400" />}
              title="Live Interview Sim"
              desc="Voice-to-voice practice with an AI hiring manager. Get instant feedback."
            />
            <FeatureCard 
              icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
              title="Market Insights"
              desc="Deep search grounding to find salary data and hiring trends."
            />
          </div>
        </div>
      </div>

      <footer className="py-12 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">
              <span className="font-bold text-xs text-white">C</span>
            </div>
            <span className="font-bold text-sm text-zinc-300">CareerCraft AI</span>
           </div>
           <p className="text-zinc-600 text-sm">© 2025 CareerCraft. Crafted with ❤️ for builders.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors group">
    <div className="w-12 h-12 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-zinc-400 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;