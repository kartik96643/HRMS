import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, Lock, Mail, Shield, Users, User } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setErrorLocal('Please enter email and password');
      return;
    }

    setLoadingLocal(true);
    setErrorLocal('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setErrorLocal(err.message || 'Invalid email or password');
    } finally {
      setLoadingLocal(false);
    }
  };

  // Quick fill helper for developers
  const handleQuickLogin = (emailVal, passVal) => {
    setEmail(emailVal);
    setPassword(passVal);
    // Let state update and then run submit in the next microtask or execute directly
    setTimeout(() => {
      const form = document.getElementById('login-form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient light effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Login Container */}
      <div className="w-full max-w-md glass rounded-3xl p-8 shadow-2xl relative z-10 border border-slate-800/80">

        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl shadow-primary-600/30">
            <Building size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">PulseHR Systems</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to manage your workplace portal</p>
        </div>

        {errorLocal && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {errorLocal}
          </div>
        )}

        <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loadingLocal}
            className="w-full bg-primary-600 hover:bg-primary-500 disabled:bg-primary-700/60 text-white font-medium rounded-xl py-3 shadow-lg shadow-primary-600/20 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loadingLocal ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have a company account?{' '}
          <Link to="/#pricing" className="text-primary-400 hover:text-primary-300 font-bold hover:underline transition">
            Register Company
          </Link>
        </p>

        {/* Quick Seeding accounts for review/testing */}
        <div className="mt-8 pt-6 border-t border-slate-800/60">
          <p className="text-center text-xs text-slate-500 font-semibold mb-4 uppercase tracking-wider">
            Quick Sandbox Login
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('admin@hr.com', 'AdminPassword123')}
              className="flex flex-col items-center justify-center p-3 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/60 hover:border-slate-700 rounded-xl text-slate-300 transition duration-150 group"
            >
              <Shield size={16} className="text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold">Admin</span>
            </button>
            <button
              onClick={() => handleQuickLogin('hr@hr.com', 'HRPassword123')}
              className="flex flex-col items-center justify-center p-3 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/60 hover:border-slate-700 rounded-xl text-slate-300 transition duration-150 group"
            >
              <Users size={16} className="text-primary-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold">HR</span>
            </button>
            <button
              onClick={() => handleQuickLogin('employee@hr.com', 'EmployeePassword123')}
              className="flex flex-col items-center justify-center p-3 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/60 hover:border-slate-700 rounded-xl text-slate-300 transition duration-150 group"
            >
              <User size={16} className="text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold">Employee</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
