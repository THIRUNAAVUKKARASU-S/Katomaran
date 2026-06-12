import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  FiLink, FiCopy, FiBarChart2, FiTrash2, FiEdit2, FiExternalLink, 
  FiSearch, FiClock, FiPlus, FiGrid, FiActivity, FiX, FiDownload, 
  FiLock, FiShare2, FiShield, FiTag, FiCpu, FiCompass, FiFileText, FiList
} from 'react-icons/fi';

const Dashboard = () => {
  const { theme } = useTheme();
  const { activeWorkspace } = useAuth();
  const navigate = useNavigate();

  // Core Lists State
  const [urls, setUrls] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Creation Accordion toggles
  const [showUtm, setShowUtm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSmartRedirects, setShowSmartRedirects] = useState(false);

  // Link Creation Fields
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiryType, setExpiryType] = useState('none');
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [password, setPassword] = useState('');

  // UTM parameters fields
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');

  // Smart Redirections fields
  const [mobileUrl, setMobileUrl] = useState('');
  const [tabletUrl, setTabletUrl] = useState('');
  const [desktopUrl, setDesktopUrl] = useState('');
  const [countryRules, setCountryRules] = useState([]); // Array of { country: '', url: '' }
  const [tempCountry, setTempCountry] = useState('');
  const [tempCountryUrl, setTempCountryUrl] = useState('');

  const [creating, setCreating] = useState(false);

  // Action Modals State
  const [activeQrUrl, setActiveQrUrl] = useState(null);
  const [activeDeleteId, setActiveDeleteId] = useState(null);
  
  // Edit State
  const [activeEditUrl, setActiveEditUrl] = useState(null);
  const [editOriginalUrl, setEditOriginalUrl] = useState('');
  const [editCustomAlias, setEditCustomAlias] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [activeWorkspace]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const wsParam = activeWorkspace ? `?workspaceId=${activeWorkspace._id}` : '';
      const urlsRes = await axios.get(`/api/url/all${wsParam}`);
      setUrls(urlsRes.data);

      const actRes = await axios.get('/api/user/activities');
      setActivities(actRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const addCountryRule = () => {
    if (!tempCountry || !tempCountryUrl) {
      toast.error('Country code and redirect URL are required');
      return;
    }
    const cleanCode = tempCountry.trim().toUpperCase();
    if (cleanCode.length !== 2) {
      toast.error('Country must be a 2-letter code (e.g. US, IN, GB)');
      return;
    }
    setCountryRules([...countryRules, { country: cleanCode, url: tempCountryUrl.trim() }]);
    setTempCountry('');
    setTempCountryUrl('');
  };

  const removeCountryRule = (idx) => {
    setCountryRules(countryRules.filter((_, i) => i !== idx));
  };

  // Form submit shortening URL
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!originalUrl) {
      toast.error('Destination URL is required');
      return;
    }

    setCreating(true);
    try {
      // 1. Build UTM query string if UTM parameters are configured
      let finalUrl = originalUrl.trim();
      const utmParams = [];
      if (utmSource) utmParams.push(`utm_source=${encodeURIComponent(utmSource.trim())}`);
      if (utmMedium) utmParams.push(`utm_medium=${encodeURIComponent(utmMedium.trim())}`);
      if (utmCampaign) utmParams.push(`utm_campaign=${encodeURIComponent(utmCampaign.trim())}`);
      if (utmTerm) utmParams.push(`utm_term=${encodeURIComponent(utmTerm.trim())}`);
      if (utmContent) utmParams.push(`utm_content=${encodeURIComponent(utmContent.trim())}`);
      
      if (utmParams.length > 0) {
        const joinChar = finalUrl.includes('?') ? '&' : '?';
        finalUrl += joinChar + utmParams.join('&');
      }

      // 2. Parse Expirations
      let expiryDays = null;
      let finalExpiryDate = null;
      if (expiryType === '1') expiryDays = 1;
      else if (expiryType === '7') expiryDays = 7;
      else if (expiryType === '30') expiryDays = 30;
      else if (expiryType === 'custom') finalExpiryDate = customExpiryDate;

      // 3. Smart Redirects payload
      const smartRedirects = {
        devices: {
          mobile: mobileUrl ? mobileUrl.trim() : null,
          tablet: tabletUrl ? tabletUrl.trim() : null,
          desktop: desktopUrl ? desktopUrl.trim() : null
        },
        countries: countryRules
      };

      const payload = {
        originalUrl: finalUrl,
        customAlias: customAlias ? customAlias.trim() : undefined,
        expiryDays,
        customExpiryDate: finalExpiryDate,
        password: password ? password.trim() : undefined,
        workspaceId: activeWorkspace ? activeWorkspace._id : null,
        smartRedirects
      };

      await axios.post('/api/url/create', payload);
      toast.success('Enterprise link shortened!');
      
      // Reset State
      setOriginalUrl('');
      setCustomAlias('');
      setExpiryType('none');
      setCustomExpiryDate('');
      setPassword('');
      setUtmSource('');
      setUtmMedium('');
      setUtmCampaign('');
      setUtmTerm('');
      setUtmContent('');
      setMobileUrl('');
      setTabletUrl('');
      setDesktopUrl('');
      setCountryRules([]);
      setShowUtm(false);
      setShowPassword(false);
      setShowSmartRedirects(false);

      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to shorten URL');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/url/delete/${activeDeleteId}`);
      toast.success('Link deleted successfully');
      setUrls(urls.filter(u => u._id !== activeDeleteId));
      setActiveDeleteId(null);
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to delete URL');
    }
  };

  const openEditModal = (url) => {
    setActiveEditUrl(url);
    setEditOriginalUrl(url.originalUrl);
    setEditCustomAlias(url.customAlias || '');
    setEditExpiryDate(url.expiryDate ? new Date(url.expiryDate).toISOString().substring(0, 10) : '');
    setEditPassword('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await axios.put(`/api/url/update/${activeEditUrl._id}`, {
        originalUrl: editOriginalUrl,
        customAlias: editCustomAlias || null,
        customExpiryDate: editExpiryDate || null,
        password: editPassword || undefined
      });
      toast.success('Link configurations saved');
      setActiveEditUrl(null);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update URL');
    } finally {
      setUpdating(false);
    }
  };

  const togglePublicStats = async (url) => {
    try {
      const updatedVal = !url.isPublicStatsEnabled;
      await axios.put(`/api/url/update/${url._id}`, {
        isPublicStatsEnabled: updatedVal
      });
      toast.success(updatedVal ? 'Public analytics enabled' : 'Public analytics disabled');
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to update shareable stats');
    }
  };

  // CSV Report Export using backend route
  const exportCsv = (urlId, shortCode) => {
    const token = localStorage.getItem('token');
    const url = `/api/url/export/csv/${urlId}?token=${token}`;
    
    // Creating manual trigger link for download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `linklite-report-${shortCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV export started');
  };

  // Excel Report Export Client-Side using sheetjs
  const exportExcel = async (url) => {
    try {
      toast.loading('Compiling Excel spreadsheet...');
      const res = await axios.get(`/api/analytics/${url._id}`);
      const visits = res.data.recentVisits;
      
      const sheetData = visits.map(v => ({
        Timestamp: new Date(v.timestamp).toLocaleString(),
        'IP Address': v.ipAddress,
        Country: v.country,
        State: v.state,
        City: v.city,
        Browser: v.browser,
        Device: v.device,
        OS: v.os
      }));

      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Click Log Database");

      XLSX.writeFile(workbook, `linklite-report-${url.shortCode}.xlsx`);
      toast.dismiss();
      toast.success('Spreadsheet report downloaded!');
    } catch(err) {
      toast.dismiss();
      toast.error('Failed to generate Excel report');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Advanced KPIs
  const totalUrls = urls.length;
  const totalClicks = urls.reduce((a, c) => a + c.clicks, 0);
  const activeUrls = urls.filter(u => !u.expiryDate || new Date(u.expiryDate) > new Date()).length;
  const expiredUrls = totalUrls - activeUrls;
  const topLink = urls.reduce((max, u) => u.clicks > (max ? max.clicks : 0) ? u : max, null);

  // Search & Filter
  const filteredUrls = urls.filter(url => {
    const matchesSearch = 
      url.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) || 
      url.shortCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isExpired = url.expiryDate && new Date(url.expiryDate) < new Date();
    if (filterType === 'active') return matchesSearch && !isExpired;
    if (filterType === 'expired') return matchesSearch && isExpired;
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Links', value: totalUrls, sub: activeWorkspace ? activeWorkspace.name : 'Personal' },
          { label: 'Total Clicks', value: totalClicks, sub: 'All-time traffic' },
          { label: 'Active Links', value: activeUrls, sub: `${expiredUrls} expired` },
          { label: 'Top Performer', value: topLink ? topLink.clicks : 0, sub: topLink ? `/${topLink.shortCode}` : 'None yet' },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`p-6 rounded-2xl border ${
              theme === 'dark' 
                ? 'glass-panel-dark shadow-glass-dark border-slate-800' 
                : 'glass-panel-light shadow-glass-light border-slate-200'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">{card.label}</span>
            <div className="text-2xl sm:text-3xl font-extrabold">{card.value}</div>
            <span className="text-[10px] text-slate-400 mt-1 block truncate">{card.sub}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Shortening Form Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
          }`}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FiPlus className="text-primary" /> Create Enterprise Short Link
            </h2>

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Destination URL</label>
                  <input
                    type="text"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    placeholder="https://example.com/very-long-target-url"
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none text-xs ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-950'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Custom Alias</label>
                  <input
                    type="text"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    placeholder="myalias"
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none text-xs ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-950'
                    }`}
                  />
                </div>
              </div>

              {/* Expiration Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Link Expiry</label>
                  <select
                    value={expiryType}
                    onChange={(e) => setExpiryType(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none text-xs ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-950'
                    }`}
                  >
                    <option value="none">Infinite (No Expiry)</option>
                    <option value="1">1 Day</option>
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="custom">Custom Date</option>
                  </select>
                </div>
                {expiryType === 'custom' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Expiry Date</label>
                    <input
                      type="date"
                      value={customExpiryDate}
                      min={new Date().toISOString().substring(0, 10)}
                      onChange={(e) => setCustomExpiryDate(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none text-xs ${
                        theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-950'
                      }`}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Advanced Accordions */}
              <div className="border-t border-slate-200/20 pt-4 space-y-3">
                {/* 1. UTM Builder */}
                <div className="border border-slate-100/50 dark:border-slate-800/50 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowUtm(!showUtm)}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-semibold"
                  >
                    <span className="flex items-center gap-2"><FiTag className="text-primary" /> UTM Campaign Builder</span>
                    <span>{showUtm ? '-' : '+'}</span>
                  </button>
                  {showUtm && (
                    <div className="p-4 bg-slate-50/30 dark:bg-slate-900/10 border-t border-slate-100/50 dark:border-slate-800/50 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Source (e.g. google, newsletter)"
                          value={utmSource}
                          onChange={(e) => setUtmSource(e.target.value)}
                          className={`px-3 py-2 rounded-lg border text-[11px] ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-950'
                          }`}
                        />
                        <input
                          type="text"
                          placeholder="Medium (e.g. cpc, email)"
                          value={utmMedium}
                          onChange={(e) => setUtmMedium(e.target.value)}
                          className={`px-3 py-2 rounded-lg border text-[11px] ${
                            theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-950'
                          }`}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Campaign Name (e.g. summer_sale)"
                        value={utmCampaign}
                        onChange={(e) => setUtmCampaign(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-[11px] ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-950'
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* 2. Password Locks */}
                <div className="border border-slate-100/50 dark:border-slate-800/50 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-semibold"
                  >
                    <span className="flex items-center gap-2"><FiLock className="text-primary" /> Password Protection</span>
                    <span>{showPassword ? '-' : '+'}</span>
                  </button>
                  {showPassword && (
                    <div className="p-4 bg-slate-50/30 dark:bg-slate-900/10 border-t border-slate-100/50 dark:border-slate-800/50">
                      <input
                        type="password"
                        placeholder="Enter password lock credentials..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border text-xs ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-950'
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* 3. Smart Device & Country Redirects */}
                <div className="border border-slate-100/50 dark:border-slate-800/50 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowSmartRedirects(!showSmartRedirects)}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-semibold"
                  >
                    <span className="flex items-center gap-2"><FiCpu className="text-primary" /> Smart Redirect rules</span>
                    <span>{showSmartRedirects ? '-' : '+'}</span>
                  </button>
                  {showSmartRedirects && (
                    <div className="p-4 bg-slate-50/30 dark:bg-slate-900/10 border-t border-slate-100/50 dark:border-slate-800/50 space-y-4">
                      {/* Device rules */}
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Device Routing</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="Mobile Target URL"
                            value={mobileUrl}
                            onChange={(e) => setMobileUrl(e.target.value)}
                            className={`px-3 py-1.5 rounded-lg border text-[11px] ${
                              theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                            }`}
                          />
                          <input
                            type="text"
                            placeholder="Tablet Target URL"
                            value={tabletUrl}
                            onChange={(e) => setTabletUrl(e.target.value)}
                            className={`px-3 py-1.5 rounded-lg border text-[11px] ${
                              theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                            }`}
                          />
                          <input
                            type="text"
                            placeholder="Desktop Target URL"
                            value={desktopUrl}
                            onChange={(e) => setDesktopUrl(e.target.value)}
                            className={`px-3 py-1.5 rounded-lg border text-[11px] ${
                              theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Country rules */}
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Country Routing</h4>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            placeholder="US, IN, GB..."
                            value={tempCountry}
                            onChange={(e) => setTempCountry(e.target.value)}
                            className={`w-24 px-3 py-1.5 rounded-lg border text-[11px] ${
                              theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                            }`}
                          />
                          <input
                            type="text"
                            placeholder="Country Redirect Destination"
                            value={tempCountryUrl}
                            onChange={(e) => setTempCountryUrl(e.target.value)}
                            className={`flex-1 px-3 py-1.5 rounded-lg border text-[11px] ${
                              theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={addCountryRule}
                            className="px-3 py-1.5 bg-primary text-white text-[11px] rounded-lg"
                          >
                            Add
                          </button>
                        </div>
                        {/* Rules table */}
                        <div className="space-y-1">
                          {countryRules.map((rule, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px] bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                              <span><strong>{rule.country}</strong> &rarr; {rule.url}</span>
                              <button onClick={() => removeCountryRule(idx)} className="text-rose-500 hover:text-rose-600 font-bold">&times;</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-xs hover:opacity-95 shadow-md shadow-primary/20 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Shorten Enterprise Link'}
                </button>
              </div>
            </form>
          </div>

          {/* Links searchable list */}
          <div className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-1 border border-slate-200/20 p-1 rounded-xl">
                {['all', 'active', 'expired'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilterType(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      filterType === tab
                        ? 'bg-primary text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search original URL or shortcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-8 pr-4 py-2 w-full sm:w-64 rounded-xl border outline-none text-xs ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'
                  }`}
                />
                <FiSearch className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>
            </div>

            {loading ? (
              <p className="text-xs text-slate-500 py-10 text-center">Fetching links...</p>
            ) : filteredUrls.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <FiLink className="w-10 h-10 mx-auto mb-3 opacity-30 text-primary" />
                <p className="text-xs">No shortened links matches found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUrls.map(url => {
                  const isExpired = url.expiryDate && new Date(url.expiryDate) < new Date();
                  return (
                    <div 
                      key={url._id} 
                      className="p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/50 hover:bg-slate-50/20 dark:hover:bg-slate-900/5 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <a href={url.originalUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:underline flex items-center gap-1 truncate max-w-md">
                            {url.originalUrl}
                            <FiExternalLink className="flex-shrink-0 opacity-60" />
                          </a>
                          
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                            <span className="font-mono font-bold text-primary flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded">
                              {url.shortCode}
                            </span>
                            
                            {url.isPasswordProtected && (
                              <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                                <FiLock className="w-3 h-3" /> Password Protected
                              </span>
                            )}

                            {url.expiryDate && (
                              <span className={`inline-flex items-center gap-0.5 ${isExpired ? 'text-rose-500 bg-rose-500/10' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'} px-1.5 py-0.5 rounded`}>
                                <FiClock className="w-3 h-3" /> {new Date(url.expiryDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {/* Copy URL */}
                          <button
                            onClick={() => copyToClipboard(url.shortUrl)}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-200"
                            title="Copy link"
                          >
                            <FiCopy className="w-3.5 h-3.5" />
                          </button>

                          {/* Shareable Analytics Toggle */}
                          <button
                            onClick={() => togglePublicStats(url)}
                            className={`p-2 rounded-lg border ${
                              url.isPublicStatsEnabled 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                                : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400'
                            }`}
                            title={url.isPublicStatsEnabled ? 'Disable public link report' : 'Enable public link report'}
                          >
                            <FiShare2 className="w-3.5 h-3.5" />
                          </button>

                          {/* QR modal trigger */}
                          <button
                            onClick={() => setActiveQrUrl(url)}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-200"
                            title="QR Code"
                          >
                            <FiCompass className="w-3.5 h-3.5" />
                          </button>

                          {/* Analytics Detail Page */}
                          <button
                            onClick={() => navigate(`/analytics/${url._id}`)}
                            className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500"
                            title="Analytics Dashboard"
                          >
                            <FiBarChart2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => openEditModal(url)}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-200"
                            title="Edit URL"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Excel Export */}
                          <button
                            onClick={() => exportExcel(url)}
                            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"
                            title="Export Excel report"
                          >
                            <FiFileText className="w-3.5 h-3.5" />
                          </button>

                          {/* CSV Export */}
                          <button
                            onClick={() => exportCsv(url._id, url.shortCode)}
                            className="p-2 rounded-lg bg-teal-500/10 text-teal-500"
                            title="Export CSV report"
                          >
                            <FiDownload className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Link */}
                          <button
                            onClick={() => setActiveDeleteId(url._id)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                            title="Delete"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Display public link if enabled */}
                      {url.isPublicStatsEnabled && (
                        <div className="mt-3 text-[10px] p-2 bg-emerald-500/5 dark:bg-black/30 rounded-lg flex items-center justify-between text-slate-400">
                          <span className="truncate">Public Link Report: <strong className="text-emerald-500 font-mono">{`${window.location.protocol}//${window.location.host}/stats/${url.shortCode}`}</strong></span>
                          <button 
                            onClick={() => copyToClipboard(`${window.location.protocol}//${window.location.host}/stats/${url.shortCode}`)}
                            className="text-primary font-bold hover:underline ml-2 flex-shrink-0"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Activity Timeline Feed */}
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'glass-panel-dark border-slate-800' : 'glass-panel-light border-slate-200'
          }`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-1.5">
              <FiList /> Operations Audit Trail
            </h3>

            {loading ? (
              <p className="text-xs text-slate-500">Loading audit history...</p>
            ) : activities.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No operations history registered.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {activities.map((act, index) => (
                  <div key={index} className="relative pl-5 border-l border-slate-200/20 dark:border-slate-800/40 text-xs">
                    <div className="absolute -left-1.5 top-1 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-slate-900"></div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{act.description}</p>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- Action Modals (QR, Delete, Edit) --- */}
      <AnimatePresence>
        {activeQrUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveQrUrl(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 15 }} className={`relative z-10 w-full max-w-sm p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
              <button onClick={() => setActiveQrUrl(null)} className="absolute top-4 right-4 text-slate-400"><FiX className="w-5 h-5" /></button>
              <div className="text-center">
                <h3 className="text-lg font-bold mb-2">QR Code</h3>
                <p className="text-xs text-slate-400 truncate mb-6">{activeQrUrl.shortUrl}</p>
                <div className="inline-block p-4 bg-white rounded-2xl shadow-inner mb-6">
                  <QRCodeSVG id={`qr-svg-${activeQrUrl.shortCode}`} value={activeQrUrl.shortUrl} size={200} level="H" includeMargin={true} />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const svg = document.getElementById(`qr-svg-${activeQrUrl.shortCode}`);
                      const svgData = new XMLSerializer().serializeToString(svg);
                      const canvas = document.createElement("canvas");
                      const ctx = canvas.getContext("2d");
                      const img = new Image();
                      img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        const pngFile = canvas.toDataURL("image/png");
                        const link = document.createElement("a");
                        link.download = `qr-${activeQrUrl.shortCode}.png`;
                        link.href = pngFile;
                        link.click();
                      };
                      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold rounded-xl"
                  >
                    <FiDownload />
                    <span>Download</span>
                  </button>
                  <button onClick={() => { copyToClipboard(activeQrUrl.shortUrl); setActiveQrUrl(null); }} className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-700 hover:bg-slate-800">Copy URL</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeEditUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveEditUrl(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 15 }} className={`relative z-10 w-full max-w-md p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
              <button onClick={() => setActiveEditUrl(null)} className="absolute top-4 right-4 text-slate-400"><FiX className="w-5 h-5" /></button>
              <h3 className="text-lg font-bold mb-4">Edit URL Configuration</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Original Destination</label>
                  <input type="text" value={editOriginalUrl} onChange={(e) => setEditOriginalUrl(e.target.value)} className={`w-full px-4 py-2 rounded-xl border outline-none text-xs ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Custom Alias</label>
                  <input type="text" value={editCustomAlias} onChange={(e) => setEditCustomAlias(e.target.value)} className={`w-full px-4 py-2 rounded-xl border outline-none text-xs ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Expiration Date</label>
                  <input type="date" value={editExpiryDate} onChange={(e) => setEditExpiryDate(e.target.value)} className={`w-full px-4 py-2 rounded-xl border outline-none text-xs ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Change Password Lock</label>
                  <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Leave empty to keep existing password, type space to delete" className={`w-full px-4 py-2 rounded-xl border outline-none text-xs ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`} />
                </div>
                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={() => setActiveEditUrl(null)} className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-slate-700">Cancel</button>
                  <button type="submit" disabled={updating} className="flex-1 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl">{updating ? 'Saving...' : 'Save Settings'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveDeleteId(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 15 }} className={`relative z-10 w-full max-w-sm p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
              <h3 className="text-lg font-bold mb-2">Delete Short Link</h3>
              <p className="text-xs text-slate-400 mb-6">Confirm deletion of the selected shortened path. This action will purge all corresponding location logs and cannot be undone.</p>
              <div className="flex space-x-3">
                <button onClick={() => setActiveDeleteId(null)} className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-slate-700">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl">Delete Link</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
