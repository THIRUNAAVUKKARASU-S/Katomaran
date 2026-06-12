import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FiSun, FiMoon, FiLogOut, FiTrendingUp, FiLayers, FiBell, 
  FiKey, FiChevronDown, FiUser, FiSettings, FiCheckCircle, FiUsers 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
  const { user, logout, activeWorkspace, setActiveWorkspace } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Workspaces list
  const [workspaces, setWorkspaces] = useState([]);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchWorkspaces();
    fetchNotifications();
    
    // Close dropdowns on outside click
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (wsRef.current && !wsRef.current.contains(event.target)) {
        setShowWorkspaceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await axios.get('/api/workspace');
      setWorkspaces(res.data);
    } catch (err) {
      console.error('Error loading workspaces', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/user/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error loading notifications', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.post('/api/user/notifications/read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking notifications as read', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gradient-mesh-dark text-slate-100' : 'bg-gradient-mesh-light text-slate-800'
    }`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-40 border-b transition-colors duration-300 backdrop-blur-md ${
        theme === 'dark' 
          ? 'bg-slate-900/60 border-slate-800' 
          : 'bg-white/60 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Left Brand + Workspace selector */}
            <div className="flex items-center space-x-6">
              <Link to="/dashboard" className="flex items-center space-x-2 group">
                <div className="p-2 bg-gradient-to-tr from-primary to-secondary rounded-xl text-white shadow-md shadow-primary/20 transform group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  LinkLite
                </span>
              </Link>

              {/* Workspace Switcher */}
              {user && (
                <div className="relative" ref={wsRef}>
                  <button
                    onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-semibold select-none transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-700'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{activeWorkspace ? activeWorkspace.name : 'Personal Workspace'}</span>
                    <FiChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  <AnimatePresence>
                    {showWorkspaceDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`absolute left-0 mt-2 w-56 rounded-xl border p-2 shadow-xl z-50 ${
                          theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
                        }`}
                      >
                        <button
                          onClick={() => {
                            setActiveWorkspace(null);
                            setShowWorkspaceDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                            !activeWorkspace ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          Personal Workspace
                        </button>
                        
                        <div className="border-t border-slate-200/20 my-1"></div>

                        {workspaces.map(ws => (
                          <button
                            key={ws._id}
                            onClick={() => {
                              setActiveWorkspace(ws);
                              setShowWorkspaceDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium truncate ${
                              activeWorkspace && activeWorkspace._id === ws._id ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {ws.name}
                          </button>
                        ))}

                        <div className="border-t border-slate-200/20 my-1"></div>

                        <Link
                          to="/workspaces"
                          onClick={() => setShowWorkspaceDropdown(false)}
                          className="w-full text-left flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10"
                        >
                          <FiSettings className="w-3.5 h-3.5" />
                          <span>Manage Workspaces</span>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Middle Nav Links */}
            {user && (
              <div className="hidden md:flex items-center space-x-6">
                {[
                  { to: '/dashboard', label: 'Dashboard', icon: FiLayers },
                  { to: '/workspaces', label: 'Teams', icon: FiUsers },
                  { to: '/apikeys', label: 'Developer Keys', icon: FiKey },
                ].map(link => {
                  const active = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                        active 
                          ? 'text-primary' 
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                    >
                      <link.icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              
              {/* Notification Center */}
              {user && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2.5 rounded-xl border relative transition-all ${
                      theme === 'dark' ? 'bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <FiBell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`absolute right-0 mt-2 w-80 rounded-2xl border p-4 shadow-xl z-50 ${
                          theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold uppercase text-slate-400">Notifications ({unreadCount})</span>
                          {unreadCount > 0 && (
                            <button 
                              onClick={handleMarkAllRead}
                              className="text-[10px] font-bold text-primary hover:underline"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
                          {notifications.length === 0 ? (
                            <p className="text-[10px] text-slate-500 text-center py-6">No notifications yet.</p>
                          ) : (
                            notifications.map((n, idx) => (
                              <div key={n._id || idx} className={`pt-2 text-xs first:pt-0 ${n.isRead ? 'opacity-65' : ''}`}>
                                <div className="flex items-start justify-between">
                                  <span className={`font-bold ${
                                    n.type === 'DANGER' ? 'text-rose-500' : n.type === 'WARNING' ? 'text-amber-500' : 'text-slate-200'
                                  }`}>{n.title}</span>
                                  {!n.isRead && <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></span>}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">{n.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl border transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-800/60 border-slate-700 text-amber-400 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200'
                }`}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
              </button>

              {/* Logout */}
              {user && (
                <button
                  onClick={handleLogout}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-rose-400 hover:bg-rose-500/10'
                      : 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <FiLogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 text-center text-xs tracking-wide transition-colors duration-300 mt-auto ${
        theme === 'dark' ? 'border-slate-800/50 text-slate-500' : 'border-slate-200/50 text-slate-400'
      }`}>
        <p>© {new Date().getFullYear()} LinkLite. Enterprise SaaS Portal.</p>
      </footer>
    </div>
  );
};

export default Layout;
