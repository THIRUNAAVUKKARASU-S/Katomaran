import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { FiArrowLeft, FiActivity, FiGlobe, FiMonitor, FiCalendar, FiClock, FiAlertCircle } from 'react-icons/fi';
import VisitorMap from '../components/VisitorMap';

const COLORS = ['#2563EB', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

const PublicAnalytics = () => {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetchPublicAnalytics();
  }, [shortCode]);

  const fetchPublicAnalytics = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/public/analytics/${shortCode}`);
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setForbidden(true);
      } else {
        toast.error('Failed to load analytics. Link may not exist.');
        navigate('/not-found');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs">Loading shared dashboard...</p>
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gradient-mesh-dark text-slate-100' : 'bg-gradient-mesh-light text-slate-800'
      }`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-md p-8 text-center rounded-3xl shadow-xl border ${
            theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
          }`}
        >
          <div className="relative inline-flex mb-6">
            <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full shadow-lg">
              <FiAlertCircle className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">Private Analytics</h1>
          <p className="text-xs text-slate-400 mb-8 max-w-xs mx-auto">
            The owner has restricted statistics sharing for this link. Public credentials access is disabled.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm"
          >
            Go to Portal
          </button>
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  const { urlDetails, lastVisit, charts } = data;
  const hasClicks = urlDetails.clicks > 0;

  return (
    <div className={`min-h-screen p-6 sm:p-8 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gradient-mesh-dark text-slate-100' : 'bg-gradient-mesh-light text-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-slate-200/40 dark:border-slate-800/40 pb-6">
          <button
            onClick={() => navigate('/login')}
            className={`p-2.5 rounded-xl border transition-all ${
              theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-100'
            }`}
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Public Link Report</h1>
            <p className="text-xs text-slate-400 truncate max-w-lg">{urlDetails.shortUrl}</p>
          </div>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Total clicks</span>
            <div className="text-3xl font-extrabold text-primary">{urlDetails.clicks}</div>
          </div>
          <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Created</span>
            <div className="text-sm font-semibold">{new Date(urlDetails.createdAt).toLocaleDateString()}</div>
          </div>
          <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Last Visit</span>
            <div className="text-sm font-semibold">{lastVisit ? new Date(lastVisit).toLocaleString() : 'Never'}</div>
          </div>
        </div>

        {!hasClicks ? (
          <div className={`p-12 text-center rounded-2xl border text-slate-400 ${
            theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
          }`}>
            <FiActivity className="w-12 h-12 mx-auto mb-4 opacity-30 text-primary" />
            <h3 className="text-lg font-bold mb-1">No clicks recorded yet</h3>
            <p className="text-xs">Once visitors follow the link, metrics will compile automatically.</p>
          </div>
        ) : (
          <>
            {/* click timeline */}
            <div className={`p-6 rounded-2xl border ${
              theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
            }`}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6">Click timelines</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.clickTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'} />
                    <XAxis dataKey="date" stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} style={{ fontSize: '10px' }} />
                    <YAxis stroke={theme === 'dark' ? '#94A3B8' : '#64748B'} style={{ fontSize: '10px' }} allowDecimals={false} />
                    <Tooltip contentStyle={{
                      backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
                      borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }} />
                    <Area type="monotone" dataKey="clicks" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* distributions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['deviceDist', 'browserDist', 'osDist'].map((distName, i) => {
                const labels = ['Devices', 'Browsers', 'OS Systems'];
                const icons = [FiMonitor, FiGlobe, FiMonitor];
                const Icon = icons[i];
                return (
                  <div key={i} className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                      <Icon /> {labels[i]}
                    </h3>
                    <div className="h-60 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={charts[distName]}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {charts[distName].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicAnalytics;
