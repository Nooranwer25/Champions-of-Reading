import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../services/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { Submission, SubmissionStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Trophy, Flame, Clock, ShieldAlert, Sparkles, CheckCircle2, Award, Calendar } from 'lucide-react';
import { playPageFlip } from '../services/audioService';

export const DailyMissions: React.FC = () => {
  const { user, profile } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');

  // 1. Calculate time remaining until midnight local time
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Next midnight
      
      const diffMs = midnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setTimeRemaining(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch user submissions from the last 24 hours
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'submissions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const last24hSubmissions: Submission[] = [];
      const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Parse firestore timestamp
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

        if (createdTime >= cutoffTime) {
          last24hSubmissions.push({ submissionId: docSnap.id, ...data } as Submission);
        }
      });

      setSubmissions(last24hSubmissions);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching submissions for missions:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Define the 3 Daily Missions
  const missions = useMemo(() => {
    // Mission 1: Page Slasher (pagesRead)
    const totalPagesRead = submissions.reduce((sum, s) => sum + (Number(s.pagesRead) || 0), 0);
    const pageSlasherProgress = Math.min(totalPagesRead, 50);
    const pageSlasherCompleted = pageSlasherProgress >= 50;

    // Mission 2: Tome Finisher (at least 1 submission)
    const booksSubmitted = submissions.length;
    const tomeFinisherProgress = Math.min(booksSubmitted, 1);
    const tomeFinisherCompleted = tomeFinisherProgress >= 1;

    // Mission 3: Cursed Purge (pointsEarned)
    const totalPointsEarned = submissions.reduce((sum, s) => sum + (Number(s.pointsEarned) || 0), 0);
    const pointManifestProgress = Math.min(totalPointsEarned, 100);
    const pointManifestCompleted = pointManifestProgress >= 100;

    return [
      {
        id: 'mission_page_slasher',
        title: 'Domain Slasher',
        desc: 'Exorcise 50 pages of any tome in the last 24 hours.',
        target: 50,
        current: totalPagesRead,
        progressPercent: (pageSlasherProgress / 50) * 100,
        isCompleted: pageSlasherCompleted,
        rewardBadgeId: 'mission_page_slasher',
        rewardBadgeName: 'Domain Slasher',
        icon: <Zap className="text-red-400" size={24} />,
        colorClass: 'border-red-500/20 hover:border-red-500/40 bg-red-500/5',
        barColor: 'bg-red-500',
        glowColor: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]'
      },
      {
        id: 'mission_tome_finisher',
        title: 'Tome Exorcist',
        desc: 'Log and finalize at least 1 reading submission within 24 hours.',
        target: 1,
        current: booksSubmitted,
        progressPercent: (tomeFinisherProgress / 1) * 100,
        isCompleted: tomeFinisherCompleted,
        rewardBadgeId: 'mission_tome_finisher',
        rewardBadgeName: 'Tome Exorcist',
        icon: <Trophy className="text-yellow-400" size={24} />,
        colorClass: 'border-yellow-500/20 hover:border-yellow-500/40 bg-yellow-500/5',
        barColor: 'bg-yellow-500',
        glowColor: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]'
      },
      {
        id: 'mission_point_manifest',
        title: 'Apex Aura Focus',
        desc: 'Manifest at least 100 points of cursed energy through deep comprehension within 24 hours.',
        target: 100,
        current: totalPointsEarned,
        progressPercent: (pointManifestProgress / 100) * 100,
        isCompleted: pointManifestCompleted,
        rewardBadgeId: 'mission_point_manifest',
        rewardBadgeName: 'Apex Aura Focus',
        icon: <Flame className="text-orange-500" size={24} />,
        colorClass: 'border-orange-500/20 hover:border-orange-500/40 bg-orange-500/5',
        barColor: 'bg-orange-500',
        glowColor: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]'
      }
    ];
  }, [submissions]);

  // 4. Handle Claim Badge Action
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaimBadge = async (badgeId: string) => {
    if (!user || !profile) return;
    setClaimingId(badgeId);
    
    try {
      playPageFlip(); // Play satisfying organic slide effect
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        badges: arrayUnion(badgeId)
      });
    } catch (err) {
      console.error("Error claiming badge:", err);
    } finally {
      setClaimingId(null);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      id="daily-missions-section"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full bg-neutral-900/40 border border-primary/20 p-6 md:p-8 relative overflow-hidden text-white"
      style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
    >
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Reset Countdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute w-3 h-3 bg-primary rounded-full animate-ping opacity-75"></span>
              <Calendar className="text-primary relative z-10" size={20} />
            </div>
            <h3 className="text-xl font-esports italic uppercase tracking-tight">Today's Culling Trials</h3>
          </div>
          <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest mt-1">
            Harness focused cursed energy in a 24-hour cycle to extract exclusive seals of mastery
          </p>
        </div>

        {/* Real-time Countdown Timer */}
        <div className="flex items-center gap-2.5 bg-black/40 border border-white/5 px-4 py-2 rounded-lg self-start md:self-auto">
          <Clock className="text-secondary animate-pulse" size={14} />
          <div>
            <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest block">Cycle Reset In</span>
            <span className="text-sm font-mono font-black text-secondary tracking-wider block">
              {timeRemaining || '00:00:00'}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {missions.map((mission) => {
            const hasBadge = profile?.badges?.includes(mission.rewardBadgeId);

            return (
              <motion.div
                key={mission.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`relative border rounded-xl p-5 flex flex-col justify-between min-h-[220px] transition-all overflow-hidden group ${mission.colorClass} ${mission.glowColor}`}
              >
                {/* Background Sparkle for Unclaimed Complete Missions */}
                {mission.isCompleted && !hasBadge && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 animate-pulse pointer-events-none" />
                )}

                <div>
                  {/* Top Row: Mission Icon and Reward Icon Preview */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-black/40 rounded-lg border border-white/5 group-hover:scale-110 transition-transform duration-300">
                      {mission.icon}
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-1">REWARD</span>
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded bg-black/50 border border-white/10 ${hasBadge ? 'opacity-40' : ''}`}>
                        <Award size={11} className={hasBadge ? 'text-white/40' : 'text-primary animate-pulse'} />
                        <span className="text-[9px] font-mono font-black uppercase text-white truncate max-w-[100px]">
                          {mission.rewardBadgeName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mission Info */}
                  <h4 className="text-base font-esports italic uppercase tracking-tight text-white mb-1">
                    {mission.title}
                  </h4>
                  <p className="text-xs text-white/60 leading-relaxed pr-2">
                    {mission.desc}
                  </p>
                </div>

                {/* Bottom Row: Progress and Claim Button */}
                <div className="mt-6 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                    <span className="text-white/40 uppercase">Extraction Progress</span>
                    <span className="font-bold text-white">
                      {mission.current} <span className="text-white/30">/ {mission.target}</span>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden mb-4 border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${mission.progressPercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${mission.barColor}`}
                    />
                  </div>

                  {/* Action Button */}
                  <div className="w-full">
                    {hasBadge ? (
                      <div className="w-full py-2 bg-neutral-950/50 border border-white/10 rounded-lg flex items-center justify-center gap-1.5 opacity-60">
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        <span className="text-[10px] font-esports font-bold uppercase tracking-wider text-emerald-400">
                          Seal Claimed
                        </span>
                      </div>
                    ) : mission.isCompleted ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleClaimBadge(mission.rewardBadgeId)}
                        disabled={claimingId !== null}
                        className="w-full py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-white hover:to-white hover:text-black text-black font-esports font-black uppercase text-[10px] tracking-widest rounded-lg flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(250,204,21,0.25)] transition-all cursor-pointer"
                      >
                        <Sparkles size={12} className="animate-spin" />
                        {claimingId === mission.rewardBadgeId ? 'SEALING...' : 'CLAIM EXCLUSIVE SEAL'}
                      </motion.button>
                    ) : (
                      <div className="w-full py-2 bg-black/20 border border-white/5 rounded-lg flex items-center justify-center gap-1.5">
                        <ShieldAlert size={12} className="text-white/30" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                          Vow Incomplete
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
