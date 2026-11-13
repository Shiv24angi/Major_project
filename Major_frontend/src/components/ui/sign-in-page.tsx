'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, ShieldCheck, Zap, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getRouteParams, navigateTo } from '@/shared/preset-site-routing';
import { toast } from 'sonner';

export interface LoginPageProps {
  imageSrc?: string;
  defaultSignUp?: boolean;
}

export function LoginPage({
  imageSrc = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
  defaultSignUp = false,
}: LoginPageProps) {
  let navigate: ((path: string) => void) | null = null;
  try {
    navigate = useNavigate();
  } catch (e) {
    // Falls back to hash router navigateTo if rendered outside BrowserRouter
  }

  const {
    user,
    profile,
    isAuthenticated,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    loginAsDemoUser,
  } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(defaultSignUp);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const routeParams = getRouteParams();
  const targetRedirect = routeParams.redirect || 'new-analysis';

  const handleGo = (path: string) => {
    const clean = path.replace(/^\//, '');
    navigateTo(clean);
    if (navigate) {
      navigate(path);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Google OAuth flow
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setOauthLoading('google');
    try {
      const { error } = await signInWithGoogle(targetRedirect);
      if (error) {
        console.warn('Google OAuth error:', error);
        const msg = error.message?.includes('provider is not enabled')
          ? 'Google OAuth provider is not yet activated in your Supabase dashboard. Please enable Google in Supabase -> Authentication -> Providers with your Client ID & Secret, or use Email sign in / Quick Demo Access.'
          : error.message || 'Failed to initialize Google Sign In.';
        setErrorMessage(msg);
        toast.error('Google Sign In: ' + (error.message || 'Configuration required'));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google OAuth error');
    } finally {
      setOauthLoading(null);
    }
  };

  // GitHub OAuth flow
  const handleGithubSignIn = async () => {
    setErrorMessage(null);
    setOauthLoading('github');
    try {
      const { error } = await signInWithGithub(targetRedirect);
      if (error) {
        console.warn('GitHub OAuth error:', error);
        const msg = error.message?.includes('provider is not enabled')
          ? 'GitHub OAuth provider is not yet activated in your Supabase dashboard. Please enable GitHub in Supabase -> Authentication -> Providers with your Client ID & Secret, or use Email sign in / Quick Demo Access.'
          : error.message || 'Failed to initialize GitHub Sign In.';
        setErrorMessage(msg);
        toast.error('GitHub Sign In: ' + (error.message || 'Configuration required'));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'GitHub OAuth error');
    } finally {
      setOauthLoading(null);
    }
  };

  // Email/Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.email || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(formData.email, formData.password, fullName);
        if (error) {
          setErrorMessage(error.message);
          toast.error(error.message);
        } else {
          toast.success('Account created successfully!');
          handleGo(targetRedirect);
        }
      } else {
        const { error } = await signInWithEmail(formData.email, formData.password);
        if (error) {
          setErrorMessage(error.message);
          toast.error(error.message);
        } else {
          toast.success('Signed in successfully!');
          handleGo(targetRedirect);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  // Stagger animation container variants
  const formContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const formItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex overflow-hidden selection:bg-black selection:text-white"
    >
      {/* Left Panel - Image Section with smooth parallax entrance */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:flex flex-1 relative overflow-hidden"
      >
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="absolute top-6 left-6 z-20"
        >
          <motion.button
            type="button"
            onClick={() => handleGo('/')}
            whileHover={{ scale: 1.08, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 cursor-pointer shadow-lg transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
        </motion.div>

        {/* Brand Overlay Content */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-black/35 to-black/30 flex flex-col justify-end p-12 text-white"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md mb-4 w-fit">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>AI-POWERED DUE DILIGENCE</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3">
            VentureLens Intelligence
          </h2>
          <p className="text-sm lg:text-base text-white/80 max-w-md leading-relaxed">
            Automated multi-agent startup evaluations, financial validation, code intelligence, and due diligence dossiers.
          </p>
        </motion.div>

        {/* Visual Media with smooth cinematic scale */}
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <img
            src={imageSrc}
            alt="VentureLens Diligence Portal"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </motion.div>

      {/* Right Panel - Form Section with soft slide entrance */}
      <motion.div
        initial={{ opacity: 0, x: 25 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex items-center justify-center bg-white px-6 py-8 overflow-y-auto"
      >
        <div className="w-full max-w-md p-6 md:p-8">
          {/* Mobile Back Button */}
          <div className="md:hidden mb-4">
            <button
              type="button"
              onClick={() => handleGo('/')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black py-1 px-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          </div>

          {/* If already authenticated, show status card */}
          {isAuthenticated && user ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-6"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Signed in as</h2>
              <p className="text-sm font-semibold text-gray-700">{profile?.name || user.email}</p>
              <p className="text-xs text-gray-500 mb-6">{user.email}</p>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleGo(targetRedirect)}
                  className="w-full bg-black text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-800 transition-colors cursor-pointer shadow-md"
                >
                  Continue to Analysis Workflow
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={async () => {
                    await signOut();
                    toast.info('Signed out successfully');
                  }}
                  className="w-full border border-gray-300 text-gray-700 py-2.5 px-4 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Sign Out
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={formContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Header */}
              <motion.div variants={formItemVariants} className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {isSignUp ? 'Create an Account' : 'Welcome Back'}
                </h1>
                <p className="text-gray-600 text-sm">
                  {isSignUp ? (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(false);
                          setErrorMessage(null);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors"
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(true);
                          setErrorMessage(null);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </p>
              </motion.div>

              {/* Error Notice */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <p className="font-semibold">Notice</p>
                        <p className="text-rose-700 mt-0.5">{errorMessage}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name for Sign Up with smooth expand/collapse */}
                <AnimatePresence>
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -6 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -6 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alex Mercer"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                        required
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <motion.div variants={formItemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@fund.com or name@startup.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                    required
                  />
                </motion.div>

                {/* Password */}
                <motion.div variants={formItemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full cursor-pointer text-gray-500 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-500" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Remember Me + Forgot Password */}
                <motion.div variants={formItemVariants} className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => toast.info('Password reset instructions will be sent to your email.')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer transition-colors"
                  >
                    Forgot password?
                  </button>
                </motion.div>

                {/* Submit */}
                <motion.div variants={formItemVariants}>
                  <motion.button
                    whileHover={{ scale: 1.01, backgroundColor: '#1f2937' }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={loading || !!oauthLoading}
                    className="w-full bg-black text-white py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-60 cursor-pointer shadow-md mt-2 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : isSignUp ? (
                      'Create Account'
                    ) : (
                      'Sign In'
                    )}
                  </motion.button>
                </motion.div>

                {/* Divider */}
                <motion.div variants={formItemVariants} className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </motion.div>

                {/* Social Buttons */}
                <motion.div variants={formItemVariants} className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.015, backgroundColor: '#f9fafb' }}
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={!!oauthLoading || loading}
                    className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-xl transition-all disabled:opacity-60 cursor-pointer shadow-xs bg-white"
                  >
                    {oauthLoading === 'google' ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent mr-2" />
                    ) : (
                      /* Google SVG */
                      <svg className="w-5 h-5 mr-2 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                      Google
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.015, backgroundColor: '#f9fafb' }}
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={handleGithubSignIn}
                    disabled={!!oauthLoading || loading}
                    className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-xl transition-all disabled:opacity-60 cursor-pointer shadow-xs bg-white"
                  >
                    {oauthLoading === 'github' ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent mr-2" />
                    ) : (
                      /* GitHub SVG */
                      <svg className="w-5 h-5 mr-2 fill-[#24292f] shrink-0" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    )}
                    <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                      GitHub
                    </span>
                  </motion.button>
                </motion.div>

                {/* Quick Test Demo Options */}
                <motion.div variants={formItemVariants} className="pt-4 mt-4 border-t border-gray-200 text-center">
                  <p className="text-[11px] text-gray-500 mb-2">
                    Instant test mode (bypass keys in dev):
                  </p>
                  <div className="flex gap-2 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => loginAsDemoUser('investor')}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span>Investor Demo</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => loginAsDemoUser('founder')}
                      className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3 text-purple-500" />
                      <span>Founder Demo</span>
                    </motion.button>
                  </div>
                </motion.div>
              </form>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default LoginPage;
