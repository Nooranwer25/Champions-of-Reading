import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Trophy, Award, CheckCircle2, AlertTriangle, Info, BellRing, Share2 } from 'lucide-react';
import { BADGES, getBadgeIcon } from '../constants/badges';
import { TROPHIES, getTrophyIcon } from '../constants/trophies';
import { CelebrationConfetti } from '../components/CelebrationConfetti';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import { playAchievementSound } from './audioService';

export interface Toast {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'error' | 'badge' | 'milestone';
  duration?: number;
  badgeId?: string;
}

export interface ActiveCelebration {
  name: string;
  description: string;
  requirement: string;
  type: 'badge' | 'trophy';
  iconName: string;
  color: string;
  tier?: string;
  points?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  triggerManualCelebration: (celebration: ActiveCelebration) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { theme } = useTheme();
  const [activeCelebration, setActiveCelebration] = useState<ActiveCelebration | null>(null);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    // Play achievement chime if it's a badge or milestone toast
    if (toast.type === 'badge' || toast.type === 'milestone') {
      playAchievementSound();
    }
    
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerManualCelebration = (celebration: ActiveCelebration) => {
    playAchievementSound();
    setActiveCelebration(celebration);
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, triggerManualCelebration }}>
      {children}
      {/* Watchers to automatically detect and celebrate newly earned achievements */}
      <BadgeWatcher onCelebrate={(cel) => setActiveCelebration(cel)} />
      <TrophyWatcher onCelebrate={(cel) => setActiveCelebration(cel)} />
      
      <ToastContainer toasts={toasts} removeToast={removeToast} theme={theme} />
      
      <AnimatePresence>
        {activeCelebration && (
          <AchievementModal 
            celebration={activeCelebration} 
            onClose={() => setActiveCelebration(null)} 
            theme={theme}
          />
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Subcomponent that runs silently to monitor the current user's profile for newly earned badges
const BadgeWatcher: React.FC<{ onCelebrate: (cel: ActiveCelebration) => void }> = ({ onCelebrate }) => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const prevBadgesRef = useRef<string[] | null>(null);

  useEffect(() => {
    if (!profile) {
      prevBadgesRef.current = null;
      return;
    }

    const currentBadges = profile.badges || [];

    // Initialize on first profile load to avoid triggering toasts for existing badges
    if (prevBadgesRef.current === null) {
      prevBadgesRef.current = currentBadges;
      return;
    }

    // Find any new badges added
    const newBadges = currentBadges.filter((b) => !prevBadgesRef.current?.includes(b));
    if (newBadges.length > 0) {
      newBadges.forEach((badgeId) => {
        const badge = BADGES.find((b) => b.id === badgeId);
        if (badge) {
          showToast({
            title: 'Scholarly Feat Unlocked!',
            description: `You have been awarded the "${badge.name}" badge.`,
            type: 'badge',
            badgeId: badge.id,
            duration: 8000 // Badges display for longer to celebrate!
          });
          onCelebrate({
            name: badge.name,
            description: badge.description,
            requirement: badge.requirement,
            type: 'badge',
            iconName: badge.iconName,
            color: badge.color,
            points: 250 // default points for a badge milestone
          });
        }
      });
    }

    prevBadgesRef.current = currentBadges;
  }, [profile?.badges, profile]);

  return null;
};

// Subcomponent that runs silently to monitor the current user's profile for newly earned trophies
const TrophyWatcher: React.FC<{ onCelebrate: (cel: ActiveCelebration) => void }> = ({ onCelebrate }) => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const prevTrophiesRef = useRef<string[] | null>(null);

  useEffect(() => {
    if (!profile) {
      prevTrophiesRef.current = null;
      return;
    }

    const currentTrophies = profile.trophies || [];

    // Initialize on first profile load to avoid triggering toasts for existing trophies
    if (prevTrophiesRef.current === null) {
      prevTrophiesRef.current = currentTrophies;
      return;
    }

    // Find any new trophies added
    const newTrophies = currentTrophies.filter((t) => !prevTrophiesRef.current?.includes(t));
    if (newTrophies.length > 0) {
      newTrophies.forEach((trophyId) => {
        const trophy = TROPHIES.find((t) => t.id === trophyId);
        if (trophy) {
          showToast({
            title: 'Domain Trophy Earned!',
            description: `You materialized the "${trophy.name}" trophy in your Territory!`,
            type: 'milestone',
            duration: 8000
          });
          onCelebrate({
            name: trophy.name,
            description: trophy.description,
            requirement: trophy.requirement,
            type: 'trophy',
            iconName: trophy.iconName,
            color: trophy.color,
            tier: trophy.tier,
            points: trophy.points
          });
        }
      });
    }

    prevTrophiesRef.current = currentTrophies;
  }, [profile?.trophies, profile]);

  return null;
};

