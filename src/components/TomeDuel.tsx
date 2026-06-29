import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { useToast } from '../services/ToastContext';
import { Duel, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Flame, Trophy, Clock, Plus, Users, ShieldAlert, CheckCircle, TrendingUp, User, Sparkles, Timer, Trash2, Zap, Hourglass, Award } from 'lucide-react';

export const TomeDuel: React.FC = () => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [duels, setDuels] = useState<Duel[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [milestone, setMilestone] = useState<number>(200);
  const [durationHours, setDurationHours] = useState<number>(24);
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>('open');
  const [submitting, setSubmitting] = useState(false);

  // Fetch all duels in real-time
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'duels'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Duel[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Duel);
      });
      setDuels(list);
      setLoading(false);
    }, (error) => {
      console.error("Error subscribing to duels:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch users for opponent selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const list: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          const u = doc.data() as UserProfile;
          if (u.userId !== user?.uid) {
            list.push(u);
          }
        });
        setUsers(list);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    if (user?.uid) {
      fetchUsers();
    }
  }, [user]);

  const handleCreateDuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSubmitting(true);
    try {
      let oppId = '';
      let oppName = 'Open Challenge';
      let oppPhoto = '';

      if (selectedOpponentId !== 'open') {
        const chosen = users.find(u => u.userId === selectedOpponentId);
        if (chosen) {
          oppId = chosen.userId;
          oppName = chosen.displayName;
          oppPhoto = chosen.photoURL || '';
        }
      }

      const newDuel = {
        creatorId: user.uid,
        creatorName: profile?.displayName || 'Anonymous Sorcerer',
        creatorPhoto: profile?.photoURL || user.photoURL || '',
        opponentId: oppId,
        opponentName: oppName,
        opponentPhoto: oppPhoto,
        status: 'pending' as const,
        milestone,
        durationHours,
        createdAt: new Date().toISOString(),
        creatorProgress: 0,
        opponentProgress: 0,
        winnerId: null
      };

      await addDoc(collection(db, 'duels'), newDuel);

      showToast({
        title: '⚔️ TOME DUEL FORGED',
        description: oppId ? `Challenge sent to ${oppName}!` : 'Open challenge posted in the Arena!',
        type: 'success'
      });

      setIsCreateOpen(false);
    } catch (err: any) {
      showToast({
        title: 'FORGE FAILED',
        description: err.message || 'Could not initiate duel.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptDuel = async (duel: Duel) => {
    if (!user?.uid) return;

    try {
      const now = new Date();
      const expires = new Date(now.getTime() + duel.durationHours * 60 * 60 * 1000);

      const updateData: Partial<Duel> = {
        opponentId: user.uid,
        opponentName: profile?.displayName || 'Anonymous Sorcerer',
        opponentPhoto: profile?.photoURL || user.photoURL || '',
        status: 'active',
        startedAt: now.toISOString(),
        expiresAt: expires.toISOString()
      };

      await updateDoc(doc(db, 'duels', duel.id), updateData);

      showToast({
        title: '🔥 DUEL ENGAGED',
        description: `You entered a Tome Duel against ${duel.creatorName}!`,
        type: 'success'
      });
    } catch (err: any) {
      showToast({
        title: 'JOIN FAILED',
        description: err.message,
        type: 'error'
      });
    }
  };

  const handleDeclineDuel = async (duel: Duel) => {
    try {
      await updateDoc(doc(db, 'duels', duel.id), {
        status: 'declined'
      });
      showToast({
        title: 'CHALLENGE REJECTED',
        description: 'You declined the challenge.',
        type: 'success'
      });
    } catch (err: any) {
      showToast({
        title: 'DECLINE FAILED',
        description: err.message,
        type: 'error'
      });
    }
  };

  const handleDeleteDuel = async (duelId: string) => {
    try {
      await deleteDoc(doc(db, 'duels', duelId));
      showToast({
        title: '⚔️ CHALLENGE REVOKED',
        description: 'Tome challenge removed.',
        type: 'success'
      });
    } catch (err: any) {
      showToast({
        title: 'REVOCATION FAILED',
        description: err.message,
        type: 'error'
      });
    }
  };

  const handleRecordPages = async (duel: Duel, pages: number) => {
    if (!user?.uid) return;

    try {
      const isCreator = duel.creatorId === user.uid;
      const currentCreatorProgress = duel.creatorProgress;
      const currentOpponentProgress = duel.opponentProgress;

      let newCreatorProgress = currentCreatorProgress;
      let newOpponentProgress = currentOpponentProgress;

      if (isCreator) {
        newCreatorProgress = Math.min(duel.milestone, currentCreatorProgress + pages);
      } else {
        newOpponentProgress = Math.min(duel.milestone, currentOpponentProgress + pages);
      }

      const updates: Partial<Duel> = {
        creatorProgress: newCreatorProgress,
        opponentProgress: newOpponentProgress
      };

      // Check if winner emerged
      if (newCreatorProgress >= duel.milestone) {
        updates.status = 'completed';
        updates.winnerId = duel.creatorId;
      } else if (newOpponentProgress >= duel.milestone) {
        updates.status = 'completed';
        updates.winnerId = duel.opponentId;
      }

      await updateDoc(doc(db, 'duels', duel.id), updates);

      showToast({
        title: '⚡ PAGES INSCRIBED',
        description: `Added ${pages} pages to your duel progress!`,
        type: 'success'
      });

      if (updates.status === 'completed') {
        const isWinner = updates.winnerId === user.uid;
        showToast({
          title: isWinner ? '👑 DOMAIN VICTORY!' : '💀 DOMAIN DEFEAT',
          description: isWinner ? 'You conquered the Tome Duel!' : 'Your opponent conquered the milestone.',
          type: isWinner ? 'success' : 'error'
        });
      }
    } catch (err: any) {
      showToast({
        title: 'TRANSCRIPTION FAILED',
        description: err.message,
        type: 'error'
      });
    }
  };

  const activeDuels = duels.filter(d => d.status === 'active');
  const pendingDuels = duels.filter(d => d.status === 'pending');
  const historyDuels = duels.filter(d => d.status === 'completed' || d.status === 'declined');

  return (
    <div className="space-y-12">
      {/* Overview stats and forge button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-black/40 border border-primary/15 p-6 md:p-8" style={{ clipPath: 'polygon(1% 0, 100% 0, 99% 100%, 0 100%)' }}>
        <div>
          <h3 className="text-2xl font-esports italic text-white uppercase tracking-wider flex items-center gap-2">
            <Swords className="text-primary animate-pulse" /> Tome Duel Pavilion
          </h3>
          <p className="text-xs text-neutral-400 font-mono mt-1 italic max-w-xl">
            Settle your cognitive differences here. Initiate real-time transcript races, reach book milestones, and secure ultimate domain expansion bragging rights.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-6 py-3 bg-gradient-to-r from-primary to-amber-500 text-black font-esports font-black text-xs uppercase tracking-widest italic hover:shadow-[0_0_25px_rgba(250,204,21,0.4)] transition-all flex items-center gap-2 self-stretch sm:self-auto justify-center cursor-pointer"
          style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
        >
          <Plus size={14} /> Forge Tome Duel
        </button>
      </div>

      {/* Grid of battles */}
      <div className="space-y-12">
        {/* Active Duels */}
        <div>
          <h4 className="text-lg font-esports text-primary tracking-widest uppercase mb-6 flex items-center gap-2 italic">
            <Flame size={18} className="text-[#ea580c]" /> Active Confrontations ({activeDuels.length})
          </h4>
          {activeDuels.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {activeDuels.map((duel) => (
                <ActiveDuelCard 
                  key={duel.id} 
                  duel={duel} 
                  currentUserId={user?.uid || ''} 
                  onRecordPages={handleRecordPages} 
                  onDecline={handleDeclineDuel}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 border border-dashed border-white/5 bg-black/20 text-center font-mono text-xs text-neutral-500 italic">
              No active tome duels are currently raging. Initiate a challenge above!
            </div>
          )}
        </div>

        {/* Pending Invitations / Open Challenges */}
        <div>
          <h4 className="text-lg font-esports text-secondary tracking-widest uppercase mb-6 flex items-center gap-2 italic">
            <Hourglass size={18} className="text-secondary" /> Pending Declarations & Open Challenges ({pendingDuels.length})
          </h4>
          {pendingDuels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingDuels.map((duel) => (
                <PendingDuelCard 
                  key={duel.id} 
                  duel={duel} 
                  currentUserId={user?.uid || ''} 
                  onAccept={handleAcceptDuel}
                  onDecline={handleDeclineDuel}
                  onDelete={handleDeleteDuel}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 border border-dashed border-white/5 bg-black/20 text-center font-mono text-xs text-neutral-500 italic">
              No open challenges or pending invitations at the moment.
            </div>
          )}
        </div>

        {/* past duels */}
        <div>
          <h4 className="text-lg font-esports text-neutral-400 tracking-widest uppercase mb-6 flex items-center gap-2 italic">
            <Award size={18} className="text-neutral-500" /> Historic Adjudications ({historyDuels.length})
          </h4>
          {historyDuels.length > 0 ? (
            <div className="bg-black/40 border border-white/5 divide-y divide-white/5 font-mono text-xs">
              {historyDuels.slice(0, 10).map((duel) => {
                const isCreator = duel.creatorId === user?.uid;
                const isOpponent = duel.opponentId === user?.uid;
                const isParticipant = isCreator || isOpponent;
                const won = duel.winnerId === user?.uid;
                const wasDraw = duel.winnerId === 'draw' || (!duel.winnerId && duel.status === 'completed');

                let statusText = "FINISHED";
                let colorClass = "text-neutral-400";

                if (duel.status === 'declined') {
                  statusText = "DECLINED";
                  colorClass = "text-red-500/50";
                } else if (isParticipant) {
                  if (wasDraw) {
                    statusText = "DRAW";
                    colorClass = "text-amber-500";
                  } else if (won) {
                    statusText = "VICTORY";
                    colorClass = "text-emerald-500 font-bold";
                  } else {
                    statusText = "DEFEAT";
                    colorClass = "text-red-500";
                  }
                } else {
                  statusText = duel.winnerId === duel.creatorId ? `${duel.creatorName} WON` : `${duel.opponentName} WON`;
                }

                return (
                  <div key={duel.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <Swords size={14} className="text-neutral-500" />
                      <div>
                        <span className="font-bold text-white">{duel.creatorName}</span>
                        <span className="text-neutral-500 mx-2">vs</span>
                        <span className="font-bold text-white">{duel.opponentName || 'Open Challenge'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-neutral-500">
                        Milestone: <span className="text-neutral-300 font-bold">{duel.milestone}p</span>
                      </div>
                      <div className="text-neutral-500">
                        Score: <span className="text-neutral-300 font-bold">{duel.creatorProgress} - {duel.opponentProgress}</span>
                      </div>
                      <div className={`text-[10px] tracking-wider uppercase font-black ${colorClass}`}>
                        {statusText}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 border border-dashed border-white/5 bg-black/20 text-center font-mono text-xs text-neutral-500 italic">
              No previous duels have been filed in the archives.
            </div>
          )}
        </div>
      </div>

      {/* Create Duel Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-950 border border-primary/25 max-w-md w-full p-8 space-y-6"
              style={{ clipPath: 'polygon(5% 0, 100% 0, 100% 95%, 95% 100%, 0 100%, 0 5%)' }}
            >
              <div className="flex justify-between items-center border-b border-primary/10 pb-4">
                <h3 className="text-xl font-esports italic text-primary uppercase tracking-wider flex items-center gap-2">
                  <Swords size={18} /> Forge Tome Duel
                </h3>
                <button 
                  onClick={() => setIsCreateOpen(false)}
                  className="text-neutral-400 hover:text-white font-mono text-sm cursor-pointer"
                >
                  [CLOSE]
                </button>
              </div>

              <form onSubmit={handleCreateDuel} className="space-y-6">
                {/* Milestone Option */}
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-400">Page Milestone</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 250, 500, 1000].map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setMilestone(m)}
                        className={`py-2 text-xs font-mono border transition-all ${milestone === m ? 'border-primary bg-primary/20 text-primary font-bold' : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                      >
                        {m}p
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Option */}
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-400">Duration Limit</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 12, 24, 72].map((h) => (
                      <button
                        type="button"
                        key={h}
                        onClick={() => setDurationHours(h)}
                        className={`py-2 text-xs font-mono border transition-all ${durationHours === h ? 'border-primary bg-primary/20 text-primary font-bold' : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                      >
                        {h} {h === 1 ? 'Hour' : 'Hrs'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select Opponent */}
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-mono tracking-widest text-neutral-400">Select Opponent</label>
                  <select
                    value={selectedOpponentId}
                    onChange={(e) => setSelectedOpponentId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 px-4 py-3 text-white text-xs font-mono outline-none focus:border-primary"
                  >
                    <option value="open">🔓 Open Challenge (Anyone can join)</option>
                    {users.map((u) => (
                      <option key={u.userId} value={u.userId}>
                        👤 {u.displayName} (Tomes: {u.tomesConquered})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-primary/10 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 border border-neutral-800 text-neutral-400 font-mono text-xs hover:border-neutral-700 uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-primary text-black font-esports font-black text-xs uppercase tracking-widest italic hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    {submitting ? 'Forging...' : 'Initiate Match'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ====================
// ACTIVE DUEL CARD
// ====================
interface ActiveDuelCardProps {
  duel: Duel;
  currentUserId: string;
  onRecordPages: (duel: Duel, pages: number) => void;
  onDecline: (duel: Duel) => void;
}

const ActiveDuelCard: React.FC<ActiveDuelCardProps> = ({ duel, currentUserId, onRecordPages, onDecline }) => {
  const [timeLeftStr, setTimeLeftStr] = useState<string>('Calculated...');
  const [incAmount, setIncAmount] = useState<string>('');

  const isCreator = duel.creatorId === currentUserId;
  const isOpponent = duel.opponentId === currentUserId;
  const isParticipant = isCreator || isOpponent;

  // Real-time local countdown
  useEffect(() => {
    if (!duel.expiresAt) return;

    const timer = setInterval(() => {
      const expiry = new Date(duel.expiresAt).getTime();
      const now = new Date().getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeftStr('EXPIRED');
        clearInterval(timer);
        // Automatically close/complete the duel if expired
        // This runs only on the client of the active participant to avoid race updates
        if (isParticipant && duel.status === 'active') {
          handleExpiryAutoResolve();
        }
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        let displayStr = '';
        if (hours > 0) displayStr += `${hours}h `;
        displayStr += `${minutes}m ${seconds}s`;
        setTimeLeftStr(displayStr);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [duel]);

  const handleExpiryAutoResolve = async () => {
    try {
      const updates: Partial<Duel> = {
        status: 'completed',
        winnerId: duel.creatorProgress === duel.opponentProgress 
          ? 'draw' 
          : duel.creatorProgress > duel.opponentProgress 
            ? duel.creatorId 
            : duel.opponentId
      };
      await updateDoc(doc(db, 'duels', duel.id), updates);
    } catch (err) {
      console.error("Auto resolve failed:", err);
    }
  };

  const creatorPercent = Math.min(100, (duel.creatorProgress / duel.milestone) * 100);
  const opponentPercent = Math.min(100, (duel.opponentProgress / duel.milestone) * 100);

  const handleManualInscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(incAmount);
    if (isNaN(amount) || amount <= 0) return;
    onRecordPages(duel, amount);
    setIncAmount('');
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 p-6 space-y-6 relative group" style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}>
      {/* Background ambient lighting based on leading competitor */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 to-secondary/5 blur-xl opacity-50 pointer-events-none group-hover:opacity-80 transition-opacity" />

      {/* Header Info */}
      <div className="flex justify-between items-center relative z-10 font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
        <div className="flex items-center gap-1.5 text-primary">
          <Zap size={12} /> Target: <span className="font-bold text-white">{duel.milestone} Pages</span>
        </div>
        <div className="flex items-center gap-1.5 text-secondary">
          <Clock size={12} /> <span className="font-bold text-white">{timeLeftStr}</span>
        </div>
      </div>

      {/* Dynamic Versus Duel Arena Graphic */}
      <div className="grid grid-cols-11 items-center relative z-10 gap-2">
        {/* Creator (Left side) */}
        <div className="col-span-5 flex flex-col items-center text-center space-y-2">
          <div className="relative">
            <img 
              src={duel.creatorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${duel.creatorId}`} 
              alt={duel.creatorName} 
              className={`w-14 h-14 border object-cover ${creatorPercent >= opponentPercent ? 'border-primary shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'border-neutral-800'}`}
            />
            {creatorPercent >= 100 && (
              <div className="absolute -top-1 -right-1 bg-primary text-black rounded-full p-0.5">
                <Trophy size={10} />
              </div>
            )}
          </div>
          <div>
            <div className="text-white font-serif italic text-sm truncate max-w-[120px] font-black uppercase">
              {duel.creatorName}
            </div>
            <div className="text-[10px] text-primary font-mono font-bold mt-0.5">
              {duel.creatorProgress} / {duel.milestone} Pages ({creatorPercent.toFixed(0)}%)
            </div>
          </div>
        </div>

        {/* VS Divider */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <span className="text-xs font-esports font-black text-[#ea580c] bg-neutral-900 border border-neutral-800 px-2 py-1.5 rotate-12 digital-glow select-none">
            VS
          </span>
        </div>

        {/* Opponent (Right side) */}
        <div className="col-span-5 flex flex-col items-center text-center space-y-2">
          <div className="relative">
            <img 
              src={duel.opponentPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${duel.opponentId}`} 
              alt={duel.opponentName} 
              className={`w-14 h-14 border object-cover ${opponentPercent >= creatorPercent ? 'border-secondary shadow-[0_0_15px_rgba(163,230,53,0.3)]' : 'border-neutral-800'}`}
            />
            {opponentPercent >= 100 && (
              <div className="absolute -top-1 -right-1 bg-secondary text-black rounded-full p-0.5">
                <Trophy size={10} />
              </div>
            )}
          </div>
          <div>
            <div className="text-white font-serif italic text-sm truncate max-w-[120px] font-black uppercase">
              {duel.opponentName}
            </div>
            <div className="text-[10px] text-secondary font-mono font-bold mt-0.5">
              {duel.opponentProgress} / {duel.milestone} Pages ({opponentPercent.toFixed(0)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Combined / Fighting Game Style Live Progress Bar */}
      <div className="relative z-10 space-y-2">
        <div className="h-4 bg-neutral-900 border border-neutral-800 relative overflow-hidden flex">
          {/* Creator progress (fills from left) */}
          <div 
            style={{ width: `${creatorPercent}%` }} 
            className="h-full bg-gradient-to-r from-[#eab308] to-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all duration-500 relative"
          >
            {creatorPercent > 0 && (
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse" />
            )}
          </div>
          
          {/* Gap / Middle bar divider if needed */}
          <div className="w-1 bg-black z-20 flex-shrink-0" />

          {/* Opponent progress (fills from right but represented as remaining area or direct fill for comparison, let's represent them symmetrically or as back-to-back fill) */}
          {/* Symmetrical split view is super professional: let's render a custom dual gauge */}
          <div 
            style={{ width: `${opponentPercent}%` }} 
            className="h-full bg-gradient-to-r from-[#a3e635] to-[#84cc16] shadow-[0_0_15px_rgba(132,204,22,0.5)] transition-all duration-500 relative"
          >
            {opponentPercent > 0 && (
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse" />
            )}
          </div>
        </div>
        <div className="flex justify-between text-[9px] font-mono text-neutral-500 uppercase">
          <span>{creatorPercent.toFixed(0)}% Complete</span>
          <span>{opponentPercent.toFixed(0)}% Complete</span>
        </div>
      </div>

      {/* Participant Controls */}
      {isParticipant && (
        <div className="relative z-10 bg-neutral-900 border border-neutral-800/60 p-4 space-y-4">
          <span className="text-[9px] uppercase tracking-widest font-mono text-primary font-bold flex items-center gap-1">
            <Sparkles size={10} /> Active Inscribe Controls
          </span>

          <div className="flex gap-2">
            {[10, 25, 50].map((pages) => (
              <button
                key={pages}
                onClick={() => onRecordPages(duel, pages)}
                className="flex-1 py-1.5 border border-primary/20 bg-primary/5 hover:bg-primary hover:text-black text-primary font-mono text-xs transition-all cursor-pointer"
              >
                +{pages}p
              </button>
            ))}
          </div>

          <form onSubmit={handleManualInscribe} className="flex gap-2">
            <input 
              type="number" 
              placeholder="Inscribe custom page count..." 
              value={incAmount}
              onChange={(e) => setIncAmount(e.target.value)}
              className="flex-grow bg-neutral-950 border border-neutral-800 px-3 py-1.5 text-white font-mono text-xs outline-none focus:border-primary placeholder:text-neutral-600"
            />
            <button 
              type="submit"
              className="px-4 py-1.5 bg-primary text-black font-mono text-xs font-bold uppercase transition-all hover:bg-primary/90 cursor-pointer"
            >
              Inscribe
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// ====================
// PENDING DUEL CARD
// ====================
interface PendingDuelCardProps {
  duel: Duel;
  currentUserId: string;
  onAccept: (duel: Duel) => void;
  onDecline: (duel: Duel) => void;
  onDelete: (duelId: string) => void;
}

const PendingDuelCard: React.FC<PendingDuelCardProps> = ({ duel, currentUserId, onAccept, onDecline, onDelete }) => {
  const isCreator = duel.creatorId === currentUserId;
  const isTargeted = duel.opponentId === currentUserId;
  const isOpenChallenge = duel.opponentId === '';

  return (
    <div className="bg-neutral-950 border border-neutral-800 p-6 flex flex-col justify-between relative group" style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}>
      <div className="space-y-4">
        {/* Challenge Banner Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Swords className="text-[#ea580c] animate-bounce" size={16} />
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#ea580c] font-bold">
              {isOpenChallenge ? '🔓 Open Duel' : '👤 Targeted Match'}
            </span>
          </div>
          {isCreator && (
            <button 
              onClick={() => onDelete(duel.id)}
              className="text-neutral-600 hover:text-red-500 transition-colors p-1"
              title="Revoke Challenge"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Challenger Avatar & Info */}
        <div className="flex items-center gap-4 py-2 border-y border-white/5">
          <img 
            src={duel.creatorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${duel.creatorId}`} 
            alt={duel.creatorName} 
            className="w-10 h-10 border border-neutral-800 object-cover rounded-none"
          />
          <div>
            <span className="text-[9px] uppercase tracking-widest font-mono text-neutral-500 block">Initiated By</span>
            <span className="text-white font-serif italic font-black uppercase text-sm block">
              {duel.creatorName}
            </span>
          </div>
        </div>

        {/* Milestone Specs */}
        <div className="grid grid-cols-2 gap-4 font-mono text-xs text-neutral-400 py-2">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-neutral-600 block">Race Target</span>
            <span className="text-white font-bold">{duel.milestone} Pages</span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-neutral-600 block">Time Frame</span>
            <span className="text-white font-bold">{duel.durationHours} Hours</span>
          </div>
        </div>

        {/* Targeted Opponent Flag */}
        {!isOpenChallenge && (
          <div className="bg-black/30 border border-white/5 p-2 rounded text-[10px] font-mono text-neutral-400 text-center uppercase">
            {isTargeted ? (
              <span className="text-primary font-bold">🎯 Targeted at you!</span>
            ) : (
              <span>Target opponent: {duel.opponentName}</span>
            )}
          </div>
        )}
      </div>

      {/* Accept or Status Actions */}
      <div className="pt-6 mt-6 border-t border-white/5">
        {isCreator ? (
          <div className="text-center py-2 bg-neutral-900 border border-neutral-800 text-neutral-500 font-mono text-xs uppercase tracking-wider">
            Awaiting Challenger...
          </div>
        ) : (isTargeted || isOpenChallenge) ? (
          <div className="flex gap-2">
            <button
              onClick={() => onAccept(duel)}
              className="flex-1 py-2 bg-[#ea580c] hover:bg-[#ea580c]/90 text-black font-esports font-black text-[10px] uppercase tracking-widest italic transition-all cursor-pointer"
            >
              Accept Challenge
            </button>
            {isTargeted && (
              <button
                onClick={() => onDecline(duel)}
                className="px-3 py-2 border border-red-900/30 text-red-500 font-mono text-xs hover:bg-red-950/20 transition-all cursor-pointer"
              >
                Decline
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-2 bg-neutral-900 border border-neutral-800 text-neutral-600 font-mono text-xs uppercase tracking-wider">
            Awaiting Acceptance
          </div>
        )}
      </div>
    </div>
  );
};
