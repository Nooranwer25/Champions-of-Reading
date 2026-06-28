import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { db, handleFirestoreError } from '../services/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Submission, SubmissionStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Calendar, ChevronRight, Edit3, Flame, Loader2, Minus, Plus, Sparkles, Trophy } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const rank = data.rank || 1;
    const totalCompetitors = data.totalCompetitors || 1;
    const top10PercentPages = data.top10PercentPages || 0;
    const isTop10Percent = data.isTop10Percent || false;
    const pagesNeededForTop10 = data.pagesNeededForTop10 || 0;
    const userPages = payload[0].value || 0;

    return (
      <div className="bg-[#0a0a0c]/95 border border-primary/30 p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-md max-w-sm relative" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
        <p className="text-[10px] font-esports font-black text-primary uppercase italic tracking-wider mb-2">{label}</p>
        
        <div className="space-y-2 font-mono text-[11px]">
          <p className="font-bold text-on-surface flex justify-between gap-6">
            <span className="text-white/60">YOUR PACE:</span>
            <span className="text-white font-black">{userPages} pages</span>
          </p>
          <p className="text-on-surface-variant flex justify-between gap-6">
            <span className="text-white/40">TOMES:</span>
            <span className="text-primary font-bold">{data.count} manifested</span>
          </p>
          
          <div className="h-px bg-white/5 my-2" />
          
          <p className="text-on-surface flex justify-between gap-6">
            <span className="text-white/60">CHAMPION RANK:</span>
            <span className="text-secondary font-black">#{rank} <span className="text-white/40 text-[9px]">/ {totalCompetitors}</span></span>
          </p>
          <p className="text-on-surface flex justify-between gap-6">
            <span className="text-white/60">TOP 10% THRESHOLD:</span>
            <span className="text-yellow-500 font-bold">{top10PercentPages} pages</span>
          </p>
          
          <div className="mt-3 pt-2 border-t border-white/5">
            {isTop10Percent ? (
              <span className="text-[9px] font-esports font-black text-[#a3e635] uppercase italic tracking-wider block animate-pulse">
                ✨ SPECIAL GRADE COMPREHENSION (TOP 10%)
              </span>
            ) : (
              <div className="space-y-1">
                <span className="text-[9px] font-esports font-black text-yellow-500 uppercase italic tracking-wider block">
                  ⚡ GRADE 1 COMPREHENSION
                </span>
                {userPages > 0 && (
                  <p className="text-[9px] text-white/50 lowercase italic">
                    need +{pagesNeededForTop10} pages to match top 10% champions
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface ProgressDashboardProps {
  submissions: Submission[];
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ submissions }) => {
  const { user, profile } = useAuth();
  const [goal, setGoal] = useState<number>(4);
  const [tempGoal, setTempGoal] = useState<number>(4);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [globalApprovedSubs, setGlobalApprovedSubs] = useState<Submission[]>([]);

  useEffect(() => {
    const fetchGlobalSubmissions = async () => {
      try {
        const q = query(
          collection(db, 'submissions'),
          where('status', '==', SubmissionStatus.APPROVED)
        );
        const snapshot = await getDocs(q);
        const list: Submission[] = [];
        snapshot.forEach((doc) => {
          list.push({ submissionId: doc.id, ...doc.data() } as Submission);
        });
        setGlobalApprovedSubs(list);
      } catch (err) {
        // Silently fail
      }
    };
    fetchGlobalSubmissions();
  }, []);

  // Sync state with profile's monthlyGoal once loaded
  useEffect(() => {
    if (profile?.monthlyGoal) {
      setGoal(profile.monthlyGoal);
      setTempGoal(profile.monthlyGoal);
    }
  }, [profile?.monthlyGoal]);

  // Current calendar month filtering
  const now = new Date();
  const currentMonthName = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();

  const monthlySubmissions = submissions.filter((s) => {
    if (!s.createdAt) return false;
    const date = s.createdAt.seconds
      ? new Date(s.createdAt.seconds * 1000)
      : new Date(s.createdAt);
    return date.getMonth() === now.getMonth() && date.getFullYear() === currentYear;
  });

  const conqueredCount = monthlySubmissions.filter(
    (s) => s.status === SubmissionStatus.APPROVED
  ).length;
  
  const pendingCount = monthlySubmissions.filter(
    (s) => s.status === SubmissionStatus.PENDING
  ).length;

  const totalSubmitted = monthlySubmissions.length;

  // Calculate weekly pages read data for current month
  const baseWeeklyData = [
    { name: 'Week 1 (Days 1-7)', pages: 0, count: 0 },
    { name: 'Week 2 (Days 8-14)', pages: 0, count: 0 },
    { name: 'Week 3 (Days 15-21)', pages: 0, count: 0 },
    { name: 'Week 4 (Days 22+)', pages: 0, count: 0 },
  ];

  monthlySubmissions.forEach((s) => {
    let date = new Date();
    if (s.createdAt) {
      date = s.createdAt.seconds
        ? new Date(s.createdAt.seconds * 1000)
        : new Date(s.createdAt);
    }
    const day = date.getDate();
    
    // Fallback page estimate if pagesRead is not defined
    let pages = s.pagesRead;
    if (pages === undefined || isNaN(pages)) {
      // Deterministic estimate based on category and title hash
      const hash = s.bookTitle ? s.bookTitle.length : 10;
      if (s.category === 'novel') {
        pages = 300 + (hash * 7) % 150;
      } else if (s.category === 'poetry') {
        pages = 80 + (hash * 5) % 40;
      } else { // non-fiction
        pages = 240 + (hash * 11) % 100;
      }
    }

    if (day <= 7) {
      baseWeeklyData[0].pages += pages;
      baseWeeklyData[0].count += 1;
    } else if (day <= 14) {
      baseWeeklyData[1].pages += pages;
      baseWeeklyData[1].count += 1;
    } else if (day <= 21) {
      baseWeeklyData[2].pages += pages;
      baseWeeklyData[2].count += 1;
    } else {
      baseWeeklyData[3].pages += pages;
      baseWeeklyData[3].count += 1;
    }
  });

  // Define legendary champions for comparison
  const LEGENDARY_CHAMPIONS = [
    { name: 'Gojo Satoru', w1: 1500, w2: 1800, w3: 1600, w4: 2000 },
    { name: 'Yuta Okkotsu', w1: 900, w2: 1100, w3: 950, w4: 1200 },
    { name: 'Geto Suguru', w1: 850, w2: 750, w3: 900, w4: 800 },
    { name: 'Nanami Kento', w1: 500, w2: 550, w3: 480, w4: 600 },
    { name: 'Maki Zen\'in', w1: 450, w2: 500, w3: 400, w4: 550 },
    { name: 'Megumi Fushiguro', w1: 400, w2: 350, w3: 450, w4: 380 },
    { name: 'Nobara Kugisaki', w1: 300, w2: 450, w3: 320, w4: 400 },
    { name: 'Yuji Itadori', w1: 250, w2: 300, w3: 280, w4: 350 },
  ];

  // Group other users' approved submissions by userId for current month
  const userWeeklyPages: { [userId: string]: number[] } = {};

  if (user) {
    userWeeklyPages[user.uid] = [0, 0, 0, 0];
  }

  const currentMonthGlobalApproved = globalApprovedSubs.filter((s) => {
    if (!s.createdAt) return false;
    const date = s.createdAt.seconds
      ? new Date(s.createdAt.seconds * 1000)
      : new Date(s.createdAt);
    return date.getMonth() === now.getMonth() && date.getFullYear() === currentYear;
  });

  currentMonthGlobalApproved.forEach((s) => {
    if (!userWeeklyPages[s.userId]) {
      userWeeklyPages[s.userId] = [0, 0, 0, 0];
    }
    
    let date = new Date();
    if (s.createdAt) {
      date = s.createdAt.seconds
        ? new Date(s.createdAt.seconds * 1000)
        : new Date(s.createdAt);
    }
    const day = date.getDate();
    
    let pages = s.pagesRead;
    if (pages === undefined || isNaN(pages)) {
      const hash = s.bookTitle ? s.bookTitle.length : 10;
      if (s.category === 'novel') {
        pages = 300 + (hash * 7) % 150;
      } else if (s.category === 'poetry') {
        pages = 80 + (hash * 5) % 40;
      } else {
        pages = 240 + (hash * 11) % 100;
      }
    }

    const weekIndex = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
    userWeeklyPages[s.userId][weekIndex] += pages;
  });

  // Build the final weeklyData array with rank and comparison info
  const weeklyData = baseWeeklyData.map((week, idx) => {
    const userPages = week.pages;

    // Gather pages from legendary champions
    const championPages = LEGENDARY_CHAMPIONS.map(c => {
      if (idx === 0) return c.w1;
      if (idx === 1) return c.w2;
      if (idx === 2) return c.w3;
      return c.w4;
    });

    // Gather pages from other real users (excluding current user to avoid duplicates)
    const otherRealUsersPages = Object.keys(userWeeklyPages)
      .filter(uid => !user || uid !== user.uid)
      .map(uid => userWeeklyPages[uid][idx]);

    // Combined pool
    const pool = [...championPages, ...otherRealUsersPages, userPages];

    // Sort descending
    pool.sort((a, b) => b - a);

    // Find current user's rank
    const rankIndex = pool.indexOf(userPages);
    const rank = rankIndex + 1;
    const totalCompetitors = pool.length;

    // Top 10% threshold (at 10th percentile index)
    const top10PercentIndex = Math.max(0, Math.floor(totalCompetitors * 0.1));
    const top10PercentPages = pool[top10PercentIndex];

    const isTop10Percent = userPages >= top10PercentPages && userPages > 0;
    const pagesNeededForTop10 = Math.max(0, top10PercentPages - userPages);

    return {
      ...week,
      rank,
      totalCompetitors,
      top10PercentPages,
      isTop10Percent,
      pagesNeededForTop10,
    };
  });

  // Let's allow users to track their progress based on Approved (Conquered) or Total submitted books.
  // We'll calculate progress percent based on Conquered (Approved) books to incentivize standard gameplay vows!
  const progressPercent = Math.min(100, Math.round((conqueredCount / goal) * 100));
  const submissionPercent = Math.min(100, Math.round((totalSubmitted / goal) * 100));

  // Circular progress SVG configurations
  const radius = 70;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const dashOffsetConquered = circumference - (progressPercent / 100) * circumference;
  const dashOffsetSubmitted = circumference - (submissionPercent / 100) * circumference;

  const handleSaveGoal = async () => {
    if (!user) return;
    if (tempGoal < 1 || tempGoal > 100) return;
    
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        monthlyGoal: tempGoal,
      });
      setGoal(tempGoal);
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, 'update', `/users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const getVowQuote = () => {
    if (conqueredCount >= goal) {
      return {
        quote: "VOW ACCOMPLISHED. YOUR INSIGHT RESONATES WITH UNRIVALED STRENGTH.",
        status: "DOMAIN REFINDED",
        color: "text-[#a3e635] shadow-[0_0_15px_rgba(163,230,53,0.2)] border-[#a3e635]/30",
      };
    }
    if (totalSubmitted >= goal) {
      return {
        quote: "TECHNIQUES SUBMITTED. AWAITING JUDGMENT TO SANCTIFY THE VOW.",
        status: "RESONANCE ENGAGED",
        color: "text-yellow-500 border-yellow-500/30",
      };
    }
    if (conqueredCount > 0) {
      return {
        quote: "THE SPARK IS IGNITED. INTEGRATE THE REMAINING TOMES TO REALIZE YOUR POTENTIAL.",
        status: "BOUND VOW ACTIVE",
        color: "text-primary/75 border-primary/20",
      };
    }
    return {
      quote: "INITIATE YOUR PACING VOW. SUBMIT CRITICAL REFINEMENTS THIS MONTH.",
      status: "VOW INITIALIZED",
      color: "text-white/40 border-white/5",
    };
  };

  const vowInfo = getVowQuote();

  return (
    <div 
      id="progress-dashboard"
      className="bg-black/40 border border-primary/10 p-8 md:p-12 relative overflow-hidden mb-24 transition-all hover:border-primary/25"
      style={{ clipPath: 'polygon(3% 0, 100% 0, 97% 100%, 0% 100%)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-20 pointer-events-none" />
      
      {/* Decorative JRPG accents */}
      <div className="absolute top-0 left-12 w-[1px] h-4 bg-primary/40" />
      <div className="absolute bottom-0 right-12 w-[1px] h-4 bg-primary/40" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.03] select-none pointer-events-none font-black text-9xl italic font-mono uppercase tracking-widest text-primary">
        VOW
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-center justify-between">
        
        {/* Left Side: Meta info and goals setting */}
        <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-left">
          <header className="space-y-3">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <span className="p-2 bg-primary/10 border border-primary/20 text-primary rounded-none rotate-45">
                <Calendar size={16} className="-rotate-45" />
              </span>
              <span className="text-[10px] uppercase font-esports tracking-[0.4em] text-primary/60 font-black italic">
                {currentMonthName} {currentYear} Covenant
              </span>
            </div>
            
            <h3 className="text-4xl md:text-5xl font-esports italic text-on-surface uppercase tracking-tighter digital-glow leading-none">
              Territory Expansion Progress
            </h3>
            
            <p className="text-xs uppercase font-bold text-on-surface-variant font-sans tracking-widest leading-relaxed max-w-xl text-primary/40">
              Establish a binding reading vow to synchronize research and expansion within the colony. Conquered tomes raise your baseline energy.
            </p>
          </header>

          <div className="h-px bg-primary/10" />

          {/* Goals setting panel */}
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-center lg:justify-start">
            <AnimatePresence mode="wait">
              {!isEditing ? (
                <motion.div 
                  key="view"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-4 py-1">
                    <span className="text-xs font-esports font-black text-primary/50 tracking-widest uppercase italic">MONTHLY VOW GOAL:</span>
                    <span className="text-3xl font-esports italic text-on-surface font-black bg-primary/5 border border-primary/15 px-4 py-1 shadow-inner">
                      {goal} {goal === 1 ? 'Book' : 'Books'}
                    </span>
                    <button
                      onClick={() => {
                        setTempGoal(goal);
                        setIsEditing(true);
                      }}
                      className="p-2 border border-primary/20 hover:border-primary/50 text-primary/60 hover:text-primary bg-primary/5 transition-all text-xs flex items-center justify-center gap-2 uppercase tracking-widest font-black"
                    >
                      <Edit3 size={14} /> Adjust Vow
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="edit"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex flex-wrap items-center gap-4 bg-primary/5 border border-primary/15 p-4 relative"
                  style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}
                >
                  <label className="text-[10px] uppercase font-esports tracking-widest font-black text-primary/60 block sm:inline italic">REGULATE ENERGY FLOW:</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setTempGoal(prev => Math.max(1, prev - 1))}
                      className="p-2 bg-black border border-primary/25 hover:border-primary text-primary transition-all active:scale-90"
                    >
                      <Minus size={14} />
                    </button>
                    <input 
                      type="number"
                      value={tempGoal}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) setTempGoal(Math.max(1, Math.min(100, val)));
                      }}
                      className="w-16 bg-black text-center text-on-surface font-esports font-black text-lg border border-primary/20 py-1 focus:border-primary focus:outline-none"
                    />
                    <button 
                      onClick={() => setTempGoal(prev => Math.min(100, prev + 1))}
                      className="p-2 bg-black border border-primary/25 hover:border-primary text-primary transition-all active:scale-90"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveGoal}
                      disabled={saving}
                      className="px-4 py-2 bg-primary text-black font-esports font-black italic text-[10px] uppercase tracking-widest hover:bg-white transition-all flex items-center gap-1.5"
                    >
                      {saving ? (
                        <Loader2 size={12} className="animate-spin text-black" />
                      ) : (
                        <Sparkles size={12} />
                      )}
                      Seal Vow
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-2 border border-white/10 hover:border-white/20 text-white/50 hover:text-white font-esports text-[9px] uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Inspirational banner */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`border bg-black/50 p-4 border-l-4 border-l-primary/60 max-w-xl italic ${vowInfo.color}`}
          >
            <div className="flex gap-4 items-center">
              <span className="p-1 px-3 bg-primary/10 border border-primary/25 text-[8px] uppercase tracking-[0.2em] font-black italic font-esports">{vowInfo.status}</span>
              <p className="text-[10px] tracking-wider uppercase font-black uppercase text-white/70">{vowInfo.quote}</p>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Circular progress indicator */}
        <div className="w-full lg:w-1/2 flex flex-col sm:flex-row items-center justify-center gap-10">
          
          {/* Circular SVG representation */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Glowing dropshadow overlay element */}
            <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-50 rounded-full animate-pulse" />
            
            <svg className="w-full h-full rotate-270 transform">
              <defs>
                <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F8E71C" />
                  <stop offset="100%" stopColor="#d2c011" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Base track circle */}
              <circle
                cx="88"
                cy="88"
                r={radius}
                className="stroke-surface-charcoal fill-none"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="88"
                cy="88"
                r={radius}
                className="stroke-white/5 fill-none"
                strokeWidth={strokeWidth}
              />

              {/* Submitted progress circle (lower opacity) */}
              {totalSubmitted > 0 && (
                <motion.circle
                  cx="88"
                  cy="88"
                  r={radius}
                  className="stroke-primary/30 fill-none"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: dashOffsetSubmitted }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              )}

              {/* Conquered (Approved) progress circle with full glow */}
              <motion.circle
                cx="88"
                cy="88"
                r={radius}
                className="fill-none"
                stroke="url(#primaryGradient)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeLinecap="square"
                filter="url(#glow)"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffsetConquered }}
                transition={{ duration: 1.6, ease: "circOut", delay: 0.2 }}
              />
            </svg>

            {/* Central Typography and values inside */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-primary/40 leading-none tracking-[0.2em] font-black italic uppercase font-esports">Tomes</span>
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-esports font-black text-on-surface digital-glow leading-none">
                  {conqueredCount}
                </span>
                <span className="text-lg font-esports font-black text-primary/30 mx-0.5">/</span>
                <span className="text-xl font-esports font-black text-on-surface/50">
                  {goal}
                </span>
              </div>
              <span className="text-[9px] uppercase font-mono font-black tracking-widest text-primary/70 animate-pulse mt-1">
                {progressPercent}% CONQUERED
              </span>
            </div>
          </div>

          {/* Quick text dashboard detail table */}
          <div className="space-y-4 font-mono text-[11px] uppercase font-bold tracking-wider w-full sm:w-auto flex-grow self-stretch sm:self-center flex flex-col justify-center max-w-[260px]">
            <div className="bg-black/30 border border-white/5 p-4 space-y-3">
              <div className="flex justify-between items-center text-white/50 pb-2 border-b border-white/5">
                <span>CONVENT VALUES</span>
                <span className="text-[9px] text-primary/40">REAL-TIME</span>
              </div>
              
              <div className="flex justify-between items-center text-on-surface">
                <span className="flex items-center gap-2"><BookOpen size={11} className="text-[#a3e635]" /> Conquered:</span>
                <span className="text-sm font-black text-[#a3e635] font-esports italic">
                  {conqueredCount} / {goal}
                </span>
              </div>

              <div className="flex justify-between items-center text-on-surface">
                <span className="flex items-center gap-2"><Flame size={11} className="text-yellow-500" /> Awaiting:</span>
                <span className="text-sm font-black text-yellow-500 font-esports italic">
                  {pendingCount}
                </span>
              </div>

              <div className="flex justify-between items-center text-on-surface">
                <span className="flex items-center gap-2"><Trophy size={11} className="text-primary" /> Core Focus:</span>
                <span className="text-[10px] font-black font-esports text-primary italic">
                  {conqueredCount >= goal ? 'SANCTIFIED' : 'STRIVING'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Monthly Reading Pace Chart (Pages per Week) */}
      <div className="h-px bg-primary/10 my-10" />

      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-esports tracking-[0.3em] text-primary/60 font-black italic">
              Cursed Energy Velocity
            </span>
            <h4 className="text-2xl font-esports italic text-on-surface uppercase tracking-tight leading-none">
              Monthly Reading Pace
            </h4>
          </div>
          <p className="text-[10px] font-mono font-bold text-on-surface-variant max-w-sm uppercase tracking-wider text-left sm:text-right">
            Visualizing the exact volume of pages conquered per week of this month. Set pace to optimize focus.
          </p>
        </header>

        <div className="bg-black/50 border border-white/5 p-6 md:p-8 relative overflow-hidden" style={{ clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0% 100%)' }}>
          <div className="absolute inset-0 bg-primary/[0.01] pointer-events-none" />
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="pageGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F8E71C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F8E71C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={9} 
                  fontFamily="JetBrains Mono" 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={9} 
                  fontFamily="JetBrains Mono" 
                  tickLine={false}
                  axisLine={false}
                  dx={-5}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(248, 231, 28, 0.1)', strokeWidth: 1 }} />
                <Area 
                  type="monotone" 
                  dataKey="pages" 
                  stroke="#F8E71C" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#pageGlow)" 
                  activeDot={{ r: 6, stroke: '#000', strokeWidth: 2, fill: '#F8E71C' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic pacing insight */}
        <div className="flex flex-wrap gap-6 items-center justify-between font-mono text-[10px] uppercase font-bold tracking-wider pt-2">
          <div className="flex items-center gap-4">
            <span className="text-white/40">MONTH TOTAL PAGES:</span>
            <span className="text-primary font-black text-xs font-esports italic">
              {weeklyData.reduce((acc, curr) => acc + curr.pages, 0)} PAGES
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/40">WEEKLY AVERAGE:</span>
            <span className="text-secondary font-black text-xs font-esports italic">
              {Math.round(weeklyData.reduce((acc, curr) => acc + curr.pages, 0) / 4)} PAGES/WK
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
