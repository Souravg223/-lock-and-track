"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, MapPin, Package, Shield, Settings, Bell, ChevronRight, LogOut, Loader2, Plus, Calendar, AlertCircle, User } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  trustScore?: number;
}

interface LostItem {
  id: string;
  title: string;
  category: string;
  brand?: string;
  color?: string;
  description: string;
  lastSeenLocation: string;
  dateLost: string;
  rewardAmount?: number;
  status: string;
  user: { id: string; email: string };
  createdAt: string;
  imageUrl?: string;
}

interface FoundItem {
  id: string;
  title: string;
  category: string;
  brand?: string;
  color?: string;
  description: string;
  foundLocation: string;
  dateFound: string;
  safeStorageInfo?: string;
  status: string;
  user: { id: string; email: string };
  createdAt: string;
  imageUrl?: string;
}

interface Match {
  id: string;
  lostItem: LostItem;
  foundItem: FoundItem;
  matchPercentage: number;
  aiConfidenceScore: number;
  status: string;
}

export default function DashboardPage() {
  const { user, isAuthenticated, logout, updateUser } = useAuthStore() as { user: User | null; isAuthenticated: boolean; logout: () => void; updateUser: (user: Partial<User>) => void };
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myItems, setMyItems] = useState<( { type: 'LOST' } & LostItem | { type: 'FOUND' } & FoundItem )[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [adminStats, setAdminStats] = useState<{ totalLostItems: number; totalFoundItems: number; totalMatches: number; totalUsers: number } | null>(null);
  const [loadingAdminStats, setLoadingAdminStats] = useState(false);
  const [selectedItem, setSelectedItem] = useState<( { type: 'LOST' } & LostItem | { type: 'FOUND' } & FoundItem ) | null>(null);

  // Edit Profile States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editBio, setEditBio] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Sync inputs with user object when it loads
  useEffect(() => {
    if (user) {
      setEditFirstName(user.firstName || '');
      setEditLastName(user.lastName || '');
      setEditPhoneNumber(user.phoneNumber || '');
      setEditAvatarUrl(user.avatarUrl || '');
      setEditBio(user.bio || '');
    }
  }, [user]);

  const presetAvatars = [
    { name: 'Professional Male', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
    { name: 'Professional Female', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
    { name: 'Sleek Avatar Male', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' },
    { name: 'Modern Female', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
    { name: 'Minimalist Dark', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
    { name: 'Minimalist Light', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80' },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setUpdateError('');
    try {
      await api.put('/auth/profile', {
        firstName: editFirstName,
        lastName: editLastName,
        phoneNumber: editPhoneNumber || null,
        avatarUrl: editAvatarUrl || null,
        bio: editBio || null
      });
      
      updateUser({
        firstName: editFirstName,
        lastName: editLastName,
        phoneNumber: editPhoneNumber || undefined,
        avatarUrl: editAvatarUrl || undefined,
        bio: editBio || undefined
      });
      setIsEditProfileOpen(false);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setUpdateError(err.response?.data?.message || 'Server error. Please try again.');
    } finally {
      setUpdatingProfile(false);
    }
  };


  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const userEmail = user?.email;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        // Fetch all lost items, found items, matches, and leaderboard parallelly
        const [lostRes, foundRes, matchesRes, leaderboardRes] = await Promise.all([
          api.get('/items/lost?all=true'),
          api.get('/items/found?all=true'),
          api.get('/matches').catch(() => ({ data: { data: [] } })),
          api.get('/users/leaderboard').catch(() => ({ data: { data: [] } }))
        ]);

        const allLost = (lostRes.data?.data || []) as LostItem[];
        const allFound = (foundRes.data?.data || []) as FoundItem[];
        const allMatches = (matchesRes.data?.data || []) as Match[];

        // Filter items reported by current user
        const myLost = allLost
          .filter(item => item.user?.email === userEmail)
          .map(item => ({ ...item, type: 'LOST' as const }));

        const myFound = allFound
          .filter(item => item.user?.email === userEmail)
          .map(item => ({ ...item, type: 'FOUND' as const }));

        // Combine and sort by createdAt or date reported
        const combined = [...myLost, ...myFound].sort(
          (a: any, b: any) => new Date(b.createdAt || b.dateLost || b.dateFound).getTime() - new Date(a.createdAt || a.dateLost || a.dateFound).getTime()
        );

        setMyItems(combined);
        setMatchCount(allMatches.filter((m: any) => m.status === 'PENDING').length);
        setLeaderboard(leaderboardRes.data?.data || []);

        if (user?.role === 'ROLE_ADMIN') {
          try {
            setLoadingAdminStats(true);
            const statsRes = await api.get('/admin/stats');
            setAdminStats(statsRes.data?.data || null);
          } catch (e) {
            console.error("Error fetching admin stats:", e);
          } finally {
            setLoadingAdminStats(false);
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [isAuthenticated, user]);

  if (!mounted || !isAuthenticated) return null;

  const stats = [
    { label: 'Active Reports', value: loading ? '...' : myItems.length.toString(), icon: <Package className="w-5 h-5 text-blue-400" /> },
    { label: 'AI Matches', value: loading ? '...' : matchCount.toString(), icon: <Search className="w-5 h-5 text-primary" /> },
    { label: 'Trust Score', value: user?.trustScore !== undefined ? user?.trustScore.toString() : '100', icon: <Shield className="w-5 h-5 text-emerald-400" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          <div className="glass-card mb-6">
            <div className="flex items-center gap-4 mb-4">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full object-cover border border-primary/30 shadow-md shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl border border-primary/30 shrink-0">
                  {user?.firstName?.[0] || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-white font-semibold truncate">{user?.firstName} {user?.lastName}</h3>
                <p className="text-sm text-gray-400 truncate">{user?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Verified Member'}</p>
              </div>
            </div>

            {user?.bio && (
              <p className="text-xs text-gray-400 mb-4 italic line-clamp-3 bg-white/5 p-2.5 rounded-lg border border-white/5">
                "{user.bio}"
              </p>
            )}

            <button 
              onClick={() => setIsEditProfileOpen(true)}
              className="w-full flex items-center justify-center gap-2 text-primary hover:text-primary/80 text-sm font-medium p-2 rounded-lg hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-colors mb-2"
            >
              <User className="w-4 h-4" />
              Edit Profile
            </button>

            <button onClick={() => { logout(); router.push('/login'); }} className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium p-2 rounded-lg hover:bg-red-500/10 transition-colors">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center justify-between p-3 rounded-xl bg-white/10 text-white font-medium border border-white/10">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-primary" /> My Reports
              </div>
            </Link>
            <Link href="/dashboard/matches" className="flex items-center justify-between p-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white font-medium transition-colors">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5" /> AI Matches
              </div>
              {matchCount > 0 && (
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/20">
                    {matchCount}
                  </span>
                </span>
              )}
            </Link>
          </nav>

          {/* Trust Score Leaderboard */}
          <div className="glass-card mt-6">
            <h4 className="text-white font-extrabold text-xs tracking-wider uppercase mb-3 flex items-center gap-1.5 text-emerald-400">
              <Shield className="w-4 h-4 text-emerald-400 animate-pulse" /> Honest Helpers
            </h4>
            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <div className="text-xs text-gray-500 italic py-2">Loading top helpers...</div>
              ) : (
                leaderboard.map((u, i) => (
                  <div key={u.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold border shrink-0 ${
                        i === 0 ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' :
                        i === 1 ? 'bg-slate-300/20 text-slate-200 border-slate-300/30' :
                        i === 2 ? 'bg-amber-700/20 text-amber-600 border-amber-800/30' :
                        'bg-white/5 text-gray-400 border-white/10'
                      }`}>
                        {i + 1}
                      </div>
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-white/15 shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] border border-primary/20 shrink-0">
                          {u.firstName?.[0] || 'U'}
                        </div>
                      )}
                      <span className="text-xs font-semibold text-gray-300 truncate">{u.firstName} {u.lastName?.[0]}.</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap shrink-0">
                      ★ {u.trustScore || 100}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          
          {/* Welcome header & CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Welcome back, {user?.firstName}!</h1>
              <p className="text-gray-400 mt-1">Manage your lost and found belongings and view AI matches.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/report-lost" className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                <Plus className="w-4 h-4" /> Report Lost
              </Link>
              <Link href="/report-found" className="px-5 py-2.5 glass border-white/10 hover:bg-white/5 text-white font-semibold rounded-xl flex items-center gap-2 transition-all">
                <Plus className="w-4 h-4 text-emerald-400" /> Report Found
              </Link>
            </div>
          </div>

          {/* Admin Analytics Panel */}
          {user?.role === 'ROLE_ADMIN' && adminStats && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-primary/10 border border-purple-500/25 rounded-3xl p-6 relative overflow-hidden backdrop-blur-lg"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none animate-pulse" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
                    System Control & Analytics Panel
                  </h3>
                  <p className="text-xs text-purple-300/80">Real-time system health and database statistics for administrators.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-black/35 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Registered</span>
                  <span className="text-2xl font-black text-white mt-2 flex items-center gap-2">
                    {adminStats.totalUsers}
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">Active</span>
                  </span>
                </div>
                <div className="bg-black/35 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lost Reports</span>
                  <span className="text-2xl font-black text-rose-400 mt-2">{adminStats.totalLostItems}</span>
                </div>
                <div className="bg-black/35 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Found Reports</span>
                  <span className="text-2xl font-black text-emerald-400 mt-2">{adminStats.totalFoundItems}</span>
                </div>
                <div className="bg-black/35 border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Matches Found</span>
                  <span className="text-2xl font-black text-primary mt-2 flex items-center gap-2">
                    {adminStats.totalMatches}
                    <span className="text-[9px] font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full border border-purple-400/20">AI Scanned</span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card flex items-center gap-4"
              >
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* User's Reports */}
          <div className="glass-card">
            <h2 className="text-xl font-bold text-white mb-6">My Reported Items</h2>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm">Loading your reports...</p>
              </div>
            ) : myItems.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-4">
                  <AlertCircle className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No Reports Found</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  You haven't reported any lost or found items yet. Report something to start finding matches.
                </p>
                <div className="flex gap-3">
                  <Link href="/report-lost" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all">
                    Report Lost
                  </Link>
                  <Link href="/report-found" className="px-4 py-2 glass border-white/10 text-white rounded-lg text-sm font-medium transition-all hover:bg-white/5">
                    Report Found
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {myItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-4 rounded-xl bg-black/20 border border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group hover:border-white/20 hover:scale-[1.01] hover:bg-black/30 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center border border-white/5 shrink-0 mt-0.5 overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className={`w-6 h-6 ${item.type === 'LOST' ? 'text-primary' : 'text-emerald-400'}`} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-white font-semibold text-base">{item.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            item.type === 'LOST' 
                              ? 'bg-primary/10 text-primary border-primary/20' 
                              : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5 flex-wrap">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" /> 
                          {item.type === 'LOST' ? item.lastSeenLocation : item.foundLocation}
                          <span className="text-white/10">•</span>
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          {new Date(item.type === 'LOST' ? item.dateLost : item.dateFound).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 border-white/5 pt-3 sm:pt-0 shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        item.status === 'LOST' || item.status === 'UNCLAIMED'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                      }`}>
                        {item.status}
                      </span>
                      <button 
                        onClick={() => setSelectedItem(item)}
                        className="p-2 text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl glass border border-white/10 p-6 rounded-3xl relative shadow-2xl space-y-6">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xs font-semibold transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5"
            >
              Close
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                  selectedItem.type === 'LOST' 
                    ? 'bg-primary/10 text-primary border-primary/20' 
                    : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                }`}>
                  {selectedItem.type}
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                  selectedItem.status === 'LOST' || selectedItem.status === 'UNCLAIMED'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                }`}>
                  {selectedItem.status}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">{selectedItem.title}</h2>
            </div>

            {/* Main Content Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Image or Icon */}
              <div className="w-full aspect-video md:aspect-square bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center">
                {selectedItem.imageUrl ? (
                  <img src={selectedItem.imageUrl} alt={selectedItem.title} className="w-full h-full object-cover" />
                ) : (
                  <Package className={`w-16 h-16 ${selectedItem.type === 'LOST' ? 'text-primary' : 'text-emerald-400'}`} />
                )}
              </div>

              {/* Right Column: Key-Value Pairs */}
              <div className="space-y-4 text-sm text-gray-300">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</h4>
                  <p className="text-white font-medium mt-0.5">{selectedItem.category}</p>
                </div>

                {selectedItem.brand && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Brand</h4>
                    <p className="text-white font-medium mt-0.5">{selectedItem.brand}</p>
                  </div>
                )}

                {selectedItem.color && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Color</h4>
                    <p className="text-white font-medium mt-0.5">{selectedItem.color}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {selectedItem.type === 'LOST' ? 'Last Seen Location' : 'Found Location'}
                  </h4>
                  <p className="text-white font-medium mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {selectedItem.type === 'LOST' ? selectedItem.lastSeenLocation : selectedItem.foundLocation}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {selectedItem.type === 'LOST' ? 'Date Lost' : 'Date Found'}
                  </h4>
                  <p className="text-white font-medium mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(selectedItem.type === 'LOST' ? selectedItem.dateLost : selectedItem.dateFound).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                {selectedItem.type === 'LOST' && selectedItem.rewardAmount !== undefined && selectedItem.rewardAmount > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reward Offered</h4>
                    <p className="text-emerald-400 font-bold mt-0.5">${selectedItem.rewardAmount}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description & Recovery Instructions */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</h4>
                <p className="text-gray-300 text-sm mt-1 leading-relaxed">"{selectedItem.description}"</p>
              </div>

              {selectedItem.type === 'FOUND' && selectedItem.safeStorageInfo && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Safe Storage Info</h4>
                  <p className="text-gray-300 text-sm mt-1 leading-relaxed">{selectedItem.safeStorageInfo}</p>
                </div>
              )}
            </div>

            {/* AI Match Navigation Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <Link 
                href="/dashboard/matches"
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-semibold rounded-xl flex items-center gap-2 transition-all"
              >
                <Search className="w-4 h-4" /> View AI Matches
              </Link>
              <button 
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all border border-white/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#0f172a] dark:bg-[#0f172a] border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <h3 className="text-xl font-bold text-white">Edit Profile Details</h3>
                <p className="text-xs text-gray-400 mt-1">Customize your public presence. Skip photo or bio anytime.</p>
              </div>
              <button 
                onClick={() => setIsEditProfileOpen(false)}
                className="text-gray-400 hover:text-white transition-colors bg-white/5 p-1.5 rounded-full hover:bg-white/10"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            {updateError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Preset Avatars & Avatar Preview */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Profile Photo (Optional)</label>
                <div className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                  <img 
                    src={editAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-full object-cover border border-primary/30 shadow-inner"
                  />
                  <div className="space-y-1.5 flex-1">
                    <input 
                      type="text" 
                      placeholder="Paste custom avatar URL..." 
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <p className="text-[10px] text-gray-500">Leave blank to skip or choose a premium preset below:</p>
                  </div>
                </div>

                {/* Grid of Preset Avatars */}
                <div className="grid grid-cols-6 gap-2">
                  {presetAvatars.map((avatar, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditAvatarUrl(avatar.url)}
                      className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all transform hover:scale-105 active:scale-95 ${editAvatarUrl === avatar.url ? 'border-primary scale-105 shadow-lg shadow-primary/20' : 'border-transparent hover:border-white/20'}`}
                      title={avatar.name}
                    >
                      <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">First Name</label>
                  <input 
                    type="text" 
                    required 
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Last Name</label>
                  <input 
                    type="text" 
                    required 
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              {/* Phone Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Phone Number (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Enter phone number..." 
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Bio Textarea */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bio / Description (Optional)</label>
                  <span className="text-[10px] text-gray-500">{editBio.length}/1000</span>
                </div>
                <textarea 
                  placeholder="Write a brief bio about yourself. Skip this by leaving it empty." 
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value.slice(0, 1000))}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all border border-white/5"
                >
                  Skip & Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 flex items-center gap-2"
                >
                  {updatingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
