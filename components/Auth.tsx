import React, { useState } from 'react';
import { ArrowRight, Github, Chrome, Command, Briefcase, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, Card } from './ui/DesignSystem';
import { UserRole } from '../types';

interface AuthProps {
  onComplete: (user: { name: string; email: string; role: UserRole }) => void;
  initialMode?: 'login' | 'signup';
}

const Auth: React.FC<AuthProps> = ({ onComplete, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [role, setRole] = useState<UserRole>('candidate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onComplete({
        name: email.split('@')[0],
        email: email,
        role: role
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 paper-pattern">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 shadow-lg shadow-brand-600/20 mb-6">
            <Command className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            {mode === 'login' ? 'Enter your details to access your workspace.' : 'Start your journey today.'}
          </p>
        </div>

        <Card className="shadow-xl shadow-slate-200/50 p-8 border-slate-200">
          {/* Role Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setRole('candidate')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${
                role === 'candidate' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <User className="w-4 h-4" /> Candidate
            </button>
            <button
              type="button"
              onClick={() => setRole('employer')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${
                role === 'employer' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Employer
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {role === 'employer' ? 'Work Email' : 'Email Address'}
              </label>
              <Input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'employer' ? "recruiter@company.com" : "name@example.com"}
                className="bg-slate-50 border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
              <Input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-50 border-slate-300"
              />
            </div>

            <Button 
              type="submit"
              variant={role === 'employer' ? 'primary' : 'primary'} // Could change color based on role if desired
              className={`w-full ${role === 'employer' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20' : ''}`}
              isLoading={loading}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full gap-2">
                <Github className="w-4 h-4" /> GitHub
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <Chrome className="w-4 h-4" /> Google
              </Button>
            </div>
          </div>
        </Card>

        <p className="mt-8 text-center text-sm text-slate-500">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className={`font-bold hover:underline ${role === 'employer' ? 'text-purple-600' : 'text-brand-600'}`}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;