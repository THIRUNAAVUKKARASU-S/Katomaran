import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiArrowRight, FiSun, FiMoon } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center px-4 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gradient-mesh-dark text-slate-100' : 'bg-gradient-mesh-light text-slate-800'
    }`}>
      {/* Theme toggle floating on login screen */}
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 p-3 rounded-xl border transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-slate-800 border-slate-700 text-amber-400'
            : 'bg-white border-slate-200 text-indigo-600 shadow-sm'
        }`}
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-tr from-primary to-secondary rounded-2xl text-white shadow-xl shadow-primary/20 mb-4 transform hover:rotate-12 transition-transform">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            LinkLite
          </h1>
          <p className="text-slate-400 dark:text-slate-400 text-sm">
            Enter your credentials to manage your shortened links.
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className={`p-8 rounded-3xl shadow-xl ${
          theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
        }`}>
          <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiMail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none text-sm transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-900/50 border-slate-700 focus:border-primary-dark focus:ring-1 focus:ring-primary-dark text-white'
                      : 'bg-white border-slate-200 focus:border-primary-light focus:ring-1 focus:ring-primary-light text-slate-900'
                  }`}
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiLock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none text-sm transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-900/50 border-slate-700 focus:border-primary-dark focus:ring-1 focus:ring-primary-dark text-white'
                      : 'bg-white border-slate-200 focus:border-primary-light focus:ring-1 focus:ring-primary-light text-slate-900'
                  }`}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:opacity-95 transition-opacity shadow-lg shadow-primary/20 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-primary hover:text-secondary transition-colors"
              >
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
