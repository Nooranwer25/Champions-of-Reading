import React, { useState, useEffect } from 'react';
import { Submission, SubmissionStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Lock, 
  Unlock, 
  Sparkles, 
  Flame, 
  Zap, 
  Compass, 
  X, 
  Scroll, 
  Award, 
  ShieldAlert,
  Moon
} from 'lucide-react';
import { useTheme } from '../services/ThemeContext';

interface LoreFragmentsProps {
  submissions: Submission[];
}

export interface LoreFragment {
  id: string;
  title: string;
  milestone: number; // in minutes
  snippet: string;
  source: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Forbidden';
  rune: string;
  glowColor: string;
  borderColor: string;
  bgGradient: string;
  textColor: string;
}

const LORE_FRAGMENTS: LoreFragment[] = [
  {
    id: 'seal_whisper',
    title: 'The Whispering Vellum',
    milestone: 10,
    snippet: 'The first seals are always the thinnest. When the initiate unbinds the black leather cover, a faint sigh escapes from between the pages. It is not air, but the shallow breath of an archivist who died three centuries ago, still trying to pronounce the final vowel of an ancient curse.',
    source: 'The Chronicle of Silt and Ink, Vol. I',
    rarity: 'Common',
    rune: 'ᛗ',
    glowColor: 'rgba(250, 204, 21, 0.25)', // Yellow
    borderColor: 'border-yellow-500/30 hover:border-yellow-400/60',
    bgGradient: 'from-yellow-950/10 via-neutral-900/60 to-black/80',
    textColor: 'text-yellow-400'
  },
  {
    id: 'ink_stain',
    title: 'The Ink-Stained Hands',
    milestone: 30,
    snippet: 'They tell you to wear silk gloves when handling the forbidden codices, but the dark fluid penetrates any barrier. It slowly seeps into your pores, turning the veins under your fingertips a midnight indigo. Soon, you will find you no longer need a quill; you will write on parchment simply by bleeding.',
    source: 'Memoirs of the Bleeding Scribe',
    rarity: 'Rare',
    rune: 'ᚠ',
    glowColor: 'rgba(56, 189, 248, 0.25)', // Cyan
    borderColor: 'border-cyan-500/30 hover:border-cyan-400/60',
    bgGradient: 'from-cyan-950/10 via-neutral-900/60 to-black/80',
    textColor: 'text-cyan-400'
  },
  {
    id: 'sovereign_silence',
    title: 'The Sovereign’s Silence',
    milestone: 60,
    snippet: 'The Sovereign does not speak to those who merely skim. Only when the candles have burned down to their brass sockets, and the shadow of the window-panes stretches like long fingers across the floor, does the third seal dissolve. A silent throne appears in the mind’s eye, awaiting its keeper.',
    source: 'Testament of the Silent King',
    rarity: 'Rare',
    rune: 'ᚻ',
    glowColor: 'rgba(139, 92, 246, 0.25)', // Purple/Violet
    borderColor: 'border-purple-500/30 hover:border-purple-400/60',
    bgGradient: 'from-purple-950/10 via-neutral-900/60 to-black/80',
    textColor: 'text-purple-400'
  },
  {
    id: 'margin_eyes',
    title: 'Eyes in the Margins',
    milestone: 120,
    snippet: 'Look too closely at the decorative borders of the manuscript, and the floral motifs will begin to blink. The ink was mixed with the crushed eyes of deep-sea entities that have never seen sunlight. They watch you read. They are judging your posture.',
    source: 'Anatomy of Eldritch Typography',
    rarity: 'Epic',
    rune: 'ᚦ',
    glowColor: 'rgba(236, 72, 153, 0.25)', // Pink/Magenta
    borderColor: 'border-pink-500/30 hover:border-pink-400/60',
    bgGradient: 'from-pink-950/10 via-neutral-900/60 to-black/80',
    textColor: 'text-pink-400'
  },
  {
    id: 'crimson_ledger',
    title: 'The Weightless Codex',
    milestone: 240,
    snippet: 'There is a chamber in the back of the Library where the books are chained not to the shelves, but to the granite floor, lest they float away. Some say they are filled with the weightless thoughts of souls that disintegrated during the Great Ascension. To read them is to forget your own name.',
    source: 'Treatise on Cognitive Buoyancy',
    rarity: 'Legendary',
    rune: 'ᚱ',
    glowColor: 'rgba(239, 68, 68, 0.3)', // Red
    borderColor: 'border-red-500/30 hover:border-red-400/60',
    bgGradient: 'from-red-950/10 via-neutral-900/60 to-black/80',
    textColor: 'text-red-400'
  },
  {
    id: 'ninth_incantation',
    title: 'The Ninth Incantation',
    milestone: 480,
    snippet: 'At the absolute apex of focus, the words stop being letters. They become pure heat. The parchment warms against your palms, and for a split second, you understand the language of the ash. You realize the entire world is just a draft being written by something that keeps erasing its mistakes.',
    source: 'Shattered Grimoire of the First Scribe',
    rarity: 'Forbidden',
    rune: 'ᛟ',
    glowColor: 'rgba(16, 185, 129, 0.3)', // Emerald
    borderColor: 'border-emerald-500/30 hover:border-emerald-400/60',
    bgGradient: 'from-emerald-950/10 via-neutral-900/60 to-black/80',
    textColor: 'text-emerald-400'
  }
];