// Immersive Full-Screen Celebration Modal
const AchievementModal: React.FC<{
  celebration: ActiveCelebration;
  onClose: () => void;
  theme: 'light' | 'dark';
}> = ({ celebration, onClose, theme }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const text = `============================================================
           🔮 CURSED ACADEMY: SACRED MILESTONE CLEARED 🔮           
============================================================

Type:          ${celebration.type === 'trophy' ? '🏆 GRAND TROPHY' : '🏅 SCHOLARLY FEAT'}
Name:          ${celebration.name} ${celebration.tier ? `[${celebration.tier.toUpperCase()}]` : ''}
Description:   "${celebration.description}"
Requirement:   ${celebration.requirement}
Reward:        ${celebration.points ? `+${celebration.points} Points` : 'Sacred Rank Unlock'}

Purify and conquer your own cursed scrolls at Cursed Academy!
============================================================`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {});
  };

  const getIconComponent = () => {
    if (celebration.type === 'trophy') {
      return getTrophyIcon(celebration.iconName);
    } else {
      return getBadgeIcon(celebration.iconName);
    }
  };

  const Icon = getIconComponent();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      {/* Immersive Celebratory Confetti Rain */}
      <CelebrationConfetti active={true} />

      <motion.div
        initial={{ scale: 0.9, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 120 }}
        className={`relative w-full max-w-lg overflow-hidden border-2 rounded-2xl p-8 flex flex-col items-center text-center shadow-[0_0_50px_rgba(168,85,247,0.35)] ${
          theme === 'dark'
            ? 'bg-neutral-950 border-purple-500/30 text-white'
            : 'bg-white border-purple-500/20 text-neutral-900'
        }`}
        style={{ clipPath: 'polygon(4% 0, 100% 0, 96% 100%, 0% 100%)' }}
      >
        {/* Background Accent Glows */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-yellow-400 to-indigo-500" />
        <div className="absolute -top-32 w-64 h-64 bg-purple-500/15 rounded-full blur-[80px]" />

        {/* Big Animated Icon Ring */}
        <motion.div
          initial={{ rotate: -30, scale: 0.5 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', delay: 0.1, duration: 0.8 }}
          className={`relative p-6 rounded-2xl border mb-6 flex items-center justify-center ${
            theme === 'dark'
              ? 'bg-neutral-900/80 border-purple-500/30'
              : 'bg-neutral-100 border-purple-500/20'
          }`}
        >
          <div className="absolute inset-0 rounded-2xl bg-purple-500/10 animate-ping opacity-70" />
          <Icon className={`${celebration.color}`} size={56} />
        </motion.div>

        {/* Heading */}
        <span className="text-[10px] uppercase font-esports tracking-[0.25em] text-primary mb-1 block font-black">
          {celebration.type === 'trophy' ? '👑 Grand Trophy Unlocked' : '🏅 Scholar Feat Cleared'}
        </span>
        <h2 className="text-3xl font-esports italic font-black uppercase text-on-surface mb-3 tracking-tight drop-shadow-[0_0_12px_rgba(168,85,247,0.25)]">
          {celebration.name}
        </h2>

        {/* Tier badge if available */}
        {celebration.tier && (
          <span className={`text-[9px] font-bold px-3 py-1 border uppercase rounded-full mb-4 tracking-widest bg-purple-500/10 border-purple-500/30 text-purple-400`}>
            {celebration.tier.replace('_', ' ')} Grade
          </span>
        )}

        {/* Description quote box */}
        <div className={`w-full p-4 border border-dashed rounded-xl mb-6 text-sm italic font-medium leading-relaxed ${
          theme === 'dark' ? 'bg-white/[0.02] border-white/10 text-neutral-300' : 'bg-black/[0.01] border-black/10 text-neutral-600'
        }`}>
          "{celebration.description}"
        </div>

        {/* Details & stats */}
        <div className="w-full flex flex-col gap-2 text-xs mb-8">
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="opacity-60 uppercase tracking-wider font-semibold font-mono">Requirement:</span>
            <span className="font-bold">{celebration.requirement}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="opacity-60 uppercase tracking-wider font-semibold font-mono">Energy / Points:</span>
            <span className="font-mono text-purple-400 font-bold">+{celebration.points || 150} PTS</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button
            onClick={handleShare}
            className={`flex-1 flex items-center justify-center gap-2 border text-[11px] uppercase font-bold tracking-widest py-3.5 px-6 rounded-xl transition-all duration-300 cursor-pointer ${
              theme === 'dark'
                ? 'bg-neutral-800 hover:bg-neutral-700 border-white/10 hover:border-white/20 text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 border-black/10 hover:border-black/20 text-neutral-800'
            }`}
          >
            <Share2 size={13} className={copied ? "animate-ping" : ""} />
            {copied ? 'Copied to Clipboard!' : 'Share Milestone'}
          </button>

          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/30 text-[11px] uppercase font-bold tracking-widest py-3.5 px-6 rounded-xl cursor-pointer shadow-[0_4px_20px_rgba(168,85,247,0.3)] hover:shadow-[0_4px_25px_rgba(168,85,247,0.5)] transition-all"
          >
            Confirm & Manifest
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Toast Container to align toasts at the bottom-right of the screen
const ToastContainer: React.FC<{
  toasts: Toast[];
  removeToast: (id: string) => void;
  theme: 'light' | 'dark';
}> = ({ toasts, removeToast, theme }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} theme={theme} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{
  toast: Toast;
  onClose: () => void;
  theme: 'light' | 'dark';
}> = ({ toast, onClose, theme }) => {
  const duration = toast.duration || (toast.type === 'badge' ? 8000 : 5000);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = 16; // ~60fps
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onClose();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [duration, onClose]);

  // Determine Icon and style class depending on type
  let Icon = Info;
  let iconColor = 'text-primary';
  let cardClass = '';

  switch (toast.type) {
    case 'success':
      Icon = CheckCircle2;
      iconColor = 'text-emerald-500';
      cardClass = 'border-emerald-500/20 shadow-[0_4px_30px_rgba(16,185,129,0.15)]';
      break;
    case 'error':
      Icon = AlertTriangle;
      iconColor = 'text-rose-500';
      cardClass = 'border-rose-500/20 shadow-[0_4px_30px_rgba(244,63,94,0.15)]';
      break;
    case 'milestone':
      Icon = Trophy;
      iconColor = 'text-orange-500';
      cardClass = 'border-orange-500/25 shadow-[0_4px_30px_rgba(249,115,22,0.2)]';
      break;
    case 'badge':
      if (toast.badgeId) {
        const badgeObj = BADGES.find(b => b.id === toast.badgeId);
        if (badgeObj) {
          Icon = getBadgeIcon(badgeObj.iconName);
        }
      } else {
        Icon = Award;
      }
      iconColor = 'text-yellow-400';
      cardClass = 'border-yellow-500/35 shadow-[0_4px_40px_rgba(250,204,21,0.25)]';
      break;
    case 'info':
    default:
      Icon = Info;
      iconColor = 'text-sky-500';
      cardClass = 'border-sky-500/20 shadow-[0_4px_30px_rgba(14,165,233,0.15)]';
      break;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      whileHover={{ scale: 1.02 }}
      className={`relative w-full pointer-events-auto backdrop-blur-xl border p-4 rounded-2xl flex gap-3.5 overflow-hidden ${cardClass} ${
        theme === 'dark'
          ? 'bg-neutral-900/85 text-white'
          : 'bg-white/90 text-neutral-900'
      }`}
    >
      {/* Sparkly reflection overlay for badge rewards */}
      {toast.type === 'badge' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none animate-shimmer" />
      )}

      {/* Decorative colored glow backlights */}
      <div className={`absolute -top-12 -left-12 w-24 h-24 rounded-full blur-2xl opacity-25 pointer-events-none ${
        toast.type === 'badge' ? 'bg-yellow-400' :
        toast.type === 'milestone' ? 'bg-orange-500' :
        toast.type === 'success' ? 'bg-emerald-500' :
        toast.type === 'error' ? 'bg-rose-500' : 'bg-sky-500'
      }`} />

      {/* Icon Area */}
      <div className="flex-shrink-0 relative z-10">
        <div className={`w-11 h-11 backdrop-blur-md rounded-xl border flex items-center justify-center ${
          theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
        }`}>
          <Icon className={`${iconColor} ${toast.type === 'badge' ? 'animate-bounce' : ''}`} size={22} />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow min-w-0 relative z-10 pr-2">
        <h4 className={`text-xs font-esports font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5 ${
          toast.type === 'badge' ? 'text-yellow-400 digital-glow' : ''
        }`}>
          {toast.title}
          {toast.type === 'badge' && <Sparkles size={11} className="text-yellow-400 animate-pulse" />}
        </h4>
        <p className={`text-[11px] leading-relaxed ${
          theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'
        }`}>
          {toast.description}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer relative z-10 ${
          theme === 'dark' ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-neutral-500 hover:text-neutral-900 hover:bg-black/5'
        }`}
      >
        <X size={14} />
      </button>

      {/* Glowing bottom progress bar */}
      <div className="absolute bottom-0 inset-x-0 h-[3px] bg-white/5 dark:bg-black/20">
        <div
          className={`h-full transition-all duration-75 ${
            toast.type === 'badge' ? 'bg-gradient-to-r from-yellow-500 to-yellow-300 shadow-[0_0_8px_#fa0]' :
            toast.type === 'milestone' ? 'bg-orange-500' :
            toast.type === 'success' ? 'bg-emerald-500' :
            toast.type === 'error' ? 'bg-rose-500' : 'bg-sky-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

