import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { FiAlertCircle, FiArrowLeft, FiPlus } from 'react-icons/fi';

const LinkExpired = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gradient-mesh-dark text-slate-100' : 'bg-gradient-mesh-light text-slate-800'
    }`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`w-full max-w-md p-8 text-center rounded-3xl shadow-xl border ${
          theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
        }`}
      >
        {/* Warning Icon with pulse */}
        <div className="relative inline-flex mb-6">
          <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full shadow-lg shadow-rose-500/5">
            <FiAlertCircle className="w-12 h-12" />
          </div>
          <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full -z-10 animate-pulse"></div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-3">Link Expired</h1>
        <p className="text-sm text-slate-400 dark:text-slate-400 mb-8 max-w-sm mx-auto">
          The link you are trying to access has reached its expiration date set by the owner and is no longer available.
        </p>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:opacity-95 transition-opacity shadow-lg shadow-primary/20"
          >
            <FiPlus className="w-4 h-4" />
            <span>Create Your Own Short Links</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className={`w-full flex items-center justify-center space-x-2 py-3 text-sm font-semibold rounded-xl border transition-all ${
              theme === 'dark'
                ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LinkExpired;
