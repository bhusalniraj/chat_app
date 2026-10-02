import React, { useState } from 'react';
import { MessageSquare, Mail, Lock, User, Eye, EyeOff, Sparkles, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { OtpModal } from './OtpModal.jsx';
import { Toast } from '../common/Toast.jsx';

export const AuthModal = () => {
  const { login, register, loginAsDemo } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP flow state
  const [pendingOtp, setPendingOtp] = useState(null);
  const [lockInfo, setLockInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);
    setLoading(true);

    if (isLogin) {
      const res = await login(email, password);
      setLoading(false);
      if (!res.success) {
        if (res.lockUntil) {
          setLockInfo(res.lockUntil);
        }
        setToast({ message: res.message, type: 'error' });
      }
    } else {
      if (username.trim().length < 3) {
        setLoading(false);
        setToast({ message: 'Username must be at least 3 characters', type: 'error' });
        return;
      }
      if (password.length < 6) {
        setLoading(false);
        setToast({ message: 'Password must be at least 6 characters', type: 'error' });
        return;
      }

      const res = await register(username.trim(), email.trim(), password);
      setLoading(false);
      if (res.success) {
        setPendingOtp({ email: res.email, devOtp: res.otp });
        setToast({ message: 'Registration code sent!', type: 'success' });
      } else {
        setToast({ message: res.message, type: 'error' });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {pendingOtp ? (
          <OtpModal
            email={pendingOtp.email}
            devOtp={pendingOtp.devOtp}
            onBack={() => setPendingOtp(null)}
            onSuccess={() => {
              setPendingOtp(null);
              setIsLogin(true);
              setToast({ message: 'Account verified! You can now log in.', type: 'success' });
            }}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
          />
        ) : (
          <div>
            {/* Header Brand */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl shadow-lg shadow-emerald-500/20 mb-3 text-white">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
                Welcome to ChatApp <Sparkles className="w-4 h-4 text-emerald-400" />
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {isLogin ? 'Sign in to access your conversations' : 'Join and chat with anyone in real-time'}
              </p>
            </div>

            {/* Segmented Tab */}
            <div className="flex bg-slate-800/80 p-1 rounded-xl mb-5 border border-slate-700/50">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setToast(null); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  isLogin ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setToast(null); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  !isLogin ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            {lockInfo && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-400" />
                <span>Account locked due to multiple failed attempts. Try again later.</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. alex_rivera"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : isLogin ? (
                  'Sign In'
                ) : (
                  'Continue to Verification'
                )}
              </button>
            </form>

            {/* Quick Demo Mode Button */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-slate-900 px-2 text-slate-500 font-bold tracking-wider">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={loginAsDemo}
              className="w-full bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-emerald-400 font-semibold py-2.5 px-4 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center justify-center gap-2 text-xs shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Frontend in Demo Mode</span>
            </button>

            <div className="mt-5 text-center text-xs text-slate-400">
              {isLogin ? (
                <p>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    Sign up now
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
