"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, AlertTriangle, CheckCircle2, Loader2, X, Ban } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore(state => state.login);
  const router = useRouter();

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError('');
      setIsBlocked(false);
      const response = await api.post('/auth/login', data);
      
      const { token, ...user } = response.data.data;
      login(user, token);
      router.push('/dashboard');
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Failed to login';
      if (status === 403) {
        setIsBlocked(true);
        setError(msg);
      } else {
        setIsBlocked(false);
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      setForgotLoading(true);
      setForgotError('');
      setForgotSuccess('');
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSuccess('OTP verification code has been dispatched to your email.');
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Failed to dispatch password recovery OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim() || !newPassword.trim()) return;
    try {
      setForgotLoading(true);
      setForgotError('');
      setForgotSuccess('');
      await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: newPassword
      });
      setForgotSuccess('Your password has been successfully updated! You can now sign in.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotOtp('');
        setNewPassword('');
        setForgotSuccess('');
      }, 3000);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'OTP verification failed or code has expired.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to your Findora AI account</p>
          </div>

          {error && (
            <div className={`mb-6 p-4 rounded-xl text-sm flex items-start gap-3 border ${
              isBlocked 
                ? 'bg-red-900/20 border-red-500/40 text-red-300' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {isBlocked ? (
                <Ban className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div>
                {isBlocked && <p className="font-bold mb-0.5">Account Blocked</p>}
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-white transition-all outline-none"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotError('');
                    setForgotSuccess('');
                  }}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                {...register('password')}
                type="password"
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-white transition-all outline-none"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              {/* Close button */}
              <button 
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Reset Password</h3>
                  <p className="text-xs text-gray-400">Recover your secure Findora account</p>
                </div>
              </div>

              {forgotError && (
                <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {/* Step 1: Send OTP */}
              {forgotStep === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Provide the email address linked to your account. We will send you a secure 6-digit verification code.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Registered Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                      <input 
                        type="email" 
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                        placeholder="your-email@example.com"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 mt-2"
                  >
                    {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Verification OTP'}
                  </button>
                </form>
              ) : (
                /* Step 2: Verify & Reset */
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    OTP sent to <span className="text-white font-bold">{forgotEmail}</span>. Enter the code and set your new password.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">6-Digit OTP Code</label>
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center text-lg font-bold letter-spacing-5 transition-all"
                      placeholder="000000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">New Password</label>
                    <input 
                      type="password" 
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button 
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition-all"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-[2] py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                    >
                      {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Reset Password'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
