import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError } from '../services/firebase';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Trophy, Medal, BookOpen, Loader2, Search, Flame, Award, HelpCircle } from 'lucide-react';

export const GrandLeaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayCount, setDisplayCount] = useState<number>(10);

  useEffect(() => {
    setLoading(true);
    const usersRef = collection(db, 'users');
    
    // Query users ordered by tomesConquered descending
    const q = query(
      usersRef,
      orderBy('tomesConquered', 'desc'),
      orderBy('totalPoints', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as UserProfile);
        });
        setLeaders(list);
        setLoading(false);
      },
      (error) => {
        // Ignore
        handleFirestoreError(error, 'list', 'users');
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter leaders by search term
  const filteredLeaders = leaders.filter((user) =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get displayed list of leaders
  const displayedLeaders = filteredLeaders.slice(0, displayCount);

  // Custom function to assign highly cinematic grade titles matching culling games theme
  const getSorcererGrade = (index: number, points: number) => {
    if (index === 0 && points > 50) return "Special Grade Sorcerer Supreme";
    if (index === 0) return "Special Grade Sorcerer";
    if (index === 1) return "First Grade Sorcerer";
    if (index === 2) return "Semi-Grade 1 Sorcerer";
    if (points > 300) return "Grade 1 Sorcerer";
    if (points > 150) return "Grade 2 Sorcerer";
    if (points > 50) return "Grade 3 Sorcerer";
    return "Grade 4 Sorcerer";
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div id="grand-rank-badge-0" className="flex items-center justify-center w-10 h-10 bg-yellow-500/10 border-2 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)] rounded-none rotate-45 transform">
            <Crown size={18} className="-rotate-45 animate-bounce duration-1000" />
          </div>
        );
      case 1:
        return (
          <div id="grand-rank-badge-1" className="flex items-center justify-center w-10 h-10 bg-zinc-300/10 border-2 border-zinc-400 text-zinc-300 rounded-none rotate-45 transform">
            <Trophy size={16} className="-rotate-45" />
          </div>
        );
      case 2:
        return (
          <div id="grand-rank-badge-2" className="flex items-center justify-center w-10 h-10 bg-amber-700/10 border-2 border-amber-800 text-amber-600 rounded-none rotate-45 transform">
            <Medal size={16} className="-rotate-45" />
          </div>
        );
      default:
        return (
          <div id={`grand-rank-badge-${index}`} className="flex items-center justify-center w-10 h-10 bg-on-surface/5 border border-on-surface/10 text-on-surface-variant/70 font-mono text-sm font-black italic">
            #{index + 1}
          </div>
        );
    }
  };

  return (
    <div 
      id="grand-leaderboard-container"
      className="w-full max-w-4xl mx-auto p-6 md:p-10 bg-surface-charcoal/85 backdrop-blur-lg border border-primary/40 relative shadow-[0_0_50px_rgba(0,0,0,0.8)]"
      style={{ clipPath: 'polygon(3% 0, 100% 0, 97% 100%, 0% 100%)' }}
    >
      {/* Cinematic Glowing Accents */}
      <div className="absolute -top-1 left-10 w-32 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_#F8E71C]" />
      <div className="absolute -bottom-1 right-10 w-32 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_#F8E71C]" />
      
      {/* Decorative Gold Corner Lines */}
      <div className="absolute top-0 left-0 w-8 h-[2px] bg-primary shadow-[0_0_10px_#F8E71C]" />
      <div className="absolute top-0 left-0 w-[2px] h-8 bg-primary shadow-[0_0_10px_#F8E71C]" />
      <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-primary shadow-[0_0_10px_#F8E71C]" />
      <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-primary shadow-[0_0_10px_#F8E71C]" />

      {/* Header section */}
      <div id="grand-leaderboard-header" className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-primary/20 pb-6">
        <div>
          <span className="text-xs uppercase font-esports tracking-[0.4em] text-primary font-black italic block mb-2">
            The Hall of Conquered Tomes
          </span>
          <h2 className="text-3xl md:text-4xl font-esports font-black italic uppercase tracking-tight text-on-surface flex items-center gap-3">
            <Award className="text-primary animate-pulse" size={32} />
            GRAND LEADERBOARD
          </h2>
        </div>

        {/* Filters and Search controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full sm:w-64">
            <input
              id="grand-leaderboard-search"
              type="text"
              placeholder="Locate Sorcerer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/60 border border-primary/20 hover:border-primary/40 focus:border-primary px-4 py-2.5 pl-10 text-xs font-mono tracking-wider text-on-surface uppercase outline-none transition-all placeholder:text-on-surface-variant/30"
              style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}
            />
            <Search className="absolute left-3.5 top-3 text-on-surface-variant/40" size={14} />
          </div>

          <div className="flex items-center gap-1 bg-black/40 border border-primary/20 p-1" style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}>
            {[5, 10, 20].map((num) => (
              <button
                key={num}
                id={`grand-leaderboard-limit-${num}`}
                onClick={() => setDisplayCount(num)}
                className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest font-black transition-all ${
                  displayCount === num
                    ? 'bg-primary text-surface font-black'
                    : 'text-on-surface-variant/60 hover:text-primary hover:bg-primary/10'
                }`}
              >
                Top {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div id="grand-leaderboard-loader" className="py-24 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-primary" size={36} />
          <span className="text-xs uppercase tracking-[0.3em] font-black text-primary/75 font-esports">
            Syncing Arena Chronicles...
          </span>
        </div>
      ) : filteredLeaders.length === 0 ? (
        <div id="grand-leaderboard-empty" className="py-20 text-center border border-dashed border-primary/10 bg-black/20">
          <HelpCircle className="mx-auto text-primary/30 mb-4" size={40} />
          <p className="text-sm font-esports font-bold uppercase text-on-surface-variant/50 tracking-widest">
            No Records Found matching "{searchTerm}"
          </p>
        </div>
      ) : (
        <div id="grand-leaderboard-list" className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {displayedLeaders.map((row, idx) => {
              const isFirst = idx === 0;
              const grade = getSorcererGrade(idx, row.totalPoints);
              
              return (
                <motion.div
                  key={row.userId}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 38,
                    mass: 0.6,
                    delay: idx * 0.04
                  }}
                  className={`p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border transition-all duration-300 relative overflow-hidden group ${
                    isFirst 
                      ? 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/60 shadow-[0_0_20px_rgba(248,231,28,0.1)]' 
                      : 'bg-black/30 border-white/5 hover:border-primary/30 hover:bg-primary/[0.02]'
                  }`}
                  style={{ clipPath: 'polygon(1.5% 0, 100% 0, 98.5% 100%, 0% 100%)' }}
                >
                  {/* Subtle Background Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="flex items-center gap-5">
                    {/* Rank Indicator */}
                    <div className="flex-shrink-0 w-12 flex items-center justify-center">
                      {getRankBadge(idx)}
                    </div>
                    
                    {/* Avatar Container */}
                    <div className="relative flex-shrink-0">
                      {row.photoURL ? (
                        <img 
                          src={row.photoURL} 
                          alt={row.displayName} 
                          className={`w-12 h-12 object-cover ${isFirst ? 'border-2 border-primary' : 'border border-on-surface/20'}`}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-12 h-12 flex items-center justify-center font-black text-base bg-surface-charcoal text-on-surface-variant/40 ${isFirst ? 'border-2 border-primary' : 'border border-on-surface/20'}`}>
                          {row.displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      
                      {isFirst && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                        </span>
                      )}
                    </div>

                    {/* Name and Level Metadata */}
                    <div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h4 className={`text-base font-esports font-black italic uppercase tracking-wider ${
                          isFirst ? 'text-primary digital-glow' : 'text-on-surface group-hover:text-primary transition-colors duration-300'
                        }`}>
                          {row.displayName}
                        </h4>
                        
                        {isFirst && (
                          <span className="px-2 py-0.5 bg-primary/20 border border-primary text-[8px] font-mono uppercase tracking-widest font-black text-primary">
                            Apex Sorcerer
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-on-surface-variant/70 font-semibold tracking-wider uppercase">
                          {grade}
                        </span>
                        <span className="text-[9px] text-primary/40 font-black">•</span>
                        <span className="text-[10px] text-on-surface-variant/50 font-mono tracking-wider">
                          {row.totalPoints.toLocaleString()} CE (Cursed Energy)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Leader Stats / Conquered Tomes display */}
                  <div className="flex items-center justify-between md:justify-end gap-8 border-t border-white/5 pt-3 md:border-t-0 md:pt-0">
                    <div className="md:hidden text-[9px] uppercase font-mono text-on-surface-variant/40 tracking-wider">
                      Sealed Tomes
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-on-surface">
                          <BookOpen className={`w-4 h-4 ${isFirst ? 'text-primary' : 'text-on-surface-variant/60'}`} />
                          <span className={`text-xl md:text-2xl font-esports font-black italic tracking-tighter ${
                            isFirst ? 'text-primary digital-glow' : 'text-on-surface'
                          }`}>
                            {row.tomesConquered.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[8px] text-on-surface-variant/40 uppercase tracking-[0.25em] font-black font-mono">
                          {row.tomesConquered === 1 ? 'Tome Conquered' : 'Tomes Conquered'}
                        </span>
                      </div>
                      
                      {/* Decorative status ring or line */}
                      <div className="h-10 w-[2px] bg-gradient-to-b from-primary/40 via-transparent to-transparent hidden md:block" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Hall of Fame Summary footer */}
      <div id="grand-leaderboard-footer" className="mt-8 pt-4 border-t border-primary/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-mono text-on-surface-variant/40 uppercase tracking-widest">
        <span>Chronicles update instantly as Tomes are reviewed by Oracles</span>
        <span>The Culling Arena c.2026</span>
      </div>
    </div>
  );
};