export const LoreFragments: React.FC<LoreFragmentsProps> = ({ submissions }) => {
  const { theme } = useTheme();
  const [bonusMinutes, setBonusMinutes] = useState<number>(0);
  const [activeFragment, setActiveFragment] = useState<LoreFragment | null>(null);
  const [showUnlockAlert, setShowUnlockAlert] = useState<string | null>(null);

  // Load bonus minutes from localStorage (persists focused session increments)
  useEffect(() => {
    const saved = localStorage.getItem('lore_fragments_bonus_minutes');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) {
        setBonusMinutes(parsed);
      }
    }
  }, []);

  // Compute total approved pages
  const totalPagesRead = submissions
    .filter(s => s.status === SubmissionStatus.APPROVED)
    .reduce((acc, s) => acc + (s.pagesRead || 0), 0);

  // Conversion: Assume 1.5 minutes of deep focus per approved page
  const derivedMinutes = Math.round(totalPagesRead * 1.5);
  const totalMinutes = derivedMinutes + bonusMinutes;

  // Track unlocks to trigger flash visual effect
  useEffect(() => {
    // Check if any fragment was newly unlocked and notify
    const unlockedList = LORE_FRAGMENTS.filter(f => totalMinutes >= f.milestone);
    const lastUnlocked = unlockedList[unlockedList.length - 1];
    
    if (lastUnlocked) {
      const alertedKey = `lore_alert_seen_${lastUnlocked.id}`;
      const alreadySeen = localStorage.getItem(alertedKey);
      if (!alreadySeen && totalMinutes >= lastUnlocked.milestone) {
        setShowUnlockAlert(lastUnlocked.title);
        localStorage.setItem(alertedKey, 'true');
        // Clear alert after 5 seconds
        setTimeout(() => setShowUnlockAlert(null), 5000);
      }
    }
  }, [totalMinutes]);

  // Handle adding bonus reading session minutes
  const handleDeepenMeditation = (amount: number) => {
    const newBonus = bonusMinutes + amount;
    setBonusMinutes(newBonus);
    localStorage.setItem('lore_fragments_bonus_minutes', newBonus.toString());
  };

  const handleResetMeditation = () => {
    if (window.confirm("Are you sure you want to reset your simulated deep-focus minutes? (Approved pages read will still count)")) {
      setBonusMinutes(0);
      localStorage.setItem('lore_fragments_bonus_minutes', '0');
      // Clear alert storage for testing
      LORE_FRAGMENTS.forEach(f => {
        localStorage.removeItem(`lore_alert_seen_${f.id}`);
      });
    }
  };

  return (
    <section className="mb-24 relative" id="lore-fragments-section">
      {/* Decorative Dark Fantasy Border/Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12 border-b border-primary/20 pb-8 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Scroll className="text-primary animate-pulse" size={26} />
            <h3 className="text-4xl font-esports italic text-on-surface uppercase tracking-tighter digital-glow">Lore Fragments</h3>
          </div>
          <span className="text-[10px] uppercase font-esports tracking-[0.3em] text-primary/40 font-black italic block">
            Eldritch Echoes & Fictional Transcriptions unlocked by deep-focus reading
          </span>
        </div>

        {/* Focus Duration Dashboard HUD */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-neutral-950/80 border border-neutral-800 p-4 flex items-center gap-4 shadow-xl rounded-lg" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 block">Focus Duration</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-esports italic text-primary">{totalMinutes}</span>
                <span className="text-[10px] font-mono text-neutral-400 uppercase">MINUTES</span>
              </div>
            </div>
            
            <div className="h-8 w-px bg-neutral-800" />

            <div className="text-[9px] font-mono text-neutral-400 space-y-0.5">
              <div>📄 Pages read: <span className="text-white font-bold">{totalPagesRead}</span></div>
              <div>⚡ Derived focus: <span className="text-white font-bold">{derivedMinutes}m</span></div>
              {bonusMinutes > 0 && <div>🔮 Bonus focus: <span className="text-emerald-400 font-bold">+{bonusMinutes}m</span></div>}
            </div>
          </div>

          {/* Scribing Session Simulator Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleDeepenMeditation(15)}
              className="px-3 py-2 bg-neutral-950/80 hover:bg-primary/10 border border-primary/20 hover:border-primary/50 text-[9px] font-esports font-bold tracking-widest text-primary uppercase rounded-md transition-all flex items-center gap-1 cursor-pointer"
            >
              <Zap size={10} className="text-primary animate-bounce" />
              Scribe +15m
            </button>
            <button
              onClick={() => handleDeepenMeditation(60)}
              className="px-3 py-2 bg-neutral-950/80 hover:bg-secondary/10 border border-secondary/20 hover:border-secondary/50 text-[9px] font-esports font-bold tracking-widest text-secondary uppercase rounded-md transition-all flex items-center gap-1 cursor-pointer"
            >
              <Flame size={10} className="text-secondary" />
              Meditate +1h
            </button>
            {bonusMinutes > 0 && (
              <button
                onClick={handleResetMeditation}
                className="p-2 border border-red-900/30 hover:border-red-500/50 bg-red-950/10 hover:bg-red-950/30 text-red-400 text-[9px] font-mono uppercase tracking-wider rounded-md transition-all cursor-pointer"
                title="Reset bonus training focus minutes"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* NEWLY UNLOCKED LIVE TOAST ALERT */}
      <AnimatePresence>
        {showUnlockAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-black/90 border-2 border-primary/50 p-4 shadow-[0_0_25px_rgba(250,204,21,0.2)] flex items-start gap-4"
            style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
          >
            <div className="p-2.5 bg-primary/10 border border-primary/30 rounded-md">
              <Sparkles size={18} className="text-primary animate-spin" />
            </div>
            <div className="flex-grow space-y-1">
              <span className="text-[9px] font-esports font-bold tracking-widest text-primary uppercase block">LORE FRAGMENT UNLOCKED</span>
              <h4 className="text-sm font-esports font-black text-white tracking-wide uppercase italic">{showUnlockAlert}</h4>
              <p className="text-[10px] font-mono text-neutral-400">A new parchment snippet is readable in your obsidian repository.</p>
            </div>
            <button onClick={() => setShowUnlockAlert(null)} className="text-neutral-500 hover:text-white p-1">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {LORE_FRAGMENTS.map((fragment, idx) => {
          const isUnlocked = totalMinutes >= fragment.milestone;
          const progressPercent = Math.min(100, Math.round((totalMinutes / fragment.milestone) * 100));

          return (
            <motion.div
              key={fragment.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className={`relative border flex flex-col justify-between min-h-[290px] p-6 transition-all duration-500 overflow-hidden group ${
                isUnlocked 
                  ? `bg-gradient-to-b ${fragment.bgGradient} ${fragment.borderColor} shadow-[0_0_20px_rgba(0,0,0,0.6)]` 
                  : 'bg-black/60 border-neutral-800/40 opacity-70 hover:opacity-100 hover:border-neutral-700/60'
              }`}
              style={{ 
                clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)',
                boxShadow: isUnlocked ? `inset 0 0 30px rgba(0,0,0,0.8), 0 0 15px ${fragment.glowColor}` : undefined
              }}
              whileHover={{ 
                y: isUnlocked ? -6 : -2,
                boxShadow: isUnlocked ? `inset 0 0 30px rgba(0,0,0,0.8), 0 0 35px ${fragment.glowColor}` : undefined
              }}
            >
              {/* Mythical Background Glyph */}
              <div 
                className={`absolute right-4 bottom-4 text-8xl font-black font-esports select-none pointer-events-none opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700 ${
                  isUnlocked ? fragment.textColor : 'text-neutral-600'
                }`}
              >
                {fragment.rune}
              </div>

              <div>
                {/* Header info (Rarity & Milestone) */}
                <div className="flex justify-between items-center mb-5 relative z-10">
                  <span className={`text-[9px] font-esports tracking-[0.2em] font-black uppercase px-2.5 py-1 border ${
                    isUnlocked 
                      ? `${fragment.textColor} bg-white/5 border-current/20` 
                      : 'text-neutral-500 bg-neutral-900/40 border-neutral-800'
                  }`} style={{ clipPath: 'polygon(5px 0, 100% 0, 95% 100%, 0% 100%)' }}>
                    {fragment.rarity}
                  </span>

                  <div className="flex items-center gap-1.5 font-mono text-[9px] text-neutral-400 uppercase">
                    <BookOpen size={10} />
                    <span>{fragment.milestone}m Focus</span>
                  </div>
                </div>

                {/* Title & locked symbol */}
                <div className="space-y-3 mb-4 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 border rounded-md transition-colors ${
                      isUnlocked 
                        ? `bg-black/50 ${fragment.borderColor} ${fragment.textColor}` 
                        : 'bg-neutral-950/40 border-neutral-800/80 text-neutral-500'
                    }`}>
                      {isUnlocked ? <Unlock size={14} className="animate-pulse" /> : <Lock size={14} />}
                    </div>
                    <h4 className={`text-lg font-esports font-bold uppercase tracking-wider transition-colors ${
                      isUnlocked ? 'text-white group-hover:text-primary' : 'text-neutral-500'
                    }`}>
                      {isUnlocked ? fragment.title : 'Encrypted Chronicle'}
                    </h4>
                  </div>

                  <p className={`text-xs leading-relaxed font-mono italic transition-opacity ${
                    isUnlocked ? 'text-neutral-400 line-clamp-3' : 'text-neutral-600'
                  }`}>
                    {isUnlocked 
                      ? `"${fragment.snippet}"` 
                      : "The parchment pages are bound tightly by a seal of shadow. Scribe more transcriptions to channel enough cursed energy to unravel the ancient knot."
                    }
                  </p>
                </div>
              </div>

              {/* Action / Progress bar at bottom */}
              <div className="relative z-10 pt-4 border-t border-white/5 mt-auto">
                {isUnlocked ? (
                  <button
                    onClick={() => setActiveFragment(fragment)}
                    className={`w-full py-2 border font-esports font-black text-[11px] uppercase tracking-wider italic bg-black/60 hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${fragment.borderColor} ${fragment.textColor}`}
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)' }}
                  >
                    <Scroll size={12} />
                    Unfurl Scroll
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-mono uppercase text-neutral-500">
                      <span>Seal Inscription</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-950 border border-neutral-900 rounded-sm overflow-hidden">
                      <div 
                        className="h-full bg-neutral-800 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ANCIENT SCROLL MODAL VIEW */}
      <AnimatePresence>
        {activeFragment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            {/* Modal Overlay Dismiss */}
            <div className="absolute inset-0" onClick={() => setActiveFragment(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="relative w-full max-w-2xl bg-[#1a1410] border-2 border-amber-900/60 p-8 md:p-12 text-amber-950 shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden rounded-md"
              style={{ 
                backgroundImage: `
                  radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.05) 0%, transparent 80%),
                  linear-gradient(to bottom, #f5efe6 0%, #e1d5c3 100%)
                `,
                boxShadow: 'inset 0 0 60px rgba(100,60,20,0.35), 0 0 30px rgba(0,0,0,0.8)'
              }}
            >
              {/* Authentic Parchment burnt edges / rings */}
              <div className="absolute inset-0 border border-amber-950/20 m-2 pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-4 w-[2px] bg-amber-950/10 pointer-events-none" />
              <div className="absolute top-0 bottom-0 right-4 w-[2px] bg-amber-950/10 pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setActiveFragment(null)}
                className="absolute top-6 right-6 p-2 rounded-full border border-amber-950/30 hover:bg-amber-950 hover:text-white text-amber-950/70 transition-all duration-300 z-10 cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Scroll Content */}
              <div className="space-y-6 relative z-10 select-none">
                {/* Scroll Top Seal Emblem */}
                <div className="flex justify-center flex-col items-center gap-1">
                  <div className="w-10 h-10 border border-amber-950/40 rounded-full flex items-center justify-center text-xl font-bold font-esports text-amber-900/80 bg-[#f5efe6] shadow-sm">
                    {activeFragment.rune}
                  </div>
                  <div className="h-4 w-[1px] bg-gradient-to-b from-amber-950/40 to-transparent" />
                </div>

                <div className="text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-800 font-bold block">
                    — {activeFragment.rarity} Transcription —
                  </span>
                  <h3 className="text-3xl font-esports italic text-amber-950 uppercase tracking-wide">
                    {activeFragment.title}
                  </h3>
                  <div className="flex items-center justify-center gap-2 font-mono text-[9px] text-amber-700 uppercase">
                    <Award size={10} />
                    <span>Unlocked at {activeFragment.milestone} Minutes of Focus</span>
                  </div>
                </div>

                {/* Main gothic handwriting body */}
                <div className="py-6 border-y border-amber-950/10 my-4">
                  <p className="text-base md:text-lg leading-relaxed font-serif text-amber-950 text-center italic font-medium px-4 md:px-8">
                    "{activeFragment.snippet}"
                  </p>
                </div>

                {/* Source details */}
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700">Source Chronicle</span>
                  <p className="text-xs font-serif font-black italic text-amber-900">
                    {activeFragment.source}
                  </p>
                </div>

                {/* Footer seal */}
                <div className="pt-4 flex justify-center">
                  <div className="flex items-center gap-1 text-[9px] font-mono text-amber-600 uppercase tracking-widest bg-amber-950/5 px-3 py-1.5 rounded-full border border-amber-950/10">
                    <Moon size={8} />
                    <span>Obsidian Library Repository</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
