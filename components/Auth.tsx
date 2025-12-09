import React, { useState } from 'react';
import { ArrowRight, Github, Chrome, Command } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, Card } from './ui/DesignSystem';

interface AuthProps {
  onComplete: (user: { name: string; email: string }) => void;
  initialMode?: 'login' | 'signup';
}

const Auth: React.FC<AuthProps> = ({ onComplete, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
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
        email: email
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl mb-6">
            <Command className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-zinc-500 mt-2 text-sm">
            {mode === 'login' ? 'Enter your details to access your workspace.' : 'Start your career optimization journey today.'}
          </p>
        </div>

        <Card className="border-zinc-800 shadow-2xl bg-zinc-900/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Email</label>
              <Input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="bg-zinc-950/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Password</label>
              <Input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-zinc-950/50"
              />
            </div>

            <Button 
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={loading}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500 font-medium">Or continue with</span>
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

        <p className="mt-8 text-center text-sm text-zinc-500">
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-zinc-200 font-medium hover:underline hover:text-white transition-colors"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;