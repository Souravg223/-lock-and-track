"use client";

import Link from 'next/link';
import { Search, Bell, User, MapPin, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Notifications State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ lost: any[], found: any[] }>({ lost: [], found: [] });
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  // Notification baseline: count already present when user first logs in (no blink for these)
  const [blinkActive, setBlinkActive] = useState(false);
  const prevUnreadRef = useState<number | null>(null);

  // Fetch matches as live database notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    let baselineSet = false;
    let prevCount = 0;

    async function fetchNotifications() {
      try {
        const [notifRes, unreadRes] = await Promise.all([
          api.get('/notifications').catch(() => null),
          api.get('/notifications/unread-count').catch(() => null)
        ]);
        const newCount: number = unreadRes?.data?.data || 0;
        setNotifications(notifRes?.data?.data || []);
        setUnreadCount(newCount);

        if (!baselineSet) {
          // First load — store baseline, no blink
          baselineSet = true;
          prevCount = newCount;
        } else if (newCount > prevCount) {
          // New notification arrived AFTER login → blink!
          setBlinkActive(true);
          prevCount = newCount;
        } else {
          prevCount = newCount;
        }
      } catch (e) {
        console.warn("Notifications fetch ignored safely.");
      }
    }

    fetchNotifications();
    
    // Poll notifications every 5 seconds dynamically
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);


  const handleNotificationClick = async (notif: any) => {
    try {
      if (!notif.isRead) {
        await api.put(`/notifications/${notif.id}/read`);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.warn("Error marking notification read:", e);
    }
    setNotificationsOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setBlinkActive(false);
    } catch (e) {
      console.warn("Error marking all read:", e);
    }
  };

  // Global search implementation
  useEffect(() => {
    if (!searchOpen || searchQuery.trim().length < 2) {
      setSearchResults({ lost: [], found: [] });
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const [lostRes, foundRes] = await Promise.all([
          api.get('/items/lost'),
          api.get('/items/found')
        ]);
        const q = searchQuery.toLowerCase();
        const allLost = lostRes.data?.data || [];
        const allFound = foundRes.data?.data || [];
        
        const filteredLost = allLost.filter((item: any) => 
          item.title.toLowerCase().includes(q) || 
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.lastSeenLocation && item.lastSeenLocation.toLowerCase().includes(q))
        );
        
        const filteredFound = allFound.filter((item: any) => 
          item.title.toLowerCase().includes(q) || 
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.foundLocation && item.foundLocation.toLowerCase().includes(q))
        );
        
        setSearchResults({ lost: filteredLost, found: filteredFound });
      } catch (err) {
        console.warn("Error performing global search:", err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen]);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 glass border-b-0 border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
                  F
                </div>
                <span className="text-xl font-bold tracking-tight text-white">Findora<span className="text-primary text-gradient">AI</span></span>
              </Link>
              
              <div className="hidden md:block">
                <div className="flex items-center space-x-1">
                  <Link href="/lost" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    Lost Items
                  </Link>
                  <Link href="/found" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    Found Items
                  </Link>
                  <Link href="/map" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Live Map
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 text-gray-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {mounted && theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400 animate-[spin_10s_linear_infinite]" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-400" />
                )}
              </button>

              <button 
                onClick={() => {
                  setSearchOpen(true);
                  setNotificationsOpen(false);
                }}
                className="p-2 text-gray-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
              >
                <Search className="w-5 h-5" />
              </button>
              
              {mounted && isAuthenticated ? (
                <>
                  <div className="relative">
                    <button 
                      onClick={() => {
                        setNotificationsOpen(!notificationsOpen);
                        // Stop blinking as soon as user opens the panel
                        if (!notificationsOpen) setBlinkActive(false);
                      }}
                      className="p-2 text-gray-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full relative animate-all duration-300"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
                          {blinkActive ? (
                            // NEW notification → red ping blink
                            <span className="flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[8px] font-bold text-white items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            </span>
                          ) : (
                            // OLD unread → quiet grey/indigo count badge, no blink
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600/80 text-[8px] font-bold text-white items-center justify-center border border-indigo-400/30">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                    {notificationsOpen && (
                      <div className="absolute right-0 mt-3 w-80 glass border border-white/10 rounded-2xl p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                          <h4 className="text-white font-bold text-sm">Notifications</h4>
                          {unreadCount > 0 && (
                            <button 
                              onClick={handleMarkAllRead}
                              className="text-[10px] text-primary hover:underline font-semibold"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {notifications.length === 0 ? (
                            <div className="py-6 text-center text-[11px] text-gray-400">
                              No notifications yet. All caught up!
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <Link 
                                key={n.id} 
                                href="/dashboard/matches" 
                                onClick={() => handleNotificationClick(n)}
                                className={`block p-2 rounded-xl transition-all border ${
                                  !n.isRead 
                                    ? 'bg-primary/5 hover:bg-primary/10 border-primary/20' 
                                    : 'hover:bg-white/5 border-transparent hover:border-white/5'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <h5 className={`text-xs font-semibold ${!n.isRead ? 'text-white font-bold' : 'text-gray-400'}`}>
                                    {n.type === 'MATCH_FOUND' ? '🔥 New AI Match!' : n.type === 'MATCH_ACCEPTED' ? '🤝 Match Accepted!' : '💬 New Message!'}
                                  </h5>
                                  <span className="text-[8px] text-gray-500 shrink-0 mt-0.5">
                                    {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                </div>
                                <p className={`text-[11px] mt-1 leading-relaxed ${!n.isRead ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
                                  {n.message}
                                </p>
                              </Link>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {user?.role === 'ROLE_ADMIN' && (
                    <Link href="/admin" className="px-4 py-1.5 text-xs font-bold text-white bg-primary/20 hover:bg-primary/40 border border-primary/50 rounded-full transition-all flex items-center shadow-lg shadow-primary/10">
                      Admin
                    </Link>
                  )}
                  <Link href="/dashboard" className="transition-all duration-300 transform hover:scale-105 active:scale-95 shrink-0 flex items-center">
                    {user?.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt="Profile" 
                        className="w-9 h-9 rounded-full object-cover border border-white/20 shadow-md hover:border-primary/50 transition-colors"
                      />
                    ) : (
                      <div className="p-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </Link>
                </>
              ) : (
                mounted && (
                  <div className="flex items-center gap-2">
                    <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                      Log in
                    </Link>
                    <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-full transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40">
                      Sign up
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Global Search Overlay Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex flex-col justify-start items-center pt-24 px-4 sm:px-6 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl glass border border-white/10 p-6 rounded-3xl relative shadow-2xl">
            <button 
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xs font-semibold transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5"
            >
              Close
            </button>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" /> Global Database Search
            </h2>
            <div className="relative">
              <input 
                type="text"
                autoFocus
                placeholder="Search lost phones, wallets, bags, keys, pets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/15 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary transition-all text-base"
              />
              <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
            </div>
            
            <div className="mt-6 space-y-6 max-h-[350px] overflow-y-auto pr-1">
              {searching ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Searching matching database...
                </div>
              ) : searchQuery.trim().length > 0 && searchQuery.trim().length < 2 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  Please type at least 2 characters...
                </div>
              ) : searchResults.lost.length === 0 && searchResults.found.length === 0 && searchQuery.trim().length >= 2 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  No matching lost or found reports found.
                </div>
              ) : (
                <>
                  {searchResults.lost.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-primary tracking-wider uppercase mb-3">Matching Lost Items</h4>
                      <div className="grid gap-3">
                        {searchResults.lost.map((item: any) => (
                          <Link 
                            key={item.id} 
                            href="/lost"
                            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                            className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                          >
                            <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <Search className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <h5 className="text-white font-semibold text-xs">{item.title}</h5>
                              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.found.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase mb-3">Matching Found Items</h4>
                      <div className="grid gap-3">
                        {searchResults.found.map((item: any) => (
                          <Link 
                            key={item.id} 
                            href="/found"
                            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                            className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                          >
                            <div className="w-12 h-12 rounded-lg bg-emerald-400/10 border border-emerald-400/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <Search className="w-5 h-5 text-emerald-400" />
                              )}
                            </div>
                            <div>
                              <h5 className="text-white font-semibold text-xs">{item.title}</h5>
                              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
