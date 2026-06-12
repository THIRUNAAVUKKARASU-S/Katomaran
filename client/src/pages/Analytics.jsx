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
import { 
  FiArrowLeft, FiActivity, FiGlobe, FiMonitor, FiCalendar, FiClock, FiMapPin
} from 'react-icons/fi';
import VisitorMap from '../components/VisitorMap';

const COLORS = ['#2563EB', '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

const Analytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/analytics/${id}`);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load analytics data');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading charts & datasets...</p>
      </div>
    );
  }

  if (!data) return null;

  const { urlDetails, lastVisit, recentVisits, charts } = data;
  const hasClicks = urlDetails.clicks > 0;

  // Aggregate Geographic Locations for Summary Tables
  const countryCounts = {};
  const cityCounts = {};
  recentVisits.forEach(v => {
    const country = v.country || 'Unknown';
    const city = v.city || 'Unknown';
    countryCounts[country] = (countryCounts[country] || 0) + 1;
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });

  const topCountries = Object.entries(countryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topCities = Object.entries(cityCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className={`p-2.5 rounded-xl border transition-all ${
            theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-100'
          }`}
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Link Analytics</h1>
          <p className="text-xs text-slate-400 truncate max-w-lg">{urlDetails.shortUrl}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Clicks */}
        <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Clicks</span>
            <FiActivity className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-extrabold">{urlDetails.clicks}</div>
          <p className="text-[10px] text-slate-500 mt-2">Aggregated visits logged since creation</p>
        </div>

        {/* Created Date */}
        <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Creation Date</span>
            <FiCalendar className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-lg font-bold">{new Date(urlDetails.createdAt).toLocaleDateString()}</div>
          <p className="text-[10px] text-slate-500 mt-2">
            Time: {new Date(urlDetails.createdAt).toLocaleTimeString()}
          </p>
        </div>

        {/* Last Visit */}
        <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Last Visit</span>
            <FiClock className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-lg font-bold">{lastVisit ? new Date(lastVisit).toLocaleDateString() : 'Never'}</div>
          <p className="text-[10px] text-slate-500 mt-2">
            {lastVisit ? new Date(lastVisit).toLocaleTimeString() : 'Waiting for first click'}
          </p>
        </div>
      </div>

      {/* Target URL Panel */}
      <div className={`p-5 rounded-2xl border ${
        theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
      }`}>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Destination Target</span>
        <a 
          href={urlDetails.originalUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm font-semibold hover:underline text-primary break-all"
        >
          {urlDetails.originalUrl}
        </a>
      </div>

      {!hasClicks ? (
        <div className={`p-12 text-center rounded-2xl border text-slate-400 ${
          theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
        }`}>
          <FiActivity className="w-12 h-12 mx-auto mb-4 opacity-30 text-primary" />
          <h3 className="text-lg font-bold mb-1">No Click Data Yet</h3>
          <p className="text-xs">Share your shortened URL. Once visitors open it, analytics charts will populate here.</p>
        </div>
      ) : (
        <>
          {/* Feature 1: Geographic Visitor Map */}
          <div className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
          }`}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1"><FiGlobe /> Geographic Visitor Distribution Map</h3>
            <VisitorMap visits={recentVisits} />
          </div>

          {/* Geo tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Countries */}
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5"><FiGlobe /> Top Countries</h3>
              <div className="space-y-3">
                {topCountries.map((c, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="font-semibold">{c.name}</span>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{c.count} clicks</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Cities */}
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5"><FiMapPin /> Top Cities</h3>
              <div className="space-y-3">
                {topCities.map((c, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="font-semibold">{c.name}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold">{c.count} clicks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chart: Click Timeline */}
          <div className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
          }`}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6">Click Trends (Last 30 Days)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={charts.clickTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'} />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    stroke={theme === 'dark' ? '#94A3B8' : '#64748B'}
                    style={{ fontSize: '10px' }}
                  />
                  <YAxis 
                    tickLine={false}
                    stroke={theme === 'dark' ? '#94A3B8' : '#64748B'}
                    style={{ fontSize: '10px' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
                      borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                      color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="#2563EB" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorClicks)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut distributions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Devices */}
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <FiMonitor /> Devices
              </h3>
              <div className="h-60 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.deviceDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {charts.deviceDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Browsers */}
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <FiGlobe /> Browsers
              </h3>
              <div className="h-60 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.browserDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {charts.browserDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Operating Systems */}
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <FiMonitor /> OS Systems
              </h3>
              <div className="h-60 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.osDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {charts.osDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Clicks table */}
          <div className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
          }`}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Recent Visits Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-400 uppercase">
                    <th className="pb-3 pr-4">Timestamp</th>
                    <th className="pb-3 px-4">IP Address</th>
                    <th className="pb-3 px-4">Location</th>
                    <th className="pb-3 px-4">Browser</th>
                    <th className="pb-3 px-4">Device</th>
                    <th className="pb-3 pl-4">OS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {recentVisits.map((visit, idx) => (
                    <tr key={visit._id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="py-3 pr-4 text-slate-400">
                        {new Date(visit.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">
                        {visit.ipAddress}
                      </td>
                      <td className="py-3 px-4 font-bold text-primary">
                        {visit.city ? `${visit.city}, ${visit.country}` : visit.country || 'Unknown'}
                      </td>
                      <td className="py-3 px-4">
                        {visit.browser}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                          {visit.device}
                        </span>
                      </td>
                      <td className="py-3 pl-4">
                        {visit.os}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
