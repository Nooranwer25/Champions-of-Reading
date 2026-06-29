import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../services/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Plus, Minus, BookOpen, Flame, Sparkles, CheckCircle, Edit2, RefreshCw } from 'lucide-react';
import { playPageFlip } from '../services/audioService';

export const DailyTomeGoal: React.FC = () => {
  const { user, profile } = useAuth();
  
  // Daily goal default to 30 pages
  const [dailyGoal, setDailyGoal] = useState<number>(30);
  const [tempGoal, setTempGoal] = useState<number>(30);
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [savingGoal, setSavingGoal] = useState<boolean>(false);

  // Standalone daily manual reading progress (saved in localStorage to persist across updates)
  const [manualProgress, setManualProgress] = useState<number>(0);
  const [customPagesInput, setCustomPagesInput] = useState<string>('');

  // Track the date to reset progress daily
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Fetch submissions from today to count auto-logged pages
  const [todaySubmissionsPages, setTodaySubmissionsPages] = useState<number>(0);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);

  // Local storage keys
  const localGoalKey = `daily_tome_goal_${user?.uid || 'guest'}`;
  const localProgressKey = `daily_tome_progress_${user?.uid || 'guest'}_${todayStr}`;

  // 1. Load Initial Goal & Progress
  useEffect(() => {
    // Load target from firestore profile or local storage
    if (profile?.dailyPageGoal) {
      setDailyGoal(profile.dailyPageGoal);
      setTempGoal(profile.dailyPageGoal);
    } else {
      const savedGoal = localStorage.getItem(localGoalKey);
      if (savedGoal) {
        const val = parseInt(savedGoal, 10);
        if (!isNaN(val) && val > 0) {
          setDailyGoal(val);
          setTempGoal(val);
        }
      }
    }

    // Load manual progress for today
    const savedProgress = localStorage.getItem(localProgressKey);
    if (savedProgress) {
      const val = parseInt(savedProgress, 10);
      if (!isNaN(val)) {
        setManualProgress(val);
      }
    } else {
      setManualProgress(0);
    }
  }, [profile?.dailyPageGoal, localGoalKey, localProgressKey]);

  // 2. Fetch Auto-Logged pages from Firestore submissions created today
  useEffect(() => {
    if (!user) {
      setTodaySubmissionsPages(0);
      return;
    }

    setLoadingSubmissions(true);
    const q = query(
      collection(db, 'submissions'),
      where('userId', '==', user.uid)
    );

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let pagesCount = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let createdTime = 0;
        
        if (data.createdAt) {
          if (typeof data.createdAt.toMillis === 'function') {
            createdTime = data.createdAt.toMillis();
          } else if (data.createdAt.seconds) {
            createdTime = data.createdAt.seconds * 1000;
          } else {
            createdTime = new Date(data.createdAt).getTime();
          }
        }

        // Only count submissions from today
        if (createdTime >= startOfToday.getTime()) {
          pagesCount += Number(data.pagesRead) || 0;
        }
      });
      setTodaySubmissionsPages(pagesCount);
      setLoadingSubmissions(false);
    }, (err) => {
      console.error('Error loading today submissions for daily goal:', err);
      setLoadingSubmissions(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Total pages read today is sum of auto-logged submissions + manually added pages
  const totalPagesToday = todaySubmissionsPages + manualProgress;
  const progressPercent = Math.min(100, Math.round((totalPagesToday / dailyGoal) * 100));

  // Determine dynamic advice from Kogane
  const koganeSpeech = useMemo(() => {
    if (totalPagesToday === 0) {
      return "PITIFUL GUEST! You haven't decoded a single rune today. Exorcise your inertia!";
    }
    if (progressPercent < 35) {
      return "A sluggish trickle of energy... Fan the flames of your concentration!";
    }
    if (progressPercent < 75) {
      return "Adequate momentum. Do not let your domain collapse before completion.";
    }
    if (progressPercent < 100) {
      return "The core extraction is nearly finalized! Push to the absolute apex!";
    }
    return "IMPERIAL COMPREHENSION! Today's culling target shattered! Your aura is boundless.";
  }, [totalPagesToday, progressPercent]);

  // 3. Save Goal
  const handleSaveGoal = async () => {
    if (tempGoal < 1 || tempGoal > 1000) return;
    
    setSavingGoal(true);
    try {
      localStorage.setItem(localGoalKey, tempGoal.toString());
      setDailyGoal(tempGoal);

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          dailyPageGoal: tempGoal,
        });
      }
      setIsEditingGoal(false);
    } catch (err) {
      console.error('Error saving daily goal to Firestore:', err);
      // Fallback works anyway via localStorage
      setDailyGoal(tempGoal);
      setIsEditingGoal(false);
    } finally {
      setSavingGoal(false);
    }
  };

  // 4. Manual Progress Increment
  const handleAddManualPages = (amount: number) => {
    if (amount <= 0) return;
    playPageFlip();
    const nextProgress = manualProgress + amount;
    setManualProgress(nextProgress);
    localStorage.setItem(localProgressKey, nextProgress.toString());
  };

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customPagesInput, 10);
    if (!isNaN(val) && val > 0) {
      handleAddManualPages(val);
      setCustomPagesInput('');
    }
  };

  const handleResetManualProgress = () => {
    if (window.confirm("Do you want to reset today's manually logged pages?")) {
      setManualProgress(0);
      localStorage.removeItem(localProgressKey);
    }
  };

  return (
    <motion.div
      id="daily-tome-goal-widget"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full bg-neutral-900/40 border border-primary/20 p-6 md:p-8 relative overflow-hidden text-white"
      style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
    >
      {/* Background aesthetics */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <Target className="text-primary" size={20} />
            <h3 className="text-xl font-esports italic uppercase tracking-tight">Daily Tome Goal</h3>
          </div>
          <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest mt-1">
            Exorcise a set volume of pages today to maintain your elite comprehension matrix
          </p>
        </div>

        {/* Goal Indicator */}
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {!isEditingGoal ? (
              <motion.div
                key="goal-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-2 rounded-lg"
              >
                <div>
                  <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest block">Daily Target</span>
                  <span className="text-sm font-mono font-black text-primary tracking-wider block">
                    {dailyGoal} Pages
                  </span>
                </div>
                <button
                  onClick={() => { setTempGoal(dailyGoal); setIsEditingGoal(true); }}
                  className="p-1.5 rounded bg-white/5 hover:bg-primary hover:text-black transition-all cursor-pointer border border-white/10"
                >
                  <Edit2 size={12} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="goal-edit"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2 bg-black/70 border border-primary/30 p-1 px-2 rounded-lg"
              >
                <button
                  onClick={() => setTempGoal(Math.max(5, tempGoal - 5))}
                  className="p-1 text-primary hover:bg-primary/20 rounded"
                >
                  <Minus size={14} />
                </button>
                <span className="w-12 text-center text-xs font-mono font-bold">{tempGoal}p</span>
                <button
                  onClick={() => setTempGoal(Math.min(500, tempGoal + 5))}
                  className="p-1 text-primary hover:bg-primary/20 rounded"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={handleSaveGoal}
                  disabled={savingGoal}
                  className="ml-2 px-2 py-1 bg-primary text-black font-esports font-black text-[9px] uppercase tracking-widest"
                >
                  SET
                </button>
                <button
                  onClick={() => setIsEditingGoal(false)}
                  className="px-1 py-1 text-white/40 hover:text-white text-[9px] font-mono uppercase"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Grid: Visual Progress Ring and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left column: Progress Circular dial */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-black/20 border border-white/5 rounded-xl p-6 relative">
          
          {/* Circular dial SVG */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="88"
                cy="88"
                r="74"
                className="stroke-neutral-800 fill-transparent"
                strokeWidth="10"
              />
              {/* Animated progress circle */}
              <motion.circle
                cx="88"
                cy="88"
                r="74"
                className={`fill-transparent ${progressPercent >= 100 ? 'stroke-[#a3e635]' : 'stroke-primary'}`}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 74}
                initial={{ strokeDashoffset: 2 * Math.PI * 74 }}
                animate={{ strokeDashoffset: (2 * Math.PI * 74) * (1 - progressPercent / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner text information */}
            <div className="absolute text-center flex flex-col items-center">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">Today</span>
              <span className="text-4xl font-esports italic font-black leading-none text-white block">
                {totalPagesToday}
              </span>
              <span className="text-[9px] font-mono text-white/30 uppercase block mt-1">
                / {dailyGoal} Pages
              </span>
            </div>

            {/* Absolute Success Indicator Badge overlay */}
            {progressPercent >= 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-[#a3e635] text-black rounded-full p-2.5 shadow-[0_0_15px_#a3e635] border-2 border-black"
              >
                <Flame size={16} className="animate-pulse" />
              </motion.div>
            )}
          </div>

          <div className="mt-4 text-center">
            <span className={`text-[10px] font-esports font-black tracking-widest uppercase italic block ${
              progressPercent >= 100 ? 'text-[#a3e635]' : 'text-primary'
            }`}>
              {progressPercent}% Goal Achieved
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-[9px] font-mono text-white/40 uppercase">
              <BookOpen size={10} />
              <span>{todaySubmissionsPages} auto + {manualProgress} manual</span>
            </div>
          </div>
        </div>

        {/* Right column: Logging mechanisms and Kogane's live speech */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full gap-6">
          
          {/* Kogane custom daily bubble */}
          <div className="bg-black/40 border border-white/5 p-4 rounded-xl relative">
            <div className="absolute left-4 -top-2.5 px-2 bg-neutral-900 border border-white/10 text-[8px] font-mono uppercase text-secondary tracking-widest rounded">
              Kogane Judgement
            </div>
            <p className="text-xs text-white/80 italic font-medium leading-relaxed pt-1">
              "{koganeSpeech}"
            </p>
          </div>

          {/* Quick manual logging selectors */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-2">
                Quick Exorcise Pages
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[10, 20, 50].map((pages) => (
                  <button
                    key={pages}
                    onClick={() => handleAddManualPages(pages)}
                    className="py-2.5 bg-white/5 hover:bg-primary hover:text-black border border-white/10 hover:border-transparent transition-all font-esports font-bold text-xs uppercase tracking-wider rounded cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus size={10} />
                    <span>+{pages}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Logger */}
            <form onSubmit={handleCustomAdd} className="flex gap-2">
              <input
                type="number"
                min="1"
                max="500"
                placeholder="Log precise page count..."
                value={customPagesInput}
                onChange={(e) => setCustomPagesInput(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 px-3 py-2.5 rounded text-xs font-mono placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 bg-primary text-black hover:bg-white transition-all font-esports font-black text-xs uppercase tracking-widest rounded flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={12} />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Footer Reset Manual Progress */}
          {manualProgress > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleResetManualProgress}
                className="text-[9px] font-mono text-white/20 hover:text-red-400 transition-colors uppercase flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={10} />
                <span>Reset Today's Manual Log</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
};
