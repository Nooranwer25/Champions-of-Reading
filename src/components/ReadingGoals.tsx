import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { db, handleFirestoreError } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Submission, SubmissionStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Target, CheckCircle, Edit3, Loader2, Minus, Plus, BookOpen } from 'lucide-react';

interface ReadingGoalsProps {
  submissions: Submission[];
}

export const ReadingGoals: React.FC<ReadingGoalsProps> = ({ submissions }) => {
  const { user, profile } = useAuth();
  const [goal, setGoal] = useState<number>(4);
  const [tempGoal, setTempGoal] = useState<number>(4);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (profile?.monthlyGoal) {
      setGoal(profile.monthlyGoal);
      setTempGoal(profile.monthlyGoal);
    }
  }, [profile?.monthlyGoal]);

  const now = new Date();
  const currentMonthName = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();

  const monthlySubmissions = submissions.filter((s) => {
    if (!s.createdAt) return false;
    const date = s.createdAt.seconds
      ? new Date(s.createdAt.seconds * 1000)
      : new Date(s.createdAt);
    return date.getMonth() === now.getMonth() && date.getFullYear() === currentYear;
  });

  const conqueredCount = monthlySubmissions.filter(
    (s) => s.status === SubmissionStatus.APPROVED
  ).length;

  const progressPercent = Math.min(100, Math.round((conqueredCount / goal) * 100));

  const handleSaveGoal = async () => {
    if (!user) return;
    if (tempGoal < 1 || tempGoal > 100) return;
    
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        monthlyGoal: tempGoal,
      });
      setGoal(tempGoal);
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, 'update', `/users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full bg-surface-charcoal border border-primary/20 p-8 mb-12 shadow-[0_0_30px_rgba(0,0,0,0.6)]" style={{ clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0% 100%)' }}>
      <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
        
        <div className="w-full md:w-1/2 space-y-4">
          <div className="flex items-center gap-3 mb-2 text-primary">
            <Target size={24} />
            <h3 className="text-3xl font-esports italic uppercase tracking-tighter digital-glow">Reading Goals</h3>
          </div>
          <p className="text-sm font-mono text-on-surface-variant/70 uppercase tracking-widest">
            {currentMonthName} {currentYear} Target
          </p>

          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div 
                key="view"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-end gap-4 pt-2"
              >
                <div className="text-5xl font-black font-esports text-on-surface italic">
                  {conqueredCount} <span className="text-3xl text-on-surface-variant/40">/ {goal}</span>
                </div>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="mb-2 p-2 rounded bg-black/40 border border-primary/20 text-primary hover:bg-primary/20 hover:border-primary transition-colors group"
                >
                  <Edit3 size={16} className="group-hover:scale-110 transition-transform" />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="edit"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-4 bg-black/50 border border-primary/30 p-2 pt-2"
              >
                <button 
                  onClick={() => setTempGoal(Math.max(1, tempGoal - 1))}
                  className="p-3 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Minus size={18} />
                </button>
                
                <div className="w-16 text-center text-2xl font-black font-esports text-on-surface">
                  {tempGoal}
                </div>
                
                <button 
                  onClick={() => setTempGoal(Math.min(100, tempGoal + 1))}
                  className="p-3 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Plus size={18} />
                </button>

                <div className="flex gap-2 ml-4">
                  <button 
                    onClick={() => { setIsEditing(false); setTempGoal(goal); }}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant/50 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveGoal}
                    disabled={saving || tempGoal === goal}
                    className="px-4 py-2 bg-primary text-black font-black uppercase text-xs tracking-widest hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Set Goal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full md:w-1/2 mt-4 md:mt-0">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs uppercase font-bold text-on-surface-variant/70 tracking-widest font-mono">
              Progress
            </span>
            <span className="text-2xl font-esports font-black italic text-primary">
              {progressPercent}%
            </span>
          </div>
          
          <div className="h-4 w-full bg-black/60 border border-primary/20 overflow-hidden relative" style={{ clipPath: 'polygon(1% 0, 100% 0, 99% 100%, 0% 100%)' }}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${progressPercent >= 100 ? 'bg-[#a3e635] shadow-[0_0_15px_#a3e635]' : 'bg-primary shadow-[0_0_15px_#F8E71C]'}`}
            />
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-on-surface-variant/50">
            <BookOpen size={14} />
            <span>Tomes Conquered This Month</span>
          </div>
        </div>

      </div>
    </div>
  );
};
