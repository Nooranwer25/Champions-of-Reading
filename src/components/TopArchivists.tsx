import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Submission, SubmissionStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../services/ThemeContext';
import { Crown, Trophy, Medal, BookOpen, Loader2, Sparkles, Database } from 'lucide-react';

interface ArchivistRow {
  userId: string;
  displayName: string;
  photoURL?: string;
  totalPagesRead: number;
  tomesConquered: number;
  grade?: string;
}

const DUMMY_ARCHIVISTS: ArchivistRow[] = [
  {
    userId: 'dummy-1',
    displayName: 'SATORU GOJO',
    photoURL: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80',
    totalPagesRead: 14250,
    tomesConquered: 45,
    grade: 'Special Grade'
  },
  {
    userId: 'dummy-2',
    displayName: 'YUTA OKKOTSU',
    photoURL: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80',
    totalPagesRead: 9840,
    tomesConquered: 31,
    grade: 'Special Grade'
  },
  {
    userId: 'dummy-3',
    displayName: 'KENTO NANAMI',
    photoURL: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=80',
    totalPagesRead: 8150,
    tomesConquered: 26,
    grade: 'Grade 1'
  },
  {
    userId: 'dummy-4',
    displayName: 'MAKI ZEN\'IN',
    photoURL: 'https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=150&auto=format&fit=crop&q=80',
    totalPagesRead: 6420,
    tomesConquered: 20,
    grade: 'Grade 2'
  },
  {
    userId: 'dummy-5',
    displayName: 'MEGUMI FUSHIGURO',
    photoURL: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80',
    totalPagesRead: 5210,
    tomesConquered: 17,
    grade: 'Grade 2'
  }
];

export const TopArchivists: React.FC = () => {
  const [liveArchivists, setLiveArchivists] = useState<ArchivistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'demo' | 'live'>('demo');

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
      setLiveArchivists(rows.slice(0, 5));
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
      setLoading(false);
    });

    unsubSubs = onSnapshot(subsQuery, (snapshot) => {
      const s: Submission[] = [];
      snapshot.forEach((doc) => {
        s.push(doc.data() as Submission);
      });
      submissionsList = s;
      processLeaderboard();
    }, (error) => {
      setLoading(false);
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

  const currentList = activeTab === 'demo' ? DUMMY_ARCHIVISTS : liveArchivists;

  return (
    <div 
      id="top-archivists-leaderboard"
      className="w-full max-w-2xl mx-auto p-8 bg-surface-charcoal/60 backdrop-blur-md border border-primary/30 relative text-white"
      style={{ clipPath: 'polygon(4% 0, 100% 0, 96% 100%, 0% 100%)' }}
    >
      {/* Decorative Gold Corner Lines */}
      <div className="absolute top-0 left-0 w-6 h-[2px] bg-primary shadow-[0_0_8px_#F8E71C]" />
      <div className="absolute top-0 left-0 w-[2px] h-6 bg-primary shadow-[0_0_8px_#F8E71C]" />
      <div className="absolute bottom-0 right-0 w-6 h-[2px] bg-primary shadow-[0_0_8px_#F8E71C]" />
      <div className="absolute bottom-0 right-0 w-[2px] h-6 bg-primary shadow-[0_0_8px_#F8E71C]" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-primary/20 pb-4">
        <div>
          <span className="text-[10px] uppercase font-esports tracking-[0.3em] text-primary font-black italic block mb-1">
            Archivist Records
          </span>
          <h3 className="text-2xl font-esports font-black italic uppercase tracking-tight text-on-surface">
            TOP ARCHIVISTS
          </h3>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-black/40 border border-white/5 p-1 rounded">
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer ${
              activeTab === 'demo'
                ? 'bg-primary text-black font-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Sparkles size={11} />
            Legendary Demo
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer ${
              activeTab === 'live'
                ? 'bg-primary text-black font-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Database size={11} />
            Live Colony
          </button>
        </div>
      </div>

      {loading && activeTab === 'live' ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-primary" size={24} />
          <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">
            Querying Archive Records...
          </span>
        </div>
      ) : currentList.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-on-surface-variant/60 font-bold uppercase text-[11px] tracking-wider mb-4">
            No live records registered in this culling season.
          </p>
          <button
            onClick={() => setActiveTab('demo')}
            className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary uppercase font-mono text-[10px] tracking-widest transition-all"
          >
            View Legendary Demo Registers
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {currentList.map((row, idx) => (
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
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-esports font-black italic uppercase tracking-wider ${
                        idx === 0 ? 'text-primary digital-glow' : 'text-on-surface'
                      }`}>
                        {row.displayName}
                      </h4>
                      {row.grade && (
                        <span className="text-[7px] font-mono bg-white/5 border border-white/10 px-1 py-0.5 rounded text-white/50 uppercase tracking-wider">
                          {row.grade}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-on-surface-variant/60 uppercase tracking-widest font-black mt-0.5">
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
