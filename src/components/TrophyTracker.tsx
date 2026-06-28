import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useTheme } from '../services/ThemeContext';
import { Submission, SubmissionStatus } from '../types';
import { TROPHIES, getTrophyIcon } from '../constants/trophies';
import { checkAndAwardTrophies } from '../services/achievementService';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Sparkles, Trophy, Award, Lock, HelpCircle, CheckCircle } from 'lucide-react';
import { CursedConfetti } from './CursedConfetti';

interface TrophyTrackerProps {
  submissions: Submission[];
}

export const TrophyTracker: React.FC<TrophyTrackerProps> = ({ submissions }) => {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const [copiedTrophyId, setCopiedTrophyId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string | null>(null);

  const approvedSubmissions = submissions.filter(s => s.status === SubmissionStatus.APPROVED);
  const approvedCount = approvedSubmissions.length;
  
  const totalPagesRead = approvedSubmissions.reduce((sum, s) => sum + (Number(s.pagesRead) || 0), 0);
  const novelsCount = approvedSubmissions.filter(s => s.category === 'novel').length;
  const poetryCount = approvedSubmissions.filter(s => s.category === 'poetry').length;
  const nonfictionCount = approvedSubmissions.filter(s => s.category === 'non-fiction').length;

  useEffect(() => {
    if (!user || approvedSubmissions.length === 0) return;

    const checkTrophies = async () => {
      const newlyUnlockedIds = await checkAndAwardTrophies(user.uid);
      if (newlyUnlockedIds && newlyUnlockedIds.length > 0) {
        // Show first unlocked trophy details and confetti!
        const firstId = newlyUnlockedIds[0];
        const trophy = TROPHIES.find(t => t.id === firstId);
        if (trophy) {
          setNewlyUnlocked(trophy.name);
          setShowConfetti(true);
          // Auto clear after 6s
          setTimeout(() => setNewlyUnlocked(null), 6000);
        }
      }
    };

    checkTrophies();
  }, [user, approvedCount, totalPagesRead, novelsCount, poetryCount, nonfictionCount]);

  const shareTrophy = (trophy: typeof TROPHIES[0], isEarned: boolean) => {
    if (!profile) return;
    
    const userName = profile.displayName || 'An anonymous sorcerer';
    
    const text = `============================================================
           🔮 CURSED ACADEMY: GRAND TROPHY EARNED 🔮           
============================================================

Sorcerer:      ${userName} (${profile.role || 'Grade 4 Sorcerer'})
Trophy:        🏆 ${trophy.name} [${trophy.tier.toUpperCase()}]
Status:        ${isEarned ? '🔥 PURIFIED & LOCKED' : '⭐ CONDENSING RESERVES'}

"${trophy.description}"

Requirement:   ${trophy.requirement}
Energy Gain:   +${trophy.points} Cursed Points

Join the sorting & conquering of cursed tomes at Cursed Academy!
============================================================`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedTrophyId(trophy.id);
      setTimeout(() => {
        setCopiedTrophyId(null);
      }, 3000);
    }).catch(() => {});
  };

  const getTierBadgeStyle = (tier: 'bronze' | 'silver' | 'gold' | 'special_grade') => {
    switch (tier) {
      case 'bronze':
        return 'bg-amber-700/10 border-amber-700/30 text-amber-500';
      case 'silver':
        return 'bg-slate-400/10 border-slate-400/30 text-slate-300';
      case 'gold':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'special_grade':
        return 'bg-purple-500/20 border-purple-500/50 text-purple-400 animate-pulse';
    }
  };

  return (
    <section className="mb-24 relative">
      <CursedConfetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      {/* Newly unlocked trophy banner notification */}
      <AnimatePresence>
        {newlyUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-black/90 border-2 border-primary/50 text-primary px-8 py-5 flex items-center gap-4 shadow-[0_0_30px_rgba(250,204,21,0.2)] backdrop-blur-lg rounded-xl max-w-md w-full"
            style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}
          >
            <Trophy className="text-primary animate-bounce flex-shrink-0" size={32} />
            <div>
              <div className="text-[10px] uppercase font-esports tracking-[0.2em] text-primary/60">Grand Milestone Cleared!</div>
              <div className="font-esports italic text-lg text-white font-black uppercase tracking-tight">{newlyUnlocked}</div>
              <div className="text-xs text-primary/80 mt-1">Manifested as an immortal Trophy in your Territory.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12 border-b border-primary/20 pb-8">
        <div>
          <h3 className="text-4xl font-esports italic text-on-surface uppercase tracking-tighter digital-glow flex items-center gap-3">
            <Trophy className="text-primary" size={32} />
            Territory Trophies
          </h3>
          <span className="text-[10px] uppercase font-esports tracking-[0.3em] text-primary/40 font-black italic block mt-1">
            Impenetrable Domain Milestones & Sacred relics
          </span>
        </div>
        
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 px-5 py-2 text-[10px] font-esports uppercase tracking-widest font-black italic text-primary/70 rounded-xl">
          Unlocked: {TROPHIES.filter(t => profile?.trophies?.includes(t.id)).length} / {TROPHIES.length}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {TROPHIES.map((trophy, idx) => {
          const isEarned = profile?.trophies?.includes(trophy.id);
          const Icon = getTrophyIcon(trophy.iconName);

          // Calculate actual progress numbers
          let currentProgressVal = 0;
          let maxProgressVal = 1;
          switch (trophy.id) {
            case 'first_conquest':
              currentProgressVal = approvedCount;
              maxProgressVal = 1;
              break;
            case 'novel_apprentice':
              currentProgressVal = novelsCount;
              maxProgressVal = 3;
              break;
            case 'poetry_enthusiast':
              currentProgressVal = poetryCount;
              maxProgressVal = 2;
              break;
            case 'nonfiction_sage':
              currentProgressVal = nonfictionCount;
              maxProgressVal = 3;
              break;
            case 'domain_scholar':
              currentProgressVal = totalPagesRead;
              maxProgressVal = 1500;
              break;
            case 'energy_sovereign':
              currentProgressVal = profile?.totalPoints || 0;
              maxProgressVal = 2500;
              break;
            case 'streak_vow':
              currentProgressVal = profile?.dailyStreak || 0;
              maxProgressVal = 3;
              break;
          }

          const progressPercent = Math.min(100, (currentProgressVal / maxProgressVal) * 100);

          return (
            <motion.div
              key={trophy.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: idx * 0.05, 
                type: 'spring', 
                stiffness: 90, 
                damping: 15 
              }}
              whileHover={{ 
                y: -6,
                scale: 1.02,
                boxShadow: isEarned 
                  ? theme === 'dark' 
                    ? '0 12px 40px -8px rgba(139, 92, 246, 0.15), 0 0 1px 1px rgba(139, 92, 246, 0.2)' 
                    : '0 12px 40px -8px rgba(139, 92, 246, 0.25), 0 0 1px 1px rgba(139, 92, 246, 0.3)'
                  : theme === 'dark'
                    ? '0 12px 30px -8px rgba(255, 255, 255, 0.03)'
                    : '0 12px 30px -8px rgba(0, 0, 0, 0.05)',
                transition: { duration: 0.25, ease: "easeOut" } 
              }}
              className={`group relative p-6 backdrop-blur-md rounded-2xl flex flex-col gap-6 overflow-hidden transition-all duration-300 border ${
                isEarned 
                  ? 'border-purple-500/20 bg-purple-500/[0.02] hover:bg-purple-500/[0.04]' 
                  : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.02] opacity-60 hover:opacity-100'
              }`}
            >
              {/* Glass reflections & light sweeps */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-20 pointer-events-none" />
              
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 1.0, ease: "easeInOut" }}
              />

              <div className="flex items-start gap-5 relative z-10">
                <motion.div 
                  initial={{ scale: 0.8, rotate: isEarned ? 0 : -15 }}
                  animate={{ scale: 1, rotate: isEarned ? 12 : 0 }}
                  className={`p-3.5 backdrop-blur-sm rounded-xl border flex-shrink-0 flex items-center justify-center transition-all ${
                    isEarned 
                      ? 'bg-purple-500/10 border-purple-500/30 group-hover:bg-purple-500/20 group-hover:border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                      : 'bg-white/5 border-white/10 opacity-30 shadow-none'
                  }`}
                >
                  {isEarned ? (
                    <Icon className={`${trophy.color}`} size={24} />
                  ) : (
                    <Lock className="text-on-surface-variant/40" size={24} />
                  )}
                </motion.div>
                
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-lg font-esports font-bold uppercase tracking-wider ${
                      isEarned ? 'text-on-surface text-purple-400 drop-shadow-[0_0_4px_rgba(168,85,247,0.3)]' : 'text-on-surface-variant/50'
                    }`}>
                      {trophy.name}
                    </span>
                    {isEarned && <CheckCircle size={12} className="text-purple-400 flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-on-surface-variant/80 font-medium leading-relaxed max-w-[240px]">
                    {trophy.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3 relative z-10 mt-auto">
                <div className="flex justify-between items-end">
                  <span className={`text-[8px] px-2 py-0.5 border font-bold uppercase rounded-md tracking-wider ${getTierBadgeStyle(trophy.tier)}`}>
                    {trophy.tier.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-purple-400">
                    {currentProgressVal.toLocaleString()} / {maxProgressVal.toLocaleString()} ({Math.floor(progressPercent)}%)
                  </span>
                </div>
                
                {/* Glassy Progress Track */}
                <div className="relative h-1.5 w-full bg-white/5 dark:bg-black/30 border border-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: idx * 0.05 }}
                    className={`absolute inset-y-0 left-0 rounded-full ${
                      isEarned 
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]' 
                        : 'bg-purple-500/20'
                    }`}
                  />
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-white/5 dark:border-white/5 border-black/5">
                  <p className="text-[9px] text-on-surface-variant/60 tracking-wide font-medium">
                    Goal: {trophy.requirement}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-purple-400 font-bold">
                      +{trophy.points} PTS
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        shareTrophy(trophy, !!isEarned);
                      }}
                      className={`flex items-center gap-1.5 border text-[9px] uppercase font-bold tracking-widest px-2.5 py-1.5 transition-all duration-300 cursor-pointer rounded-lg ${
                        theme === 'dark'
                          ? 'bg-white/[0.04] hover:bg-purple-500/10 border-white/10 hover:border-purple-500/40 text-on-surface-variant hover:text-purple-400'
                          : 'bg-black/[0.02] hover:bg-purple-500/10 border-black/10 hover:border-purple-500/40 text-on-surface-variant hover:text-purple-700'
                      }`}
                      title="Copy trophy milestone to clipboard"
                    >
                      <Share2 size={10} className={copiedTrophyId === trophy.id ? "animate-ping" : ""} />
                      {copiedTrophyId === trophy.id ? 'COPIED!' : 'SHARE'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
