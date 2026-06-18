"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, MapPin, Package, Shield, Settings, Bell, ChevronRight, LogOut, Loader2, Sparkles, Check, X, ArrowRight, HelpCircle, ArrowLeft, Send, Star } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface ChatMessage {
  id: string;
  matchId: string;
  senderEmail: string;
  senderName: string;
  message: string;
  createdAt: string;
}

function MatchChat({ matchId, currentUserEmail }: { matchId: string; currentUserEmail: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/chat/history/${matchId}`);
      setMessages(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching chat history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [matchId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const res = await api.post('/chat/send', { matchId, message: newMessage });
      if (res.data?.data) {
        setMessages(prev => [...prev, res.data.data]);
        setNewMessage('');
      }
    } catch (err) {
      console.error("Error sending chat message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-5 mt-6 backdrop-blur-md">
      <h4 className="text-white font-extrabold text-sm flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Secure Communication Channel (Live Chat)
      </h4>

      {/* Messages Scroll Box */}
      <div className="h-60 overflow-y-auto pr-2 space-y-3 mb-4 custom-scrollbar flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-xs">Establishing chat channel...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs italic">
            No messages sent yet. Say hi to coordinate recovery!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderEmail === currentUserEmail;
            return (
              <div 
                key={msg.id}
                className={`max-w-[75%] p-3.5 rounded-2xl text-sm leading-relaxed border transition-all ${
                  isMe 
                    ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20 ml-auto rounded-tr-none' 
                    : 'bg-white/5 text-gray-200 border-white/5 mr-auto rounded-tl-none'
                }`}
              >
                <div className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1.5 justify-between">
                  <span>{msg.senderName}</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="whitespace-pre-line">{msg.message}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Send Message Form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your secure message here..."
          className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
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
  status: string;
  contactPhoneNumber?: string;
  facebookProfile?: string;
  recoveryInstructions?: string;
  imageUrl?: string;
  user?: User;
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
  status: string;
  contactPhoneNumber?: string;
  facebookProfile?: string;
  recoveryInstructions?: string;
  imageUrl?: string;
  user?: User;
}

interface Match {
  id: string;
  lostItem: LostItem;
  foundItem: FoundItem;
  matchPercentage: number;
  aiConfidenceScore: number;
  status: string;
  disputedByEmail?: string;
  disputeReason?: string;
  handoverOtp?: string;
}

function ConfettiParticles() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];
    const newParticles = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage width
      y: -10 - Math.random() * 20, // start above screen
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2, // staggering start
      duration: 3 + Math.random() * 3, // fall speed
      shape: Math.random() > 0.5 ? 'circle' : 'square',
      wobble: Math.random() * 40 - 20
    }));
    setParticles(newParticles);

    // Auto cleanup after 6 seconds
    const timer = setTimeout(() => {
      setParticles([]);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: `${p.y}vh`, rotate: 0, opacity: 0.9 }}
          animate={{
            y: '110vh',
            x: `${p.x + p.wobble}vw`,
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            opacity: 0
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'linear',
            repeat: 0
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.shape === 'circle' ? p.size : p.size * 0.6,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            backgroundColor: p.color,
            boxShadow: `0 0 8px ${p.color}80`
          }}
        />
      ))}
    </div>
  );
}

export default function MatchesPage() {
  const { user, isAuthenticated, logout } = useAuthStore() as { user: User | null; isAuthenticated: boolean; logout: () => void };
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Custom Secure Handover & Scam Dispute States
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [otpInputs, setOtpInputs] = useState<{[key: string]: string}>({});
  const [otpVerifyLoading, setOtpVerifyLoading] = useState(false);

  // Feedback / Review States
  const [submittedReviews, setSubmittedReviews] = useState<string[]>([]);
  const [ratings, setRatings] = useState<{[key: string]: number}>({});
  const [comments, setComments] = useState<{[key: string]: string}>({});
  const [reviewLoading, setReviewLoading] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const fetchMatches = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await api.get('/matches');
      setMatches(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching matches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [isAuthenticated]);

  const handleAccept = async (matchId: string) => {
    try {
      setActioningId(matchId);
      await api.put(`/matches/${matchId}/status`, null, { params: { status: 'ACCEPTED' } });
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'ACCEPTED' } : m));
      // Trigger success confetti explosion!
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 6000);
    } catch (err) {
      console.error("Error accepting match:", err);
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (matchId: string) => {
    try {
      setActioningId(matchId);
      await api.put(`/matches/${matchId}/status`, null, { params: { status: 'REJECTED' } });
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'REJECTED' } : m));
    } catch (err) {
      console.error("Error rejecting match:", err);
    } finally {
      setActioningId(null);
    }
  };

  const handleDispute = async (matchId: string, reasonText: string) => {
    if (!reasonText.trim()) return;
    try {
      setDisputeLoading(true);
      await api.put(`/matches/${matchId}/dispute`, null, { params: { reason: reasonText } });
      setMatches(prev => prev.map(m => m.id === matchId ? { 
        ...m, 
        status: 'DISPUTED', 
        disputedByEmail: user?.email || '', 
        disputeReason: reasonText 
      } : m));
      setDisputeReason('');
      alert("Match has been successfully DISPUTED and locked. Administrators have been alerted.");
    } catch (err) {
      console.error("Error disputing match:", err);
    } finally {
      setDisputeLoading(false);
    }
  };

  const handleGenerateOtp = async (matchId: string) => {
    try {
      setActioningId(matchId);
      const res = await api.post(`/matches/${matchId}/generate-handover-otp`);
      const generatedOtp = res.data?.data;
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, handoverOtp: generatedOtp } : m));
      alert(`Handover Verification OTP generated successfully: ${generatedOtp}\n\nProvide this code to the Finder physically to verify handover.`);
    } catch (err) {
      console.error("Error generating handover OTP:", err);
    } finally {
      setActioningId(null);
    }
  };

  const handleVerifyOtp = async (matchId: string) => {
    const inputOtp = otpInputs[matchId];
    if (!inputOtp) return;
    try {
      setOtpVerifyLoading(true);
      await api.post(`/matches/${matchId}/verify-handover-otp`, null, { params: { otp: inputOtp } });
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'SUCCESSFULLY_RETURNED' } : m));
      alert("OTP verified successfully! Item marked as successfully returned, and trust scores updated (+20 Owner, +30 Finder)!");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 8000);
    } catch (err) {
      alert("Invalid Handover Verification OTP code.");
      console.error("Error verifying handover OTP:", err);
    } finally {
      setOtpVerifyLoading(false);
    }
  };

  const handleSubmitReview = async (matchId: string) => {
    const rating = ratings[matchId] || 5;
    const comment = comments[matchId] || '';
    if (!comment.trim()) {
      alert("Please enter a feedback comment.");
      return;
    }

    try {
      setReviewLoading(prev => ({ ...prev, [matchId]: true }));
      await api.post('/reviews', { matchId, rating, comment });
      setSubmittedReviews(prev => [...prev, matchId]);
      alert("Thank you for your feedback! Your review has been submitted and trust scores updated.");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewLoading(prev => ({ ...prev, [matchId]: false }));
    }
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <>
      {showConfetti && <ConfettiParticles />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          <div className="glass-card mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl border border-primary/30">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div>
                <h3 className="text-white font-semibold">{user?.firstName} {user?.lastName}</h3>
                <p className="text-sm text-gray-400">{user?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Verified Member'}</p>
              </div>
            </div>
            <button onClick={() => { logout(); router.push('/login'); }} className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium p-2 rounded-lg hover:bg-red-500/10 transition-colors">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          <nav className="space-y-1">
            <Link href="/dashboard" className="flex items-center justify-between p-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white font-medium transition-colors">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5" /> My Reports
              </div>
            </Link>
            <Link href="/dashboard/matches" className="flex items-center justify-between p-3 rounded-xl bg-white/10 text-white font-medium border border-white/10">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-primary" /> AI Matches
              </div>
              {matches.filter(m => m.status === 'PENDING').length > 0 && (
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/20">
                    {matches.filter(m => m.status === 'PENDING').length}
                  </span>
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          
          {/* Back Button */}
          <div className="flex justify-start">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 hover:border-white/10 text-sm font-semibold transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              <h1 className="text-3xl font-extrabold text-white">AI Matching Center</h1>
            </div>
            <p className="text-gray-400">Our advanced semantic intelligence scans your reports and connects you instantly.</p>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm">Scanning database for AI matches...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-4">
                <Sparkles className="w-8 h-8 text-primary/60" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No AI Matches Yet</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Our matching engine runs instantly in the background. If another user reports an item matching your description, you'll see it here right away!
              </p>
              <Link href="/dashboard" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-all border border-white/10">
                Back to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {matches.map((match) => {
                const matchPercent = Math.round(match.matchPercentage);
                const isPending = match.status === 'PENDING';
                const isAccepted = match.status === 'ACCEPTED';
                
                return (
                  <motion.div 
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card overflow-hidden relative border border-white/5 hover:border-white/10 transition-all"
                  >
                    {/* Top match header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/10 mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                          matchPercent >= 80 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          <Sparkles className="w-3.5 h-3.5" />
                          {matchPercent}% AI Match Confidence
                        </div>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          match.status === 'ACCEPTED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                            : match.status === 'REJECTED'
                            ? 'bg-red-500/15 text-red-400 border-red-500/20'
                            : match.status === 'DISPUTED'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/20 animate-pulse'
                            : match.status === 'SUCCESSFULLY_RETURNED'
                            ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20'
                            : 'bg-amber-500/15 text-amber-500 border-amber-500/20'
                        }`}>
                          {match.status === 'SUCCESSFULLY_RETURNED' ? 'RETURNED & VERIFIED' : match.status}
                        </span>
                      </div>
                      
                      {isPending && (
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => handleReject(match.id)}
                            disabled={actioningId !== null}
                            className="px-3 py-1.5 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-white/5 transition-all"
                          >
                            <X className="w-3.5 h-3.5" /> Decline Match
                          </button>
                          <button 
                            onClick={() => handleAccept(match.id)}
                            disabled={actioningId !== null}
                            className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-lg shadow-primary/20 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept Match
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Match Comparison Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
                      
                      {/* Left: Lost Item */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                          <Package className="w-4 h-4" /> Lost Item Detail
                        </div>
                        <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-3 overflow-hidden">
                          {match.lostItem.imageUrl && (
                            <div className="w-full h-40 rounded-xl overflow-hidden mb-3 border border-white/10 bg-black/40">
                              <img src={match.lostItem.imageUrl} alt={match.lostItem.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <h3 className="text-white font-bold text-lg">{match.lostItem.title}</h3>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-400 font-medium">Category</p>
                              <p className="text-white font-semibold mt-0.5">{match.lostItem.category}</p>
                            </div>
                            {match.lostItem.brand && (
                              <div>
                                <p className="text-gray-400 font-medium">Brand</p>
                                <p className="text-white font-semibold mt-0.5">{match.lostItem.brand}</p>
                              </div>
                            )}
                            {match.lostItem.color && (
                              <div>
                                <p className="text-gray-400 font-medium">Color</p>
                                <p className="text-white font-semibold mt-0.5">{match.lostItem.color}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-gray-400 font-medium">Lost Location</p>
                              <p className="text-white font-semibold mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                {match.lostItem.lastSeenLocation}
                              </p>
                            </div>
                          </div>
                          <div className="border-t border-white/5 pt-3">
                            <p className="text-gray-400 text-xs font-medium mb-1">Item Description</p>
                            <p className="text-gray-300 text-sm leading-relaxed italic">
                              "{match.lostItem.description}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Floating matching arrow indicator */}
                      <div className="hidden lg:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center text-primary z-10 shadow-lg shadow-black/40 backdrop-blur-md">
                        <ArrowRight className="w-5 h-5" />
                      </div>

                      {/* Right: Found Item */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                          <Package className="w-4 h-4" /> Matching Found Item
                        </div>
                        <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-3 overflow-hidden">
                          {match.foundItem.imageUrl && (
                            <div className="w-full h-40 rounded-xl overflow-hidden mb-3 border border-white/10 bg-black/40">
                              <img src={match.foundItem.imageUrl} alt={match.foundItem.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <h3 className="text-white font-bold text-lg">{match.foundItem.title}</h3>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-400 font-medium">Category</p>
                              <p className="text-white font-semibold mt-0.5">{match.foundItem.category}</p>
                            </div>
                            {match.foundItem.brand && (
                              <div>
                                <p className="text-gray-400 font-medium">Brand</p>
                                <p className="text-white font-semibold mt-0.5">{match.foundItem.brand}</p>
                              </div>
                            )}
                            {match.foundItem.color && (
                              <div>
                                <p className="text-gray-400 font-medium">Color</p>
                                <p className="text-white font-semibold mt-0.5">{match.foundItem.color}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-gray-400 font-medium">Found Location</p>
                              <p className="text-white font-semibold mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                {match.foundItem.foundLocation}
                              </p>
                            </div>
                          </div>
                          <div className="border-t border-white/5 pt-3">
                            <p className="text-gray-400 text-xs font-medium mb-1">Item Description</p>
                            <p className="text-gray-300 text-sm leading-relaxed italic">
                              "{match.foundItem.description}"
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Action Panel */}
                    {match.status === 'DISPUTED' && (
                      <div className="mt-6 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                        <h4 className="text-rose-400 font-extrabold text-sm flex items-center gap-2">
                          <Shield className="w-5 h-5 animate-pulse" /> Match Locked & Disputed
                        </h4>
                        <p className="text-gray-300 text-xs leading-relaxed">
                          This match has been flagged and locked by <span className="text-white font-bold">{match.disputedByEmail}</span>. All operations, including communications and physical handover verification, are suspended pending administrator dispute resolution.
                        </p>
                        <div className="p-3 bg-black/25 rounded-xl border border-white/5 text-gray-400 text-xs italic">
                          Reason: "{match.disputeReason}"
                        </div>
                      </div>
                    )}

                    {match.status === 'SUCCESSFULLY_RETURNED' && (
                      <div className="mt-6 space-y-6">
                        <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-3">
                          <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 mx-auto border border-indigo-500/30">
                            <Check className="w-6 h-6" />
                          </div>
                          <h4 className="text-indigo-400 font-extrabold text-lg">
                            Successfully Returned & Verified!
                          </h4>
                          <p className="text-gray-300 text-xs max-w-md mx-auto">
                            The physical handover OTP has been verified. The lost item has been successfully reclaimed by its rightful owner! Trust score points (+20 Owner, +30 Finder) have been awarded.
                          </p>
                        </div>

                        {/* Submit Review Card */}
                        {!submittedReviews.includes(match.id) ? (
                          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4 backdrop-blur-md">
                            <h4 className="text-white font-extrabold text-sm flex items-center gap-2">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              Rate Your Recovery Experience
                            </h4>
                            <p className="text-xs text-gray-400">
                              Rate the other user's honesty and behavior. High ratings improve their trust score. Write a detailed comment (20+ characters) with 4-5 stars to earn them a <span className="text-amber-400 font-bold">+3 bonus</span>!
                            </p>
                            
                            {/* Star Selection */}
                            <div className="flex gap-2 items-center">
                              <span className="text-xs text-gray-300 mr-2">Honesty Rating:</span>
                              {Array.from({ length: 5 }).map((_, idx) => {
                                const starVal = idx + 1;
                                const isSelected = starVal <= (ratings[match.id] || 5);
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setRatings(prev => ({ ...prev, [match.id]: starVal }))}
                                    className="text-amber-400 hover:scale-110 active:scale-95 transition-transform"
                                  >
                                    <Star className={`w-5 h-5 ${isSelected ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
                                  </button>
                                );
                              })}
                              <span className="text-xs text-amber-300 font-bold ml-2">
                                {ratings[match.id] || 5} Stars
                              </span>
                            </div>

                            {/* Comment area */}
                            <div className="space-y-1.5">
                              <textarea
                                placeholder="Enter feedback comment about this transaction (e.g. Friendly, honest, on time)..."
                                value={comments[match.id] || ''}
                                onChange={(e) => setComments(prev => ({ ...prev, [match.id]: e.target.value }))}
                                rows={2}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400/50 resize-none"
                              />
                              {/* Bonus hint */}
                              {(() => {
                                const commentLen = (comments[match.id] || '').trim().length;
                                const rating = ratings[match.id] || 5;
                                const hasBonus = rating >= 4 && commentLen >= 20;
                                const charLeft = Math.max(0, 20 - commentLen);
                                return (
                                  <p className={`text-[10px] font-semibold transition-colors ${
                                    hasBonus ? 'text-amber-400' : 'text-gray-500'
                                  }`}>
                                    {hasBonus
                                      ? '⭐ Comment bonus unlocked! +3 extra trust score will be awarded.'
                                      : charLeft > 0
                                        ? `Write ${charLeft} more character${charLeft > 1 ? 's' : ''} with 4-5 stars to unlock +3 bonus.`
                                        : 'Select 4+ stars to unlock the +3 comment bonus.'}
                                  </p>
                                );
                              })()}
                            </div>

                            <button
                              onClick={() => handleSubmitReview(match.id)}
                              disabled={reviewLoading[match.id] || !(comments[match.id] || '').trim()}
                              className="px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all w-full flex items-center justify-center gap-2"
                            >
                              {reviewLoading[match.id] ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                                </>
                              ) : (
                                'Submit Feedback & Update Trust Score'
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold text-center">
                            ✓ Feedback submitted successfully! Thank you for keeping Findora safe.
                          </div>
                        )}
                      </div>
                    )}

                    {isAccepted && (
                      <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-2">
                          <Check className="w-5 h-5 shrink-0" />
                          Match Accepted! Retrieve contact and claim instructions below to coordinate.
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-5 rounded-2xl border border-white/10">
                          {/* Lost Item Contact Info */}
                          <div className="space-y-3">
                            <h4 className="text-white font-bold text-sm flex items-center gap-2">
                              <HelpCircle className="w-4 h-4 text-primary" /> Lost Owner Contact Details
                            </h4>
                            <div className="text-sm space-y-2 text-gray-300">
                              <p><span className="text-gray-500 font-medium">Mobile Number:</span> <span className="text-white font-bold">{match.lostItem.contactPhoneNumber || 'Not Provided'}</span></p>
                              {match.lostItem.facebookProfile && (
                                <p><span className="text-gray-500 font-medium">Facebook/WhatsApp:</span> <a href={`https://${match.lostItem.facebookProfile.replace(/https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">{match.lostItem.facebookProfile}</a></p>
                              )}
                              <p><span className="text-gray-500 font-medium">Verification/Retrieval details:</span> <span className="italic">"{match.lostItem.recoveryInstructions || 'Not Provided'}"</span></p>
                            </div>
                          </div>

                          {/* Found Item Contact Info */}
                          <div className="space-y-3">
                            <h4 className="text-white font-bold text-sm flex items-center gap-2">
                              <HelpCircle className="w-4 h-4 text-emerald-400" /> Finder Contact Details
                            </h4>
                            <div className="text-sm space-y-2 text-gray-300">
                              <p><span className="text-gray-500 font-medium">Mobile Number:</span> <span className="text-emerald-400 font-bold">{match.foundItem.contactPhoneNumber || 'Not Provided'}</span></p>
                              {match.foundItem.facebookProfile && (
                                <p><span className="text-gray-500 font-medium">Facebook/WhatsApp:</span> <a href={`https://${match.foundItem.facebookProfile.replace(/https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline font-semibold">{match.foundItem.facebookProfile}</a></p>
                              )}
                              <p><span className="text-gray-500 font-medium">Claim/Meeting Instructions:</span> <span className="italic">"{match.foundItem.recoveryInstructions || 'Not Provided'}"</span></p>
                            </div>
                          </div>
                        </div>

                        {/* SECURE HANDOVER & SCAM DISPUTE PANEL */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/20 p-5 rounded-2xl border border-white/5">
                          {/* Left Side: Physical Handover OTP */}
                          <div className="space-y-3 border-r border-white/5 pr-0 md:pr-6">
                            <h4 className="text-white font-bold text-sm flex items-center gap-2 text-indigo-400">
                              <Shield className="w-4 h-4 text-indigo-400" /> Physical Handover Verification
                            </h4>
                            
                            {user?.email === match.lostItem.user?.email ? (
                              // Owner Side: Generate OTP
                              <div className="space-y-3">
                                <p className="text-xs text-gray-400">
                                  Generate a secure 6-digit verification code. Provide this physically to the finder when you meet and verify your item.
                                </p>
                                {match.handoverOtp ? (
                                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
                                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block mb-1">Handover Verification OTP</span>
                                    <span className="text-2xl font-black text-white tracking-widest block select-all">{match.handoverOtp}</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleGenerateOtp(match.id)}
                                    disabled={actioningId !== null}
                                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all w-full flex items-center justify-center gap-2"
                                  >
                                    <Settings className="w-4 h-4 animate-spin-slow" /> Generate Handover OTP
                                  </button>
                                )}
                              </div>
                            ) : (
                              // Finder Side: Input & Verify OTP
                              <div className="space-y-3">
                                <p className="text-xs text-gray-400">
                                  Ask the owner for their 6-digit Handover Verification OTP code when you meet, enter it below to confirm safe return.
                                </p>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="Enter 6-digit OTP"
                                    value={otpInputs[match.id] || ''}
                                    onChange={(e) => setOtpInputs({ ...otpInputs, [match.id]: e.target.value })}
                                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-bold tracking-widest text-center text-xs w-full focus:outline-none focus:border-indigo-500/50"
                                  />
                                  <button
                                    onClick={() => handleVerifyOtp(match.id)}
                                    disabled={otpVerifyLoading || !otpInputs[match.id]}
                                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl text-xs font-bold transition-all shrink-0"
                                  >
                                    {otpVerifyLoading ? 'Verifying...' : 'Verify OTP'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Side: Report Scam / Dispute Match */}
                          <div className="space-y-3">
                            <h4 className="text-white font-bold text-sm flex items-center gap-2 text-rose-400">
                              <X className="w-4 h-4 text-rose-400" /> Report Scam / Dispute Match
                            </h4>
                            <p className="text-xs text-gray-400">
                              If you suspect a fraudulent claim, spam, or if a user is trying to claim the wrong item, report it to lock the match and alert admins.
                            </p>
                            <div className="space-y-2">
                              <textarea
                                placeholder="State reason for dispute..."
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                className="w-full h-16 bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500/50 resize-none"
                              />
                              <button
                                onClick={() => handleDispute(match.id, disputeReason)}
                                disabled={disputeLoading || !disputeReason.trim()}
                                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white rounded-xl text-xs font-bold transition-all w-full flex items-center justify-center gap-1.5"
                              >
                                {disputeLoading ? 'Locking Match...' : '⚠️ Lock & File Dispute'}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Live Chat component injected directly inside accepted Match Details */}
                        <MatchChat matchId={match.id} currentUserEmail={user?.email || ''} />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
    </>
  );
}
