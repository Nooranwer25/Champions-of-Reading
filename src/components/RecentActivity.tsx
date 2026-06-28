import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { Submission, SubmissionStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Clock, CheckCircle, XCircle, ChevronRight, Sparkles, LogIn } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export const RecentActivity: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'submissions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: Submission[] = [];
      snapshot.forEach((doc) => {
        logs.push({ submissionId: doc.id, ...doc.data() } as Submission);
      });
      setSubmissions(logs);
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    try {
      if (typeof timestamp.toDate === 'function') {
        return format(timestamp.toDate(), 'MMM dd, yyyy h:mm a');
      }
      return format(new Date(timestamp), 'MMM dd, yyyy h:mm a');
    } catch (e) {
      return 'Recently';
    }
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case SubmissionStatus.APPROVED:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#a3e635]/10 border border-[#a3e635]/30 text-[9px] font-esports font-black italic uppercase tracking-wider text-[#a3e635]">
            <CheckCircle size={10} />
            Approved
          </span>
        );
      case SubmissionStatus.REJECTED:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-[9px] font-esports font-black italic uppercase tracking-wider text-red-400">
            <XCircle size={10} />
            Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/30 text-[9px] font-esports font-black italic uppercase tracking-wider text-yellow-400 animate-pulse">
            <Clock size={10} />
            Pending
          </span>
        );
    }
  };

  return (
    <div 
      id="recent-activity-container"
      className="w-full max-w-2xl mx-auto p-8 bg-black/60 backdrop-blur-md border border-primary/20 relative"
      style={{ clipPath: 'polygon(4% 0, 100% 0, 96% 100%, 0% 100%)' }}
    >
      {/* Dynamic corner designs */}
      <div className="absolute top-0 right-0 w-6 h-[2px] bg-primary/40" />
      <div className="absolute top-0 right-0 w-[2px] h-6 bg-primary/40" />
      <div className="absolute bottom-0 left-0 w-6 h-[2px] bg-primary/40" />
      <div className="absolute bottom-0 left-0 w-[2px] h-6 bg-primary/40" />

      <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] uppercase font-esports tracking-[0.3em] text-primary/60 font-black italic block mb-1">
            Culling History
          </span>
          <h3 className="text-2xl font-esports font-black italic uppercase tracking-tight text-on-surface">
            RECENT ACTIVITY
          </h3>
        </div>
        {user && submissions.length > 0 && (
          <Link 
            to="/profile" 
            className="flex items-center gap-1 text-[9px] font-esports font-black uppercase tracking-wider text-primary hover:text-white transition-colors"
          >
            VIEW ALL <ChevronRight size={12} />
          </Link>
        )}
      </div>

      {!user ? (
        <div className="py-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
            <LogIn size={20} />
          </div>
          <p className="text-sm font-bold uppercase text-white/50 tracking-wider">
            Access Cursed Records
          </p>
          <p className="text-[10px] text-white/40 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
            Enter the colony and bind your account to view your latest submission activity and records.
          </p>
        </div>
      ) : loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">
            Retrieving submission history...
          </span>
        </div>
      ) : submissions.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
            <BookOpen size={20} className="animate-pulse" />
          </div>
          <p className="text-sm font-bold uppercase text-white/50 tracking-wider">
            No Manifestations Recorded
          </p>
          <p className="text-[10px] text-white/40 uppercase tracking-widest max-w-xs mx-auto leading-relaxed mb-2">
            You have not recorded any cursed tomes this season. Log your reading progress to refine your technique!
          </p>
          <Link
            to="/submit"
            className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-[9px] uppercase font-black tracking-widest text-primary px-4 py-2 transition-all"
            style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
          >
            <Sparkles size={11} />
            REPORT FIRST SCORE
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {submissions.map((sub, idx) => (
              <motion.div
                key={sub.submissionId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border ${
                  sub.status === SubmissionStatus.APPROVED 
                    ? 'bg-[#a3e635]/5 border-[#a3e635]/15 hover:border-[#a3e635]/30' 
                    : sub.status === SubmissionStatus.REJECTED 
                    ? 'bg-red-500/[0.02] border-red-500/10 opacity-70 hover:opacity-100' 
                    : 'bg-primary/[0.02] border-primary/10 hover:border-primary/30'
                } transition-all`}
                style={{ clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0% 100%)' }}
              >
                <div className="flex items-start gap-4">
                  {/* Category icon / Book Cover representation */}
                  <div className="w-10 h-14 bg-black/40 border border-white/10 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                    {sub.coverImageUrl ? (
                      <img 
                        src={sub.coverImageUrl} 
                        alt={sub.bookTitle} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <BookOpen size={18} className="text-white/20" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-esports font-black italic uppercase tracking-wider text-on-surface line-clamp-1">
                      {sub.bookTitle}
                    </h4>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest font-black mb-1.5">
                      by {sub.author} • {sub.category}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[10px] text-primary font-mono font-bold uppercase tracking-wider">
                        📖 {sub.pagesRead || 0} {sub.pagesRead === 1 ? 'Page' : 'Pages'} Read
                      </span>
                      <span className="text-[10px] text-primary/60 font-mono font-bold uppercase tracking-wider">
                        ⚡ +{sub.pointsEarned || 0} pts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                  {getStatusBadge(sub.status)}
                  <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase font-black italic">
                    {formatTimestamp(sub.createdAt)}
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
