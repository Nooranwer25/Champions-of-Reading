import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Submission, SubmissionStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../services/ThemeContext';
import { Crown, Trophy, Medal, BookOpen, Loader2 } from 'lucide-react';

interface ArchivistRow {
  userId: string;
  displayName: string;
  photoURL?: string;
  totalPagesRead: number;
  tomesConquered: number;
}

export const TopArchivists: React.FC = () => {
  const [archivists, setArchivists] = useState<ArchivistRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We listen to both users and submissions in real-time to build a fully live leaderboard.
    const usersQuery = collection(db, 'users');
    const subsQuery = query(
      collection(db, 'submissions'),
      where('status', '==', SubmissionStatus.APPROVED)
    );

    let unsubUsers: () => void;
    let unsubSubs: () => void;

    let usersList: UserProfile[] = [];
    let submissionsList: Submission[] = [];

    const processLeaderboard = () => {
      // 1. Map to track page counts and approved tomes per user
      const pageCounts: Record<string, number> = {};
      const tomeCounts: Record<string, number> = {};

      // Fill in page counts and conquered tomes from approved submissions
      submissionsList.forEach((sub) => {
        const uid = sub.userId;
        if (uid) {
          pageCounts[uid] = (pageCounts[uid] || 0) + (sub.pagesRead || 0);
          tomeCounts[uid] = (tomeCounts[uid] || 0) + 1;
        }
      });

      // 2. Build rows combining UserProfile data and aggregated submissions
      const rows: ArchivistRow[] = usersList.map((user) => ({
        userId: user.userId,
        displayName: user.displayName || 'Anonymous Sorcerer',
        photoURL: user.photoURL,
        totalPagesRead: pageCounts[user.userId] || 0,
        tomesConquered: tomeCounts[user.userId] || 0,
      }));

      // 3. Handle cases where a user might have approved submissions but no user doc (fallback)
      submissionsList.forEach((sub) => {
        const uid = sub.userId;
        if (uid && !rows.some(r => r.userId === uid)) {
          rows.push({
            userId: uid,
            displayName: sub.userName || 'Anonymous Sorcerer',
            totalPagesRead: pageCounts[uid] || 0,
            tomesConquered: tomeCounts[uid] || 0,
          });
        }
      });

      // 4. Sort by totalPagesRead descending, then by tomesConquered descending
      rows.sort((a, b) => {
        if (b.totalPagesRead !== a.totalPagesRead) {
          return b.totalPagesRead - a.totalPagesRead;
        }
        return b.tomesConquered - a.tomesConquered;
      });

      // 5. Select top 5
      setArchivists(rows.slice(0, 5));
      setLoading(false);
    };

    unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const u: UserProfile[] = [];
      snapshot.forEach((doc) => {
        u.push(doc.data() as UserProfile);
      });
      usersList = u;
      processLeaderboard();
    }, (error) => {
      // Ignore
    });

    unsubSubs = onSnapshot(subsQuery, (snapshot) => {
      const s: Submission[] = [];
      snapshot.forEach((doc) => {
        s.push(doc.data() as Submission);
      });
      submissionsList = s;
      processLeaderboard();
    }, (error) => {
      // Ignore
    });

    return () => {
      unsubUsers && unsubUsers();
      unsubSubs && unsubSubs();
    };
  }, []);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-yellow-500/10 border border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
            <Crown size={16} className="animate-pulse" />
          </div>
        );
      case 1:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-zinc-400/10 border border-zinc-400 text-zinc-400">
            <Trophy size={14} />
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-amber-700/10 border border-amber-700 text-amber-700">
            <Medal size={14} />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-on-surface/5 border border-on-surface/10 text-on-surface-variant/70 font-mono text-xs font-bold">
            #{index + 1}
          </div>
        );
    }
  };

  return (
    <div 
      id="top-archivists-leaderboard"
      className="w-full max-w-2xl mx-auto p-8 bg-surface-charcoal/60 backdrop-blur-md border border-primary/30 relative"
      style={{ clipPath: 'polygon(4% 0, 100% 0, 96% 100%, 0% 100%)' }}
    >
      {/* Decorative Gold Corner Lines */}
      <div className="absolute top-0 left-0 w-6 h-[2px] bg-primary shadow-[0_0_8px_#F8E71C]" />
      <div className="absolute top-0 left-0 w-[2px] h-6 bg-primary shadow-[0_0_8px_#F8E71C]" />
      <div className="absolute bottom-0 right-0 w-6 h-[2px] bg-primary shadow-[0_0_8px_#F8E71C]" />
      <div className="absolute bottom-0 right-0 w-[2px] h-6 bg-primary shadow-[0_0_8px_#F8E71C]" />

      <div className="flex items-center justify-between mb-8 border-b border-primary/20 pb-4">
        <div>
          <span className="text-[10px] uppercase font-esports tracking-[0.3em] text-primary font-black italic block mb-1">
            Archivist Records
          </span>
          <h3 className="text-2xl font-esports font-black italic uppercase tracking-tight text-on-surface">
            TOP ARCHIVISTS
          </h3>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 border border-primary/20 text-[9px] font-mono uppercase tracking-widest font-black text-primary">
          <BookOpen size={12} />
          PAGES EXORCISED
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-primary" size={24} />
          <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">
            Querying Archive Records...
          </span>
        </div>
      ) : archivists.length === 0 ? (
        <div className="py-12 text-center text-on-surface-variant/60 font-bold uppercase text-[11px] tracking-wider">
          No records registered in this culling season.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {archivists.map((row, idx) => (
              <motion.div
                key={row.userId}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                  mass: 0.5,
                  delay: idx * 0.05
                }}
                className={`p-4 flex items-center justify-between border transition-all ${
                  idx === 0 
                    ? 'bg-primary/5 border-primary/40 hover:bg-primary/10 shadow-[inset_0_0_15px_rgba(248,231,28,0.05)]' 
                    : 'bg-on-surface/[0.02] border-on-surface/5 hover:border-primary/20 hover:bg-on-surface/[0.04]'
                }`}
                style={{ clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0% 100%)' }}
              >
                <div className="flex items-center gap-4">
                  {getRankBadge(idx)}
                  
                  <div className="relative">
                    {row.photoURL ? (
                      <img 
                        src={row.photoURL} 
                        alt={row.displayName} 
                        className={`w-10 h-10 object-cover ${idx === 0 ? 'border border-primary' : 'border border-on-surface/15'}`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-10 h-10 flex items-center justify-center font-bold text-sm bg-surface-charcoal text-on-surface-variant/50 ${idx === 0 ? 'border border-primary' : 'border border-on-surface/15'}`}>
                        {row.displayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {idx === 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary"></span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className={`text-sm font-esports font-black italic uppercase tracking-wider ${
                      idx === 0 ? 'text-primary digital-glow' : 'text-on-surface'
                    }`}>
                      {row.displayName}
                    </h4>
                    <p className="text-[9px] text-on-surface-variant/60 uppercase tracking-widest font-black">
                      {row.tomesConquered} {row.tomesConquered === 1 ? 'Tome' : 'Tomes'} Conquered
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className={`text-lg font-esports font-black italic tracking-tighter ${
                    idx === 0 ? 'text-primary digital-glow text-xl' : 'text-on-surface'
                  }`}>
                    {row.totalPagesRead.toLocaleString()}
                  </span>
                  <span className="text-[8px] text-on-surface-variant/50 uppercase tracking-[0.2em] font-bold">
                    Pages
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
