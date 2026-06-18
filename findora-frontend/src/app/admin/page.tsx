"use client";

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Shield, Users, Search, Package, CheckCircle, Trash2, Megaphone, Check, ArrowLeft, Star, AlertCircle, X, Info, Bot, Zap, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'moderation' | 'broadcast' | 'activity' | 'reviews' | 'autoblock'>('analytics');

  // Flagged User Investigation State
  const [investigatingUser, setInvestigatingUser] = useState<any | null>(null);

  // Users Tab State
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Reviews Tab State
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Moderation Tab State
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Broadcast Tab State
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState('SYSTEM_ALERT');
  const [broadcastStatus, setBroadcastStatus] = useState('');

  // Auto-Block Log State
  const [autoBlockLogs, setAutoBlockLogs] = useState<any[]>([]);
  const [autoBlockLoading, setAutoBlockLoading] = useState(false);
  const [scanRunning, setScanRunning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const res = await api.get('/admin/activity');
      setActivities(res.data.data);
    } catch (err) {
      console.error('Failed to fetch activities', err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchAutoBlockLogs = async () => {
    try {
      setAutoBlockLoading(true);
      const res = await api.get('/admin/auto-block-logs');
      setAutoBlockLogs(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch auto-block logs', err);
    } finally {
      setAutoBlockLoading(false);
    }
  };

  const runAutoBlockScan = async () => {
    if (!confirm('Run a full auto-block scan on all existing reviews? This may block users who meet the threshold.')) return;
    try {
      setScanRunning(true);
      setScanResult('');
      const res = await api.put('/admin/auto-block/run');
      setScanResult(res.data.data || 'Scan complete.');
      fetchAutoBlockLogs();
      fetchUsers();
    } catch (err: any) {
      setScanResult(err?.response?.data?.message || 'Scan failed.');
    } finally {
      setScanRunning(false);
    }
  };


  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'ROLE_ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchStats();
  }, [user, isAuthenticated, router]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'moderation') fetchItems();
    if (activeTab === 'activity') fetchActivities();
    if (activeTab === 'reviews') fetchReviews();
    if (activeTab === 'autoblock') fetchAutoBlockLogs();
  }, [activeTab]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await api.get('/reviews/admin/all');
      setReviews(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stats');
      setStats(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      setItemsLoading(true);
      const [lostRes, foundRes] = await Promise.all([
        api.get('/admin/items/lost'),
        api.get('/admin/items/found')
      ]);
      setLostItems(lostRes.data.data);
      setFoundItems(foundRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/block?block=${!currentStatus}`);
      // Always refresh both lists so the UI is consistent everywhere
      await fetchUsers();
      fetchActivities();
      await fetchReviews();
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to update user block status";
      alert(msg);
      return false;
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}/role?role=${newRole}`);
      fetchUsers();
      fetchActivities();
    } catch (err) {
      alert("Failed to update user role");
    }
  };

  const handleVerifyOrg = async (userId: string, verify: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/verify-org?verify=${verify}`);
      // Always refresh both lists so the UI is consistent everywhere
      await fetchUsers();
      fetchActivities();
      await fetchReviews();
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to verify user verification status";
      alert(msg);
      return false;
    }
  };

  const handleDeleteItem = async (id: string, type: 'lost' | 'found') => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/admin/items/${type}/${id}`);
      fetchItems();
    } catch (err) {
      alert("Failed to delete item");
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    try {
      setBroadcastStatus('sending');
      await api.post('/admin/notifications/broadcast', {
        message: broadcastMessage,
        type: broadcastType
      });
      setBroadcastStatus('success');
      fetchActivities();
      setBroadcastMessage('');
      setTimeout(() => setBroadcastStatus(''), 3000);
    } catch (err) {
      setBroadcastStatus('error');
      setTimeout(() => setBroadcastStatus(''), 3000);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center px-4">
        <div className="glass p-8 rounded-3xl max-w-md w-full text-center border border-red-500/20">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-start">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 hover:border-white/10 text-sm font-semibold transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_30px_rgba(var(--primary),0.3)]">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Platform overview and management</p>
          </div>
        </div>

        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 overflow-x-auto hide-scrollbar">
        {(['analytics', 'users', 'moderation', 'reviews', 'autoblock', 'broadcast', 'activity'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all whitespace-nowrap relative ${
              activeTab === tab 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'autoblock' ? 'Auto-Block' : tab}
          </button>
        ))}
        </div>
      </div>

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
          <div className="glass p-6 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 font-medium">Total Users</h3>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white">{stats?.totalUsers || 0}</p>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/5 hover:border-red-500/30 transition-all hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 font-medium">Lost Items</h3>
              <div className="p-3 bg-red-500/10 rounded-xl text-red-400 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white">{stats?.totalLostItems || 0}</p>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 font-medium">Found Items</h3>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white">{stats?.totalFoundItems || 0}</p>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all hover:-translate-y-1 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 font-medium">Successful Matches</h3>
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-4xl font-bold text-white">{stats?.totalMatches || 0}</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="glass rounded-3xl border border-white/10 overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-300">User</th>
                  <th className="px-6 py-4 font-semibold text-gray-300">Role</th>
                  <th className="px-6 py-4 font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usersLoading ? (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading users...</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {u.firstName?.[0] || u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{u.firstName} {u.lastName}</p>
                            <p className="text-gray-400 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={u.role} 
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
                          disabled={u.email === 'admin@findora.com'}
                        >
                          <option value="ROLE_USER">User</option>
                          <option value="ROLE_MODERATOR">Moderator</option>
                          <option value="ROLE_ORGANIZATION">Organization</option>
                          <option value="ROLE_ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {u.isBlocked ? (
                          <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/20 rounded-full text-xs font-semibold">Blocked</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">Active</span>
                        )}
                        {u.isVerified && (
                          <span className="ml-2 px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold">Verified</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleVerifyOrg(u.id, !u.isVerified)}
                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold transition-colors"
                            disabled={u.email === 'admin@findora.com'}
                          >
                            {u.isVerified ? 'Unverify' : 'Verify'}
                          </button>
                          <button 
                            onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              u.isBlocked ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                            }`}
                            disabled={u.email === 'admin@findora.com'}
                          >
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'moderation' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="glass rounded-3xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" /> Lost Items Moderation
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10 sticky top-0 backdrop-blur-xl">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-300">Item</th>
                    <th className="px-6 py-4 font-semibold text-gray-300">Location</th>
                    <th className="px-6 py-4 font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {lostItems.map(item => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{item.title}</div>
                        <div className="text-gray-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{item.lastSeenLocation}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs">{item.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDeleteItem(item.id, 'lost')} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass rounded-3xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" /> Found Items Moderation
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10 sticky top-0 backdrop-blur-xl">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-300">Item</th>
                    <th className="px-6 py-4 font-semibold text-gray-300">Location</th>
                    <th className="px-6 py-4 font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {foundItems.map(item => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{item.title}</div>
                        <div className="text-gray-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{item.foundLocation}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs">{item.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDeleteItem(item.id, 'found')} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'broadcast' && (
        <div className="glass max-w-2xl mx-auto rounded-3xl border border-white/10 p-8 animate-in fade-in duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">System Broadcast</h2>
              <p className="text-sm text-gray-400">Send an alert or announcement to all users</p>
            </div>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Alert Type</label>
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="type" value="SYSTEM_ALERT" checked={broadcastType === 'SYSTEM_ALERT'} onChange={e => setBroadcastType(e.target.value)} className="peer sr-only" />
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 peer-checked:border-red-500 peer-checked:bg-red-500/10 transition-all text-center">
                    <span className="font-semibold peer-checked:text-red-400 text-gray-300">Emergency Alert</span>
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="type" value="BROADCAST" checked={broadcastType === 'BROADCAST'} onChange={e => setBroadcastType(e.target.value)} className="peer sr-only" />
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 peer-checked:border-primary peer-checked:bg-primary/10 transition-all text-center">
                    <span className="font-semibold peer-checked:text-primary text-gray-300">General Announcement</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
              <textarea 
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                rows={4}
                placeholder="E.g., High chance of theft in United Versity area. Please secure your belongings."
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={!broadcastMessage.trim() || broadcastStatus === 'sending'}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {broadcastStatus === 'sending' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : broadcastStatus === 'success' ? (
                <><Check className="w-5 h-5" /> Sent to All Users</>
              ) : (
                <><Megaphone className="w-5 h-5" /> Send Broadcast</>
              )}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="glass rounded-3xl border border-white/10 p-6 animate-in fade-in duration-300">
          <h3 className="text-xl font-bold text-white mb-4">Admin Activity Log</h3>
          {activitiesLoading ? (
            <p className="text-gray-400">Loading activities...</p>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10 sticky top-0 backdrop-blur-xl">
                  <tr>
                    <th className="px-4 py-2 font-semibold text-gray-300">Admin ID</th>
                    <th className="px-4 py-2 font-semibold text-gray-300">Action</th>
                    <th className="px-4 py-2 font-semibold text-gray-300">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activities.map((act) => (
                    <tr key={act.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-2 text-white">{act.adminId || 'System'}</td>
                      <td className="px-4 py-2 text-gray-300">{act.action}</td>
                      <td className="px-4 py-2 text-gray-400">{new Date(act.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'autoblock' && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Header card */}
          <div className="glass rounded-3xl border border-red-500/20 p-6 bg-red-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Auto-Block System</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Users are automatically blocked when their reviews contain scam keywords, have 3+ negative ratings, or drop to a trust score ≤ 30.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 items-end shrink-0">
                <button
                  onClick={runAutoBlockScan}
                  disabled={scanRunning}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95"
                >
                  {scanRunning ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Scanning...</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Run Scan Now</>
                  )}
                </button>
                {scanResult && (
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    ✓ {scanResult}
                  </span>
                )}
              </div>
            </div>

            {/* Threshold Badges */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">
                🚨 Scam Keywords ≥ 2 reports
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                ⭐ Negative Reviews ≥ 3
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                📉 Trust Score ≤ 30
              </span>
            </div>
          </div>

          {/* Log entries */}
          <div className="glass rounded-3xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h4 className="text-white font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                Auto-Block Event Log
                <span className="ml-1 text-xs font-bold text-red-400 bg-red-500/15 border border-red-500/20 px-2 py-0.5 rounded-full">
                  {autoBlockLogs.length} events
                </span>
              </h4>
              <button
                onClick={fetchAutoBlockLogs}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${autoBlockLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {autoBlockLoading ? (
              <div className="p-12 flex items-center justify-center text-gray-400 gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-red-400" />
                <span className="text-sm">Loading auto-block events...</span>
              </div>
            ) : autoBlockLogs.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-white font-bold mb-1">No Auto-Block Events</p>
                <p className="text-sm text-gray-400">No users have been auto-blocked yet. The system will trigger automatically when review thresholds are exceeded.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                {autoBlockLogs.map((log: any) => {
                  // Parse the action string: "🤖 AUTO-BLOCK: email | reason | TrustScore=X"
                  const actionStr: string = log.action || '';
                  const parts = actionStr.replace('🤖 AUTO-BLOCK: ', '').split(' | ');
                  const userEmail = parts[0] || '';
                  const reasonRaw = parts[1] || '';
                  const trustPart = parts[2] || '';
                  const trustScore = trustPart.replace('TrustScore=', '');

                  // Parse reason badges
                  const hasScam = reasonRaw.includes('scam-keyword');
                  const hasNeg = reasonRaw.includes('negative review');
                  const hasScore = reasonRaw.includes('trust score');
                  const scamMatch = reasonRaw.match(/(\d+) scam-keyword/);
                  const negMatch = reasonRaw.match(/(\d+) negative review/);

                  return (
                    <div key={log.id} className="p-5 hover:bg-white/3 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-2">
                          {/* User email */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                              AUTO-BLOCKED
                            </span>
                            <span className="text-white font-semibold text-sm">{userEmail}</span>
                          </div>

                          {/* Reason badges */}
                          <div className="flex flex-wrap gap-1.5">
                            {hasScam && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/25">
                                🚨 {scamMatch?.[1] || '?'} Scam Keyword Report{(scamMatch?.[1] || '1') !== '1' ? 's' : ''}
                              </span>
                            )}
                            {hasNeg && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/25">
                                ⭐ {negMatch?.[1] || '?'} Negative Review{(negMatch?.[1] || '1') !== '1' ? 's' : ''}
                              </span>
                            )}
                            {hasScore && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/25">
                                📉 Trust Score: {trustScore}
                              </span>
                            )}
                          </div>

                          {/* Full reason text */}
                          <p className="text-xs text-gray-500 italic">Reason: {reasonRaw || 'threshold exceeded'}</p>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] text-gray-500">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown time'}
                          </span>
                          <span className="text-[10px] text-gray-600">
                            {log.adminId ? `By: ${log.adminId}` : 'By: System (AI)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="glass rounded-3xl border border-white/10 p-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" /> User Feedback & Ratings
              </h3>
              <p className="text-xs text-gray-400 mt-1">Review transaction feedback between owners and finders. Flagged accounts have low trust scores.</p>
            </div>
          </div>

          {/* ── Flagged Users Summary (Comment-based scam flagging & verification) ── */}
          {(() => {
            // Group reviews by reviewee and count negative (≤2 star) reviews and scam keywords
            const flagMap: Record<string, { user: any; negCount: number; totalCount: number; scamCommentsCount: number; userReviews: any[] }> = {};
            const scamWords = ["scam", "fake", "cheat", "fraud", "liar", "stole", "money", "demand", "rob", "demanded", "scammer", "payment", "hostile", "rude", "extort"];
            
            reviews.forEach((rev: any) => {
              if (!rev.reviewee?.id) return;
              const id = rev.reviewee.id;
              if (!flagMap[id]) flagMap[id] = { user: rev.reviewee, negCount: 0, totalCount: 0, scamCommentsCount: 0, userReviews: [] };
              
              flagMap[id].totalCount += 1;
              flagMap[id].userReviews.push(rev);
              
              if (rev.rating <= 2) {
                flagMap[id].negCount += 1;
              }
              
              const commentText = (rev.comment || '').toLowerCase();
              const hasScamWord = scamWords.some(word => commentText.includes(word));
              if (hasScamWord) {
                flagMap[id].scamCommentsCount += 1;
              }
            });

            const flaggedUsers = Object.values(flagMap)
              .filter(f => f.negCount >= 1 || f.scamCommentsCount >= 1)
              .sort((a, b) => (b.scamCommentsCount * 2 + b.negCount) - (a.scamCommentsCount * 2 + a.negCount));

            if (flaggedUsers.length === 0) return null;
            return (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/20">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  ⚠ Flagged Users — Negative Feedback & Scam Investigation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {flaggedUsers.map(({ user, negCount, totalCount, scamCommentsCount, userReviews }) => (
                    <div
                      key={user.id}
                      className={`flex flex-col justify-between p-3.5 rounded-xl border ${
                        scamCommentsCount >= 1 || negCount >= 3 
                          ? 'bg-red-500/10 border-red-500/30' 
                          : 'bg-orange-500/5 border-orange-500/20'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-white font-semibold text-xs truncate">
                            {user.firstName} {user.lastName}
                          </span>
                          {user.isBlocked && (
                            <span className="text-[8px] bg-red-500/25 text-red-400 border border-red-500/30 rounded-full px-1.5 py-0.5 font-bold shrink-0">BLOCKED</span>
                          )}
                          {user.isVerified && (
                            <span className="text-[8px] bg-blue-500/25 text-blue-400 border border-blue-500/30 rounded-full px-1.5 py-0.5 font-bold shrink-0">VERIFIED</span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate mt-0.5">{user.email}</div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                            {negCount} negative
                          </span>
                          {scamCommentsCount > 0 && (
                            <span className="text-[9px] font-bold text-rose-400 bg-rose-500/20 border border-rose-500/35 px-1.5 py-0.5 rounded animate-pulse">
                              🚨 {scamCommentsCount} scam flags
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 justify-between">
                        <button
                          onClick={() => setInvestigatingUser({ user, negCount, totalCount, scamCommentsCount, userReviews })}
                          className="px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/35 border border-blue-500/30 text-blue-400 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                        >
                          🔍 Investigate
                        </button>
                        <button
                          onClick={() => {
                            const isBlocked = user?.isBlocked ?? false;
                            if (confirm(`${isBlocked ? 'Unblock' : 'Block'} ${user.firstName} ${user.lastName}?`)) {
                              handleToggleBlock(user.id, isBlocked);
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            user.isBlocked
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                          }`}
                        >
                          {user.isBlocked ? '✓ Unblock' : '⊘ Block'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto pr-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/10 sticky top-0 backdrop-blur-xl">
                <tr>
                  <th className="px-4 py-3.5 font-semibold text-gray-300">Reviewer</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-300">Reviewee</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-300">Rating</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-300">Comment</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-300">Date</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-300 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reviewsLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading reviews...</td></tr>
                ) : reviews.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500 italic">No reviews submitted yet.</td></tr>
                ) : (
                  reviews.map((rev) => (
                    <tr
                      key={rev.id}
                      className={`hover:bg-white/5 transition-colors ${
                        rev.rating <= 2 ? 'border-l-2 border-red-500/60' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{rev.reviewer?.firstName} {rev.reviewer?.lastName}</div>
                        <div className="text-gray-400 text-xs">{rev.reviewer?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="text-white font-medium">{rev.reviewee?.firstName} {rev.reviewee?.lastName}</div>
                          {rev.reviewee?.isBlocked && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5 font-semibold">BLOCKED</span>
                          )}
                        </div>
                        <div className="text-gray-400 text-xs">{rev.reviewee?.email}</div>
                        <div className="text-[10px] mt-0.5 text-gray-500">Trust Score: {rev.reviewee?.trustScore || 100}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-0.5 text-amber-400 font-bold items-center">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3.5 h-3.5 ${idx < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                            />
                          ))}
                          <span className="ml-1.5 text-xs text-white">({rev.rating}/5)</span>
                        </div>
                        {rev.rating <= 2 && (
                          <span className="text-[10px] text-red-400 font-semibold mt-0.5 block">⚠ Low Rating</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300 leading-relaxed italic max-w-xs truncate" title={rev.comment}>
                        &ldquo;{rev.comment}&rdquo;
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {rev.reviewee?.id && (
                          <button
                            onClick={() => {
                              const isBlocked = rev.reviewee?.isBlocked ?? false;
                              if (confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} ${rev.reviewee?.firstName} ${rev.reviewee?.lastName}?`)) {
                                handleToggleBlock(rev.reviewee.id, isBlocked);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                              rev.reviewee?.isBlocked
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                            }`}
                          >
                            {rev.reviewee?.isBlocked ? '✓ Unblock' : '⊘ Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      {/* ── Faulty User Investigation Modal ── */}
      {investigatingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl glass border border-white/10 p-6 rounded-3xl relative shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setInvestigatingUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xs font-semibold transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5"
            >
              Close
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 border border-red-500/30">
                <Shield className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Faulty User Investigation & Verification
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">Evaluate user behavior based on transaction reviews and scam indicators.</p>
              </div>
            </div>

            {/* User Account Summary Card */}
            <div className="bg-black/35 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-bold text-base">
                    {investigatingUser.user.firstName} {investigatingUser.user.lastName}
                  </span>
                  {investigatingUser.user.isBlocked && (
                    <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2.5 py-0.5 font-bold">BLOCKED</span>
                  )}
                  {investigatingUser.user.isVerified && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-2.5 py-0.5 font-bold">VERIFIED</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{investigatingUser.user.email}</p>
                <p className="text-xs text-gray-500 mt-1">Trust Score: <span className="text-white font-bold">{investigatingUser.user.trustScore || 100}</span></p>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex flex-wrap gap-2 shrink-0">
                {/* Verify Button */}
                <button
                  onClick={async () => {
                    const nextVerify = !investigatingUser.user.isVerified;
                    const ok = await handleVerifyOrg(investigatingUser.user.id, nextVerify);
                    if (ok) {
                      setInvestigatingUser((prev: any) => ({
                        ...prev,
                        user: { ...prev.user, isVerified: nextVerify }
                      }));
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    investigatingUser.user.isVerified
                      ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:scale-[1.02] active:scale-95'
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {investigatingUser.user.isVerified ? '✓ Verified (Click to Unverify)' : '★ Verify & Trust User'}
                </button>

                {/* Block Button */}
                <button
                  onClick={async () => {
                    const isCurrentlyBlocked = investigatingUser.user.isBlocked;
                    const label = isCurrentlyBlocked ? 'Unblock' : 'Block';
                    if (!confirm(`${label} ${investigatingUser.user.firstName} ${investigatingUser.user.lastName}?`)) return;
                    const ok = await handleToggleBlock(investigatingUser.user.id, isCurrentlyBlocked);
                    if (ok) {
                      setInvestigatingUser((prev: any) => ({
                        ...prev,
                        user: { ...prev.user, isBlocked: !isCurrentlyBlocked }
                      }));
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    investigatingUser.user.isBlocked
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:scale-[1.02] active:scale-95'
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {investigatingUser.user.isBlocked ? '✓ Unblock Account' : '⊘ Block Account'}
                </button>
              </div>
            </div>

            {/* Heuristics Alert */}
            {investigatingUser.scamCommentsCount > 0 && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
                <span><strong>System Heuristic Flag:</strong> Detected {investigatingUser.scamCommentsCount} scam/fraud keyword flags in comments!</span>
              </div>
            )}

            {/* Scrollable list of comments */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Info className="w-4 h-4 text-gray-400" /> Transaction Review Comments ({investigatingUser.userReviews.length})
              </h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {investigatingUser.userReviews.map((rev: any) => {
                  const commentText = rev.comment || '';
                  const lowercaseComment = commentText.toLowerCase();
                  const scamWords = ["scam", "fake", "cheat", "fraud", "liar", "stole", "money", "demand", "rob", "demanded", "scammer", "payment", "hostile", "rude", "extort"];
                  const isScamMatch = scamWords.some(word => lowercaseComment.includes(word));
                  
                  const highlightScamWords = (text: string) => {
                    if (!text) return "";
                    let regex = new RegExp(`\\b(${scamWords.join('|')})\\b`, 'gi');
                    return text.replace(regex, `<mark class="text-red-400 bg-red-500/15 border border-red-500/20 px-1 rounded font-semibold">$1</mark>`);
                  };

                  return (
                    <div 
                      key={rev.id} 
                      className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1.5 transition-all ${
                        isScamMatch 
                          ? 'bg-red-500/5 border-red-500/25' 
                          : 'bg-white/5 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 font-semibold">{rev.reviewer?.firstName} {rev.reviewer?.lastName}</span>
                        <div className="flex gap-1 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400 animate-[pulse_3s_infinite]' : 'text-gray-600'}`} />
                          ))}
                        </div>
                      </div>
                      <p 
                        className="text-gray-300 italic"
                        dangerouslySetInnerHTML={{ __html: `"${highlightScamWords(commentText)}"` }}
                      />
                      <div className="text-[10px] text-gray-500 text-right">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInvestigatingUser(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/5"
              >
                Close Investigation
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
