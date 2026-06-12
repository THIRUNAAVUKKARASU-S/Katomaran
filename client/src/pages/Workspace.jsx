import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiPlus, FiTrash2, FiUserPlus, FiLayers, FiShield, FiX, FiCheck } from 'react-icons/fi';

const Workspace = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Creation state
  const [newWsName, setNewWsName] = useState('');
  const [creating, setCreating] = useState(false);

  // Invitation state
  const [activeWs, setActiveWs] = useState(null); // active workspace for member view
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/workspace');
      setWorkspaces(res.data);
      if (res.data.length > 0 && !activeWs) {
        setActiveWs(res.data[0]);
      } else if (activeWs) {
        // Refresh active workspace details
        const updated = res.data.find(w => w._id === activeWs._id);
        if (updated) setActiveWs(updated);
      }
    } catch (err) {
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    setCreating(true);
    try {
      const res = await axios.post('/api/workspace', { name: newWsName });
      toast.success('Workspace created successfully!');
      setNewWsName('');
      fetchWorkspaces();
    } catch (err) {
      toast.error('Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const res = await axios.post(`/api/workspace/invite/${activeWs._id}`, {
        email: inviteEmail.trim(),
        role: inviteRole
      });
      toast.success('Member added successfully!');
      setInviteEmail('');
      fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member. Make sure they have a LinkLite account.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await axios.post(`/api/workspace/remove/${activeWs._id}`, { memberId });
      toast.success('Member removed');
      fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteWorkspace = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workspace and all its short links?')) return;
    try {
      await axios.delete(`/api/workspace/delete/${id}`);
      toast.success('Workspace deleted');
      setActiveWs(null);
      fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete workspace');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Team Workspaces</h1>
        <p className="text-sm text-slate-400">Collaborate with team members, share shortened links, and view unified statistics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Workspaces List & Create Form */}
        <div className="space-y-6">
          {/* Create Workspace */}
          <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <FiPlus /> New Workspace
            </h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                placeholder="Marketing Team, Dev Team..."
                className={`w-full px-4 py-2.5 rounded-xl border outline-none text-xs ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-950'
                }`}
                required
              />
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-xs hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Workspace'}
              </button>
            </form>
          </div>

          {/* Workspaces Selectors */}
          <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <FiLayers /> Your Teams
            </h3>
            {loading ? (
              <p className="text-xs text-slate-500">Loading workspaces...</p>
            ) : workspaces.length === 0 ? (
              <p className="text-xs text-slate-500">No workspaces yet.</p>
            ) : (
              <div className="space-y-2">
                {workspaces.map(ws => {
                  const isActive = activeWs && activeWs._id === ws._id;
                  const isOwner = ws.ownerId === user.id || ws.ownerId === user._id;
                  return (
                    <div 
                      key={ws._id}
                      onClick={() => setActiveWs(ws)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        isActive 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="truncate">{ws.name}</span>
                      {isOwner && isActive && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWorkspace(ws._id);
                          }}
                          className="text-rose-500 hover:text-rose-600 p-1"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Members Management Panel */}
        <div className="lg:col-span-2">
          {activeWs ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 sm:p-8 rounded-2xl border h-full ${
                theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
              }`}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">{activeWs.name}</h2>
                  <p className="text-xs text-slate-400">Manage member privileges and additions.</p>
                </div>
              </div>

              {/* Add Member Form (Only for Owners/Admins) */}
              <div className="mb-8 p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <FiUserPlus /> Invite Team Member
                </h3>
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="member@company.com"
                    className={`flex-1 px-4 py-2 rounded-xl border outline-none text-xs ${
                      theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-950'
                    }`}
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className={`px-3 py-2 rounded-xl border outline-none text-xs ${
                      theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-950'
                    }`}
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-5 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl text-xs disabled:opacity-50"
                  >
                    {inviting ? 'Inviting...' : 'Add Member'}
                  </button>
                </form>
              </div>

              {/* Members List */}
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <FiUsers /> Workspace Members ({activeWs.members.length})
              </h3>
              <div className="space-y-3">
                {activeWs.members.map((member, index) => {
                  // Resolve member user details if populated, else mock representation for display
                  const mName = member.userId?.name || 'Workspace Member';
                  const mEmail = member.userId?.email || 'Active User';
                  const isOwner = member.role === 'Owner';
                  const isOperatorOwner = activeWs.ownerId === user.id || activeWs.ownerId === user._id;

                  return (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100/50 dark:border-slate-800/50 hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-xs font-bold font-mono">
                          {mName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{mName}</p>
                          <p className="text-[10px] text-slate-400">{mEmail}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          member.role === 'Owner'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : member.role === 'Admin'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          <FiShield className="w-3 h-3" />
                          {member.role}
                        </span>

                        {!isOwner && isOperatorOwner && (
                          <button
                            onClick={() => handleRemoveMember(member.userId._id || member.userId)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500"
                            title="Remove Member"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl py-20 text-slate-400">
              <p className="text-xs">Create or select a workspace to manage membership settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Workspace;
