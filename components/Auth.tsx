import React, { useState } from 'react';
import { ArrowRight, Github, Chrome, Command, Briefcase, User, AlertCircle, ArrowLeft, CheckCircle, KeyRound, Mail, Info, Smartphone, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Input, Card } from './ui/DesignSystem';
import { UserRole } from '../types';
import { supabase, supabaseUrl } from '../lib/supabaseClient';

interface AuthProps {
  onComplete: (user: { name: string; email: string; role: UserRole; id: string; phone?: string; address?: string }) => void;
  initialMode?: 'login' | 'signup';
}

type AuthMethod = 'email_password' | 'email_otp' | 'phone_otp';
type AuthStep = 'credentials' | 'verification';

const Auth: React.FC<AuthProps> = ({ onComplete, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>(initialMode);
  const [method, setMethod] = useState<AuthMethod>('email_password');
  const [step, setStep] = useState<AuthStep>('credentials');
  const [role, setRole] = useState<UserRole>('candidate');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Check if we are running on the demo project where social/phone auth is disabled
  const isDemoProject = supabaseUrl.includes('wkwqxlirhzaeocpzakov');

  const handleRateLimitError = (error: any) => {
    const msg = error?.message?.toLowerCase() || '';
    if (
      error?.status === 429 || 
      msg.includes("rate limit") || 
      msg.includes("sending recovery email") || 
      msg.includes("too many requests") ||
      msg.includes("security purposes")
    ) {
      return new Error("Service is busy (Rate Limit). Please wait 60 seconds before trying again.");
    }
    return error;
  };

  const processUserSession = async (session: any) => {
     if (session?.user) {
        // If signing up, we might need to update metadata if it wasn't passed during OTP init
        if (mode === 'signup' && (name || role)) {
            await supabase.auth.updateUser({
                data: { full_name: name, role: role, address: address }
            });
        }
        
        // Fetch fresh user data to ensure metadata is present
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            onComplete({
              name: user.user_metadata.full_name || email.split('@')[0] || 'User',
              email: user.email || email,
              role: (user.user_metadata.role as UserRole) || role || 'candidate',
              id: user.id,
              phone: user.phone || phone,
              address: user.user_metadata.address || address
            });
        }
     }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
        if (method === 'phone_otp') {
            if (isDemoProject) throw new Error("Phone Auth is disabled in the demo. Please use Email/Password.");
            if (!phone) throw new Error("Phone number is required.");
            
            const { error } = await supabase.auth.signInWithOtp({
                phone: phone,
            });
            if (error) throw error;
            
            setMessage(`Code sent to ${phone}`);
            setStep('verification');

        } else if (method === 'email_otp') {
            if (!email) throw new Error("Email is required.");

            const { error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    shouldCreateUser: mode === 'signup',
                    data: { full_name: name, role: role, address: address }
                }
            });
            if (error) throw error;

            setMessage(`Code sent to ${email}`);
            setStep('verification');
        }
    } catch (err: any) {
        setError(handleRateLimitError(err).message);
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
          let result;
          
          if (method === 'phone_otp') {
            result = await supabase.auth.verifyOtp({
              phone,
              token: otpCode,
              type: 'sms'
            });
          } else {
            result = await supabase.auth.verifyOtp({
              email,
              token: otpCode,
              type: 'email'
            });
          }

          const { data, error } = result;

          if (error) throw error;
          await processUserSession(data.session);

      } catch (err: any) {
          setError(err.message || "Invalid code");
      } finally {
          setLoading(false);
      }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const cleanEmail = email.trim();
      
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: name,
              role: role,
              phone: phone,
              address: address
            }
          }
        });

        if (error) throw handleRateLimitError(error);
        
        // If session exists, they are logged in. If not, check email.
        if (data.session) {
             await processUserSession(data.session);
        } else {
             // If User ID exists but no session, verification is required
             if (data.user) {
                 // Check if it's an OTP flow disguised as signup (if Supabase is set to send code)
                 // For now, assume standard link unless we want to force OTP entry
                 setMessage("Account created! Please check your email. If you received a code, you can login with OTP.");
             }
        }
        
      } else if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (error) throw error;
        await processUserSession(data.session);
      } else if (mode === 'forgot_password') {
          // Legacy forgot password link flow
          const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
             redirectTo: window.location.origin,
          });
          if (error) throw handleRateLimitError(error);
          setMessage("Reset link sent to your email.");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    setLoading(true);
    setError(null);

    if (isDemoProject) {
        setLoading(false);
        setError(`Social login is not enabled in the demo project.`);
        return;
    }

    localStorage.setItem('carrerx_pending_role', role);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        },
      });
      
      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      localStorage.removeItem('carrerx_pending_role');
    }
  };

  const renderRoleSelection = () => (
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
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 paper-pattern">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md my-8" 
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 shadow-lg shadow-brand-600/20 mb-6">
            <Command className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            {step === 'verification' ? 'Enter Code' : 
             mode === 'login' ? 'Welcome back' : 
             mode === 'signup' ? 'Create your account' : 'Reset Password'}
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
             {step === 'verification' ? `We sent a 6-digit code to your ${method === 'phone_otp' ? 'phone' : 'email'}.` :
             'Access your career workspace.'}
          </p>
        </div>

        <Card className="shadow-xl shadow-slate-200/50 p-8 border-slate-200">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-600 text-sm animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-none" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-700 text-sm animate-in slide-in-from-top-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-none" />
              <span>{message}</span>
            </div>
          )}

          {step === 'verification' ? (
              // --- VERIFICATION STEP (OTP) ---
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Verification Code</label>
                      <Input 
                        type="text" 
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="bg-slate-50 border-slate-300 text-center text-lg tracking-widest"
                        maxLength={6}
                        autoFocus
                      />
                  </div>
                  <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
                      Verify & Continue
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('credentials')}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
              </form>
          ) : (
              // --- CREDENTIALS STEP ---
              <>
                 {/* Authentication Method Tabs */}
                 {mode !== 'forgot_password' && (
                     <div className="grid grid-cols-3 gap-2 mb-6">
                        <button
                          type="button"
                          onClick={() => setMethod('email_password')}
                          className={`py-2 text-xs font-semibold rounded-lg border transition-all ${method === 'email_password' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                        >
                          Password
                        </button>
                        <button
                          type="button"
                          onClick={() => setMethod('email_otp')}
                          className={`py-2 text-xs font-semibold rounded-lg border transition-all ${method === 'email_otp' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                        >
                          Email OTP
                        </button>
                        <button
                          type="button"
                          onClick={() => setMethod('phone_otp')}
                          className={`py-2 text-xs font-semibold rounded-lg border transition-all ${method === 'phone_otp' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                        >
                          Phone
                        </button>
                     </div>
                 )}

                 {renderRoleSelection()}

                 <form onSubmit={method === 'email_password' ? handlePasswordAuth : handleSendOtp} className="space-y-4">
                    {mode === 'signup' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                        <Input 
                          type="text" 
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="bg-slate-50 border-slate-300"
                        />
                      </div>
                    )}

                    {/* Dynamic Inputs based on Method */}
                    {method === 'phone_otp' ? (
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Phone Number</label>
                         <div className="relative">
                            <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <Input 
                              type="tel" 
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+1 555 000 0000"
                              className="pl-10 bg-slate-50 border-slate-300"
                            />
                         </div>
                       </div>
                    ) : (
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                         <div className="relative">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <Input 
                              type="email" 
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder={role === 'employer' ? "recruiter@company.com" : "name@example.com"}
                              className="pl-10 bg-slate-50 border-slate-300"
                            />
                         </div>
                       </div>
                    )}

                    {mode === 'signup' && method !== 'email_otp' && (
                       // For Signup, we might ask for address. For OTP flows it's optional but good to have if user exists
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Address (Optional)</label>
                         <Input 
                           type="text" 
                           value={address}
                           onChange={(e) => setAddress(e.target.value)}
                           placeholder="City, Country"
                           className="bg-slate-50 border-slate-300"
                         />
                       </div>
                    )}

                    {/* Password Input (Only for Email/Password method) */}
                    {method === 'email_password' && mode !== 'forgot_password' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
                          {mode === 'login' && (
                            <button 
                              type="button" 
                              onClick={() => { setMode('forgot_password'); setError(null); setMessage(null); }}
                              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>
                        <Input 
                          type="password" 
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="bg-slate-50 border-slate-300"
                        />
                      </div>
                    )}

                    <Button 
                      type="submit"
                      variant="primary" 
                      className={`w-full ${role === 'employer' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                      isLoading={loading}
                    >
                      {method !== 'email_password' ? 'Send Verification Code' : 
                       mode === 'login' ? 'Sign In' : 
                       mode === 'signup' ? 'Create Account' : 'Send Reset Link'} 
                      {method !== 'email_password' ? <MessageSquare className="w-4 h-4 ml-2" /> :
                       mode === 'forgot_password' ? <KeyRound className="w-4 h-4 ml-2" /> :
                       <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>

                    {mode === 'forgot_password' && (
                      <Button 
                        type="button"
                        variant="ghost"
                        className="w-full mt-2"
                        onClick={() => { setMode('login'); setMethod('email_password'); setError(null); setMessage(null); }}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                      </Button>
                    )}
                 </form>

                 {/* Social Logins */}
                 {mode !== 'forgot_password' && (
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
                        <Button type="button" variant="outline" className="w-full gap-2" onClick={() => handleSocialLogin('github')}>
                          <Github className="w-4 h-4" /> GitHub
                        </Button>
                        <Button type="button" variant="outline" className="w-full gap-2" onClick={() => handleSocialLogin('google')}>
                          <Chrome className="w-4 h-4" /> Google
                        </Button>
                      </div>
                    </div>
                 )}
              </>
          )}
        </Card>

        {step === 'credentials' && (mode === 'login' || mode === 'signup') && (
          <p className="mt-8 text-center text-sm text-slate-500 pb-8">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError(null);
                  setMessage(null);
                  setMethod('email_password');
              }}
              className={`font-bold hover:underline ${role === 'employer' ? 'text-purple-600' : 'text-brand-600'}`}
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;