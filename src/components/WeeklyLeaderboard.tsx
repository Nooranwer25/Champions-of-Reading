import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Submission, SubmissionStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Trophy, Medal, BookOpen, Loader2, Calendar } from 'lucide-react';

interface WeeklyLeaderRow {
  userId: string;
  displayName: string;
  photoURL?: string;
  tomesConquered: number;
}

export const WeeklyLeaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<WeeklyLeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Determine the start of the current week (e.g., Monday 00:00:00)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

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
      const tomeCounts: Record<string, number> = {};

      submissionsList.forEach((sub) => {
        // Filter submissions to only those from this week
        if (sub.createdAt) {
          const createdAtDate = sub.createdAt.seconds 
            ? new Date(sub.createdAt.seconds * 1000) 
            : new Date(sub.createdAt);
            
          if (createdAtDate >= startOfWeek) {
            const uid = sub.userId;
            if (uid) {
              tomeCounts[uid] = (tomeCounts[uid] || 0) + 1;
            }
          }
        }
      });

      const rows: WeeklyLeaderRow[] = usersList.map((user) => ({
        userId: user.userId,
        displayName: user.displayName || 'Anonymous Sorcerer',
        photoURL: user.photoURL,
        tomesConquered: tomeCounts[user.userId] || 0,
      })).filter(row => row.tomesConquered > 0);

      rows.sort((a, b) => b.tomesConquered - a.tomesConquered);

      setLeaders(rows.slice(0, 10)); // Top 10 for the week
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
      if (unsubUsers) unsubUsers();
      if (unsubSubs) unsubSubs();
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
    <div className="w-full bg-surface-charcoal border border-primary/20 p-6 md:p-8 mb-12 shadow-[0_0_30px_rgba(0,0,0,0.6)]" style={{ clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0% 100%)' }}>
      <div className="absolute top-0 left-0 w-8 h-[2px] bg-primary" />
      <div className="absolute top-0 left-0 w-[2px] h-8 bg-primary" />
      <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-primary" />
      <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-primary" />

      <div className="flex items-center justify-between mb-8 border-b border-primary/20 pb-4">
        <div>
          <span className="text-[10px] uppercase font-esports tracking-[0.3em] text-primary font-black italic block mb-1 flex items-center gap-2">
            <Calendar size={12} />
            Current Week
          </span>
          <h3 className="text-2xl font-esports font-black italic uppercase tracking-tight text-on-surface">
            Weekly Top Readers
          </h3>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-primary" size={24} />
          <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">
            Fetching Weekly Records...
          </span>
        </div>
      ) : leaders.length === 0 ? (
        <div className="py-12 text-center text-on-surface-variant/60 font-bold uppercase text-[11px] tracking-wider">
          No records conquered this week yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {leaders.map((row, idx) => (
              <motion.div
                key={row.userId}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-4 flex items-center justify-between border transition-all ${
                  idx === 0 
                    ? 'bg-primary/5 border-primary/40' 
                    : 'bg-black/30 border-on-surface/5'
                }`}
                style={{ clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0% 100%)' }}
              >
                <div className="flex items-center gap-4">
                  {getRankBadge(idx)}
                  
                  <div className="flex items-center gap-3">
                    {row.photoURL ? (
                      <img 
                        src={row.photoURL} 
                        alt={row.displayName} 
                        className={`w-10 h-10 object-cover ${idx === 0 ? 'border border-primary' : 'border border-on-surface/15'}`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-10 h-10 flex items-center justify-center font-bold text-sm bg-black text-on-surface-variant/50 ${idx === 0 ? 'border border-primary' : 'border border-on-surface/15'}`}>
                        {row.displayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    
                    <h4 className={`text-sm font-esports font-black italic uppercase tracking-wider ${
                      idx === 0 ? 'text-primary digital-glow' : 'text-on-surface'
                    }`}>
                      {row.displayName}
                    </h4>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className={idx === 0 ? 'text-primary' : 'text-on-surface-variant/60'} />
                    <span className={`text-xl font-esports font-black italic tracking-tighter ${
                      idx === 0 ? 'text-primary' : 'text-on-surface'
                    }`}>
                      {row.tomesConquered}
                    </span>
                  </div>
                  <span className="text-[8px] text-on-surface-variant/50 uppercase tracking-[0.2em] font-bold">
                    Tomes This Week
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
