import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Award, Zap, ChevronRight, X, Flame } from 'lucide-react';

interface RankAdvancementModalProps {
  isOpen: boolean;
  oldGrade: string;
  newGrade: string;
  onClose: () => void;
}

const GRADE_METADATA: Record<string, {
  levelStr: string;
  color: string;
  glow: string;
  bg: string;
  description: string;
  perks: string[];
}> = {
  'Grade 4': {
    levelStr: '4',
    color: 'text-sky-400',
    glow: 'shadow-sky-500/50',
    bg: 'bg-sky-500/10 border-sky-500/30',
    description: 'Starting Acolyte of the Academy.',
    perks: ['Access to basic tomes', 'Standard Cursed Energy tracking'],
  },
  'Grade 3': {
    levelStr: '3',
    color: 'text-emerald-400',
    glow: 'shadow-emerald-500/50',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    description: 'Active Combatant. Capable of slicing basic curses.',
    perks: ['Unlock dynamic reading stats', 'Increased aura multiplication rate (+10%)', 'Grade 3 specialized seal access'],
  },
  'Grade 2': {
    levelStr: '2',
    color: 'text-yellow-400',
    glow: 'shadow-yellow-500/50',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    description: 'Formidable Vanguard. Mastery of intermediate texts.',
    perks: ['Access to advanced recommendations', 'Refined energy retention mechanics (+25%)', 'Premium custom theme authorization'],
  },
  'Grade 1': {
    levelStr: '1',
    color: 'text-orange-400',
    glow: 'shadow-orange-500/50',
    bg: 'bg-orange-500/10 border-orange-500/30',
    description: 'Elite Sorcerer. High-level cognitive extraction capabilities.',
    perks: ['Elite status on weekly registers', 'Maximum extraction multipliers (+50%)', 'Priority access to ancient archives'],
  },
  'Special Grade': {
    levelStr: 'S',
    color: 'text-red-400',
    glow: 'shadow-red-500/50',
    bg: 'bg-red-500/10 border-red-500/30',
    description: 'An anomaly of boundless cursed energy. Ultimate cognitive force.',
    perks: ['Boundless domain expansion clearance', 'God-tier leaderboard insignia', 'Unlimited prestige multipliers (+100%)'],
  },
};

export const RankAdvancementModal: React.FC<RankAdvancementModalProps> = ({
  isOpen,
  oldGrade,
  newGrade,
  onClose,
}) => {
  const currentMeta = GRADE_METADATA[newGrade] || GRADE_METADATA['Grade 4'];
  const oldMeta = GRADE_METADATA[oldGrade] || GRADE_METADATA['Grade 4'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Immersive Dark Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />

          {/* Scanner/Terminal Grid Overlay effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] z-10" />

          {/* Majestic Cinematic Modal Container */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, rotateX: 30 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.9, opacity: 0, rotateX: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 120 }}
            className="relative w-full max-w-2xl bg-[#0a0a0c] border border-primary/40 p-8 text-white rounded-lg shadow-2xl overflow-hidden z-20"
            style={{ 
              clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
              perspective: '1000px'
            }}
          >
            {/* Visual background flairs */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer z-30"
            >
              <X size={20} />
            </button>

            {/* Upper Emblem */}
            <div className="flex flex-col items-center text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 12 }}
                className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-4 relative"
              >
                <Flame className="text-primary animate-pulse" size={32} />
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-full border border-primary/50"
                />
              </motion.div>

              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-[10px] font-mono font-black tracking-[0.4em] text-primary uppercase italic"
              >
                SYSTEM CALIBRATION COMPLETED
              </motion.span>
              
              <motion.h2 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-4xl md:text-5xl font-esports italic font-black text-on-surface uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-light to-white digital-glow mt-1"
              >
                Rank Advanced
              </motion.h2>
            </div>

            {/* The Cinematic Comparison Grid */}
            <div className="grid grid-cols-5 gap-4 items-center justify-center my-8 py-6 border-y border-white/5 bg-white/[0.02]">
              {/* Previous Grade card */}
              <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="col-span-2 p-4 rounded-lg bg-black/40 border border-white/10 text-center flex flex-col items-center justify-center"
              >
                <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest block mb-2">Previous Status</span>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-esports font-black text-xl mb-2 bg-white/5 border border-white/10 text-white/40`}>
                  {oldMeta.levelStr}
                </div>
                <span className="text-xs font-esports text-white/50 uppercase tracking-wide truncate max-w-full">
                  {oldGrade}
                </span>
              </motion.div>

              {/* Holographic Transition Arrow */}
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="col-span-1 flex flex-col items-center justify-center text-primary"
              >
                <motion.div
                  animate={{ x: [-4, 4, -4] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                >
                  <ChevronRight size={32} className="text-primary-light filter drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                </motion.div>
                <span className="text-[8px] font-mono text-primary/60 uppercase font-bold tracking-tighter mt-1 animate-pulse">ASCEND</span>
              </motion.div>

              {/* NEW Grade card (Glowing) */}
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className={`col-span-2 p-4 rounded-lg border text-center flex flex-col items-center justify-center shadow-lg relative overflow-hidden ${currentMeta.bg}`}
              >
                {/* Micro particle/energy background inside new grade card */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/[0.03]" />
                
                <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest block mb-2 relative z-10">New Classification</span>
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className={`w-14 h-14 rounded-lg flex items-center justify-center font-esports font-black text-2xl mb-2 bg-black/60 border-2 border-current ${currentMeta.color} relative z-10`}
                >
                  {currentMeta.levelStr}
                </motion.div>
                <span className={`text-sm font-esports uppercase tracking-wide block font-black truncate max-w-full relative z-10 ${currentMeta.color}`}>
                  {newGrade}
                </span>
              </motion.div>
            </div>

            {/* Lore & Details Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-8"
            >
              <h4 className="text-[10px] font-mono font-black text-white/40 uppercase tracking-widest mb-2">Classification Profile</h4>
              <p className="text-sm text-white/80 italic font-medium leading-relaxed border-l-2 border-primary/40 pl-4 py-1 bg-white/[0.01]">
                "{currentMeta.description}"
              </p>
            </motion.div>

            {/* Unlocked Perks list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mb-10"
            >
              <h4 className="text-[10px] font-mono font-black text-white/40 uppercase tracking-widest mb-3">UNLOCKED ARCHETYPE ATTRIBUTES</h4>
              <ul className="space-y-2.5">
                {currentMeta.perks.map((perk, idx) => (
                  <motion.li 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 + idx * 0.1 }}
                    className="flex items-center gap-3 text-xs text-white/90 bg-white/[0.02] hover:bg-white/[0.04] p-2.5 border border-white/5 rounded transition-all"
                  >
                    <Zap className="text-primary-light" size={14} />
                    <span>{perk}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex justify-center"
            >
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-10 py-3 bg-primary text-black font-esports font-black text-xs uppercase tracking-widest transition-all hover:bg-white hover:text-black cursor-pointer shadow-lg hover:shadow-primary/20"
                style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
              >
                Acknowledge Ascension
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
