import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { FiLock, FiUnlock, FiArrowRight } from 'react-icons/fi';

const PasswordGate = () => {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error('Password is required');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`/api/url/verify-password/${shortCode}`, { password });
      toast.success('Access Granted! Redirecting...');
      
      // Perform final destination redirect
      setTimeout(() => {
        window.location.href = res.data.targetUrl;
      }, 800);
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect password, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gradient-mesh-dark text-slate-100' : 'bg-gradient-mesh-light text-slate-800'
    }`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`w-full max-w-md p-8 rounded-3xl shadow-xl border text-center ${
          theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
        }`}
      >
        {/* Glow lock icon */}
        <div className="relative inline-flex mb-6">
          <div className="p-4 bg-primary/10 text-primary rounded-full shadow-lg shadow-primary/5">
            <FiLock className="w-12 h-12" />
          </div>
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10 animate-pulse"></div>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight mb-2">Password Protected Link</h1>
        <p className="text-xs text-slate-400 dark:text-slate-400 mb-8 max-w-xs mx-auto">
          The link owner has encrypted access to this path. Please enter the correct password credentials to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FiLock />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none text-sm transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-700 focus:border-primary text-white'
                  : 'bg-white border-slate-200 focus:border-primary text-slate-950 shadow-sm'
              }`}
              placeholder="Enter link password..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:opacity-95 transition-all shadow-md shadow-primary/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Access Link</span>
                <FiArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default PasswordGate;
