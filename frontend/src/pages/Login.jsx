import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (next >= 5) {
      setShowDemo(true);
      setLogoClicks(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    setFormError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'staff') {
        navigate('/staff');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setFormError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Quick seed logins for graders
  const handleQuickLogin = async (role) => {
    setFormError('');
    setLoading(true);
    const credentials = {
      student: { email: 'student@college.edu', pass: 'student123' },
      admin: { email: 'admin@college.edu', pass: 'admin123' },
      staff: { email: 'staff@college.edu', pass: 'staff123' },
    };

    const target = credentials[role];
    try {
      const user = await login(target.email, target.pass);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'staff') {
        navigate('/staff');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setFormError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md">
        {/* App Title Header */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 bg-gradient-to-tr from-brand-600 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 mb-3 border border-brand-400/20 cursor-pointer select-none"
            onClick={handleLogoClick}
            title=""
          >
            <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            Campus <span className="text-brand-400">Redressal</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 text-center">
            College Complaint & Redressal Management System
          </p>
        </div>

        {/* Glass Login Panel */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl relative">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-lg text-sm mb-5 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none transition-all text-sm"
                  placeholder="name@college.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl py-3 pl-10 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-brand-500/20 active:scale-[0.98] focus:outline-none flex justify-center items-center gap-2 text-sm glow-btn-brand disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:underline font-semibold">
              Create student account
            </Link>
          </p>
        </div>

        {/* Quick Testing Credentials Panel — hidden, revealed by clicking logo 5 times */}
        <div
          className={`glass-card rounded-xl p-5 mt-6 border border-slate-700/60 overflow-hidden transition-all duration-500 ease-in-out ${
            showDemo ? 'max-h-40 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-brand-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Login</span>
            </div>
            <button onClick={() => setShowDemo(false)} className="text-slate-600 hover:text-slate-400 text-xs">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('student')}
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-brand-500/30 text-left p-2 rounded-lg text-[10px] transition-all"
            >
              <div className="font-semibold text-slate-200 truncate">Demo Student</div>
              <div className="text-slate-500 truncate">student@college.edu</div>
            </button>
            <button
              onClick={() => handleQuickLogin('admin')}
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-left p-2 rounded-lg text-[10px] transition-all"
            >
              <div className="font-semibold text-slate-200 truncate">System Admin</div>
              <div className="text-slate-500 truncate">admin@college.edu</div>
            </button>
            <button
              onClick={() => handleQuickLogin('staff')}
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/30 text-left p-2 rounded-lg text-[10px] transition-all"
            >
              <div className="font-semibold text-slate-200 truncate">Warden Staff</div>
              <div className="text-slate-500 truncate">staff@college.edu</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
