import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { FiKey, FiPlus, FiTrash2, FiCopy, FiCheck, FiInfo, FiTerminal } from 'react-icons/fi';

const APIKeys = () => {
  const { theme } = useTheme();

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyName, setKeyName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null); // hold raw key on first display

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/apikey');
      setKeys(res.data);
    } catch (err) {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setGenerating(true);
    try {
      const res = await axios.post('/api/apikey/generate', { name: keyName.trim() });
      toast.success('API Key generated successfully!');
      setKeyName('');
      setNewlyCreatedKey(res.data);
      fetchKeys();
    } catch (err) {
      toast.error('Failed to generate API key');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this API key? Applications using it will immediately lose access.')) return;
    try {
      await axios.delete(`/api/apikey/revoke/${id}`);
      toast.success('API key revoked successfully');
      setKeys(keys.filter(k => k._id !== id));
    } catch (err) {
      toast.error('Failed to revoke API key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Developer API Keys</h1>
        <p className="text-sm text-slate-400">Integrate LinkLite shorteners directly into your custom applications using standard headers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <FiPlus /> Generate API Key
            </h3>
            <form onSubmit={handleGenerate} className="space-y-3">
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Production Key, Testing Key..."
                className={`w-full px-4 py-2.5 rounded-xl border outline-none text-xs ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-950'
                }`}
                required
              />
              <button
                type="submit"
                disabled={generating}
                className="w-full py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-xs hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate New Key'}
              </button>
            </form>
          </div>

          {/* Quick Docs */}
          <div className={`p-6 rounded-2xl border text-xs text-slate-400 space-y-3 ${
            theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
          }`}>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1"><FiTerminal /> Quick Start</h4>
            <p>Send an authorized POST request containing your active key in the header:</p>
            <div className="p-3 bg-slate-900 rounded-lg text-rose-400 font-mono text-[10px] select-all overflow-x-auto">
              curl -X POST http://localhost:5050/api/v1/shorten \<br />
              &nbsp;&nbsp;-H "x-api-key: YOUR_KEY" \<br />
              &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
              &nbsp;&nbsp;-d '&#123;"originalUrl": "https://example.com"&#125;'
            </div>
            <p className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
              <FiInfo className="flex-shrink-0" />
              Keep API secrets confidential.
            </p>
          </div>
        </div>

        {/* API Keys List */}
        <div className="lg:col-span-2 space-y-6">
          {/* First-time generated display */}
          <AnimatePresence>
            {newlyCreatedKey && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-sm">Key Generated Successfully!</h4>
                  <button onClick={() => setNewlyCreatedKey(null)} className="text-slate-400 hover:text-slate-200">
                    <span className="sr-only">Dismiss</span>
                    &times;
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mb-3">
                  Copy this key now. It will not be shown again.
                </p>
                <div className="flex items-center justify-between p-3 bg-emerald-500/5 dark:bg-black/40 rounded-xl border border-emerald-500/20 font-mono text-xs select-all break-all pr-12 relative">
                  <span>{newlyCreatedKey.key}</span>
                  <button
                    onClick={() => copyToClipboard(newlyCreatedKey.key)}
                    className="absolute right-3 top-2.5 p-1.5 hover:bg-emerald-500/25 rounded-lg text-emerald-400"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Keys List */}
          <div className={`p-6 sm:p-8 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-1.5">
              <FiKey /> Active Access Keys
            </h3>

            {loading ? (
              <p className="text-xs text-slate-500">Fetching developer credentials...</p>
            ) : keys.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <FiKey className="w-10 h-10 mx-auto mb-3 opacity-30 text-primary" />
                <p className="text-xs">No developer API keys created yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {keys.map(key => (
                  <div 
                    key={key._id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/50 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-all gap-4"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{key.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-md">
                          ll_••••••••{key.key.substring(key.key.length - 8)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Created {new Date(key.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Usages</p>
                        <p className="text-sm font-bold text-primary">{key.usageCount}</p>
                      </div>

                      <button
                        onClick={() => handleRevoke(key._id)}
                        className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Revoke Key"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIKeys;
