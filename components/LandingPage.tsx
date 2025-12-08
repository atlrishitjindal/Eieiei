import React from 'react';
import { ArrowRight, Mic, FileText, TrendingUp, CheckCircle, Star, Zap, Layout, Shield } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-cyan-500/30 font-sans">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-1.5 rounded-lg">
              <Star className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">CareerCraft AI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">How it works</a>
          </div>

          <div className="flex items-center gap-4">
             <button 
              onClick={onLogin}
              className="text-slate-300 hover:text-white font-medium text-sm transition-colors hidden sm:block"
            >
              Sign In
            </button>
            <button 
              onClick={onGetStarted}
              className="bg-white hover:bg-slate-200 text-slate-950 px-5 py-2.5 rounded-full font-bold text-sm transition-all"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Left Content */}
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text font-bold">AI-Powered Career OS</span>
                <span className="text-slate-500">for ambitious professionals</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">
                Craft a career that <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">passes every filter.</span>
              </h1>
              
              <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                CareerCraft AI analyzes your resume, maps your skills to real jobs, and automates applications with ATS-ready resumes, tailored cover letters, and interview prep.
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={onGetStarted}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-8 py-4 rounded-full font-bold text-base flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  Start free — no card required
                </button>
                <button className="px-8 py-4 rounded-full font-bold text-base text-white border border-slate-700 hover:bg-slate-800 transition-all">
                  Explore features
                </button>
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="lg:w-1/2 w-full">
              <div className="relative bg-[#0B1120] border border-slate-800 rounded-3xl p-6 shadow-2xl">
                {/* Glow behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl opacity-20 blur-lg -z-10"></div>
                
                <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                  <h3 className="font-semibold text-slate-200">Resume Health</h3>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    Live
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                    <div className="text-slate-500 text-xs font-medium mb-1">ATS Score</div>
                    <div className="text-3xl font-bold text-cyan-400">87</div>
                    <div className="text-[10px] text-green-400 mt-1">Top 5% in your industry</div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                    <div className="text-slate-500 text-xs font-medium mb-1">Active Applications</div>
                    <div className="text-3xl font-bold text-white">14</div>
                    <div className="text-[10px] text-slate-400 mt-1">3 interviews scheduled</div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                    <div className="text-slate-500 text-xs font-medium mb-1">Skill Match</div>
                    <div className="text-3xl font-bold text-blue-400">92%</div>
                    <div className="text-[10px] text-slate-400 mt-1">for Product Manager roles</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 border border-slate-700/50">
                   <div className="flex gap-3">
                     <div className="mt-1 bg-cyan-500/20 p-1.5 rounded text-cyan-400 h-fit">
                       <Zap className="w-4 h-4" />
                     </div>
                     <div>
                       <p className="text-sm text-slate-200 font-medium italic">"Add impact metrics to your lead projects to increase recruiter engagement."</p>
                       <p className="text-xs text-cyan-400 mt-2 font-semibold">+ 18% interview rate after optimization</p>
                     </div>
                   </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Everything you need for a modern job hunt</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group bg-[#0B1120] p-8 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-all duration-300">
              <div className="mb-4">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">AI Resume Studio</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Upload, parse, and perfect your resume</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Drag & drop your resume, get ATS-safe rewrites, structure fixes, and missing section suggestions in seconds.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-[#0B1120] p-8 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-all duration-300">
               <div className="mb-4">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Job Matcher</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real Jobs, real matching scores</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Map your profile to live roles, see compatibility by skill & keyword coverage, and tailor each application.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-[#0B1120] p-8 rounded-2xl border border-slate-800 hover:border-purple-500/30 transition-all duration-300">
               <div className="mb-4">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Interview Coach</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Prep like you already have the offer</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                AI-generated questions, model answers, and HR email tracking so you never lose the thread.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 border-t border-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Simple, transparent pricing</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
            {/* Free Plan */}
            <div className="bg-[#0B1120] rounded-3xl border border-slate-800 p-8 flex flex-col">
              <div className="mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase">Starter</span>
                <div className="text-4xl font-bold text-white mt-2">Free</div>
                <p className="text-slate-400 text-sm mt-2">Perfect to explore CareerCraft AI</p>
              </div>
              
              <div className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-500 flex-none" />
                  3 AI resume improvements / month
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-500 flex-none" />
                  Basic skills-gap analysis
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-500 flex-none" />
                  Up to 10 job matches
                </li>
              </div>

              <button 
                onClick={onGetStarted}
                className="w-full bg-transparent border border-slate-700 hover:bg-slate-800 text-white font-semibold py-3 rounded-full transition-colors"
              >
                Get started
              </button>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-[#0B1120] rounded-3xl border border-cyan-500/30 p-8 flex flex-col">
              <div className="absolute top-0 right-0 p-8">
                {/* Optional Badge */}
              </div>
              <div className="mb-4">
                <span className="text-xs font-bold text-cyan-400 uppercase">Pro (Demo)</span>
                <div className="text-4xl font-bold text-white mt-2">$19 <span className="text-lg font-medium text-slate-500">/month</span></div>
                <p className="text-slate-400 text-sm mt-2">All features unlocked - billing in demo mode</p>
              </div>
              
              <div className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-white">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-none" />
                  Unlimited AI resume improvements
                </li>
                <li className="flex items-start gap-3 text-sm text-white">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-none" />
                  Advanced market & job insights
                </li>
                <li className="flex items-start gap-3 text-sm text-white">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-none" />
                  Auto-apply & HR email tracking
                </li>
              </div>

              <button 
                onClick={onLogin}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-full transition-colors shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              >
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#020617] border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1 rounded">
              <Star className="w-4 h-4 text-white fill-current" />
            </div>
            <span className="font-bold text-white">CareerCraft AI</span>
          </div>
          <p className="text-slate-500 text-sm">© 2025 CareerCraft AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;