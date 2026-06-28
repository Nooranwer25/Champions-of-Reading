import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../services/AuthContext';
import { db, handleFirestoreError } from '../services/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, increment, arrayUnion, getDoc, writeBatch, setDoc, serverTimestamp } from 'firebase/firestore';
import { Submission, SubmissionStatus, UserRole, LeagueRules } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Eye, AlertCircle, TrendingUp, Info, Book, Scroll, Settings as SettingsIcon, Save, Loader2, Play, Zap, Shield, Target, Bold, Italic, List } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism-tomorrow.css';
import Kogane from '../components/Kogane';
import { checkAndAwardBadges } from '../services/badgeService';
import { useToast } from '../services/ToastContext';
import { useNavigate } from 'react-router-dom';

const Oracle: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'submissions' | 'rules'>('submissions');
  const [showPreview, setShowPreview] = useState(false);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjudicating, setAdjudicating] = useState<string | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState<Record<string, string>>({});
  
  // Rules State
  const [rules, setRules] = useState<string>('');
  const [originalRules, setOriginalRules] = useState<string>('');
  const [savingRules, setSavingRules] = useState(false);
  const [showConfirmRules, setShowConfirmRules] = useState(false);
  const [changeSummary, setChangeSummary] = useState({ added: 0, removed: 0 });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showAuditTabs, setShowAuditTabs] = useState<'editor' | 'history'>('editor');
  const editorRef = useRef<HTMLDivElement>(null);

  const applyFormat = (type: 'bold' | 'italic' | 'list') => {
    const textarea = editorRef.current?.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = rules.substring(start, end);
    
    let prefix = '';
    let suffix = '';
    let replacement = selection;

    switch (type) {
      case 'bold':
        prefix = suffix = '**';
        break;
      case 'italic':
        prefix = suffix = '*';
        break;
      case 'list':
        prefix = '- ';
        break;
    }

    const newRules = rules.substring(0, start) + prefix + selection + suffix + rules.substring(end);
    setRules(newRules);

    // Re-focus and restore selection
    setTimeout(() => {
      textarea.focus();
      if (selection.length > 0) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }
    }, 0);
  };

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'submissions'),
      where('status', '==', SubmissionStatus.PENDING),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeSubmissions = onSnapshot(q, (snapshot) => {
      const logs: Submission[] = [];
      snapshot.forEach((doc) => {
        logs.push({ submissionId: doc.id, ...doc.data() } as Submission);
      });
      setPendingSubmissions(logs);
      setLoading(false);
    });

    // Listen to Rules
    const unsubscribeRules = onSnapshot(doc(db, 'config', 'league_rules'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as LeagueRules;
        setRules(data.content);
        setOriginalRules(data.content);
      }
    });

    // Listen to Audit Log
    setLoadingLogs(true);
    const qLogs = query(
      collection(db, 'rules_audit'),
      orderBy('timestamp', 'desc'),
      where('configPath', '==', 'league_rules')
    );

    const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      const logs: any[] = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      setAuditLogs(logs);
      setLoadingLogs(false);
    });

    return () => {
      unsubscribeSubmissions();
      unsubscribeRules();
      unsubscribeLogs();
    };
  }, [isAdmin]);

  const getDiff = () => {
    const oldLines = originalRules.split('\n');
    const newLines = rules.split('\n');
    const added = newLines.filter(line => !oldLines.includes(line) && line.trim() !== '');
    const removed = oldLines.filter(line => !newLines.includes(line) && line.trim() !== '');
    return { added, removed };
  };

  const handleUpdateRules = async () => {
    if (!user) return;
    setSavingRules(true);
    try {
      const timestamp = serverTimestamp();
      const managerName = user.displayName || user.email || 'Unknown Manager';
      
      const { added, removed } = getDiff();
      
      const batch = writeBatch(db);
      
      const rulesRef = doc(db, 'config', 'league_rules');
      batch.set(rulesRef, {
        content: rules,
        lastUpdated: timestamp,
        updatedBy: managerName
      }, { merge: true });

      const logRef = doc(collection(db, 'rules_audit'));
      batch.set(logRef, {
        timestamp,
        archivistName: managerName,
        archivistId: user.uid,
        contentBefore: originalRules,
        contentAfter: rules,
        diff: { added, removed },
        configPath: 'league_rules'
      });

      await batch.commit();
      setOriginalRules(rules);
      setShowAuditTabs('history');
    } catch (error) {
      handleFirestoreError(error, 'write', '/config/league_rules');
    } finally {
      setSavingRules(false);
    }
  };

  const handleReview = async (submission: Submission, action: 'approve' | 'reject') => {
    setAdjudicating(submission.submissionId);
    try {
      const impact = action === 'approve' ? Math.floor(Math.random() * 6) + 5 : 0; // 5-10 for approval
      const points = action === 'approve' ? (submission.rating * 15) + (impact * 10) + 50 : 0;
      const note = submissionNotes[submission.submissionId] || (action === 'approve' ? 'Refined technique manifests perfectly.' : 'Technique insufficient. Cursed energy dissipated.');
      
      const batch = writeBatch(db);
      const submissionRef = doc(db, 'submissions', submission.submissionId);
      
      batch.update(submissionRef, {
        status: action === 'approve' ? SubmissionStatus.APPROVED : SubmissionStatus.REJECTED,
        pointsEarned: points,
        impactScore: impact,
        judgeNotes: note
      });

      if (action === 'approve') {
        const userRef = doc(db, 'users', submission.userId);
        batch.update(userRef, {
          totalPoints: increment(points),
          tomesConquered: increment(1)
        });
        
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        if (userData?.tomesConquered === 0 || !userData?.titles?.includes('Colony Participant')) {
          batch.update(userRef, {
            titles: arrayUnion('Colony Participant')
          });
        }
      }

      await batch.commit();
      
      showToast({
        title: action === 'approve' ? 'Vow Manifested' : 'Technique Dissipated',
        description: action === 'approve'
          ? `Approved "${submission.bookTitle}" for ${points} cursed energy.`
          : `Rejected "${submission.bookTitle}" due to insufficient depth.`,
        type: action === 'approve' ? 'success' : 'error'
      });
      
      // Check badges for the submitter
      await checkAndAwardBadges(submission.userId, { impactScore: impact });
      // Check badges for the reviewer (manager)
      if (user) {
        await checkAndAwardBadges(user.uid);
      }
    } catch (error) {
      handleFirestoreError(error, 'update', `/submissions/${submission.submissionId}`);
    } finally {
      setAdjudicating(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-surface text-on-surface">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-xs font-mono uppercase tracking-widest text-primary">Deciphering Barrier Status...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-surface px-6 text-center">
        <div className="max-w-md p-8 border border-rose-500/20 bg-rose-500/5 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.1)] flex flex-col items-center">
          <Shield className="text-rose-500 mb-6 animate-pulse" size={48} />
          <h2 className="text-2xl font-esports font-bold uppercase tracking-wider text-rose-500 mb-2">Barrier Rejected</h2>
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-6">Unauthorized Sorcerer Detected</p>
          <p className="text-sm text-neutral-300 leading-relaxed mb-8">
            This domain is sealed and can only be accessed by appointed Archive Administrators (Archivists). Your cursed signature does not match the approved list.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-mono uppercase tracking-widest transition-all cursor-pointer"
          >
            Return to Arena
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12 domain-expansion-bg">
      <div className="max-w-6xl mx-auto">
        <header className="mb-20 border-b border-primary/20 pb-12 flex flex-col md:flex-row md:items-center justify-between gap-12 relative">
          <div className="absolute -top-12 -left-12">
            <Kogane size={100} speech="REPORTING STATUS!" />
          </div>
          <div>
            <motion.h2 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-7xl font-esports italic text-white mb-8 tracking-tighter uppercase digital-glow"
            >
              Observation <span className="text-primary italic">Colony</span>
            </motion.h2>
            
            <nav className="flex gap-12">
              <button 
                onClick={() => setActiveTab('submissions')}
                className={`flex items-center gap-3 pb-6 border-b-4 transition-all uppercase font-esports font-black italic tracking-widest ${activeTab === 'submissions' ? 'border-primary text-primary' : 'border-transparent text-white/20 hover:text-white/40'}`}
              >
                <Scroll size={20} />
                <span className="text-[12px]">Manifestations</span>
                {pendingSubmissions.length > 0 && (
                  <span className="bg-primary text-black text-[10px] px-2 py-0.5 font-bold shadow-[0_0_10px_rgba(248,231,28,0.5)]">{pendingSubmissions.length}</span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('rules')}
                className={`flex items-center gap-3 pb-6 border-b-4 transition-all uppercase font-esports font-black italic tracking-widest ${activeTab === 'rules' ? 'border-primary text-primary' : 'border-transparent text-white/20 hover:text-white/40'}`}
              >
                <SettingsIcon size={20} />
                <span className="text-[12px]">Statutes</span>
              </button>
            </nav>
          </div>
          <div className="bg-primary text-black px-8 py-5 border-l-4 border-white shadow-[0_0_30px_rgba(248,231,28,0.2)]" style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}>
            <span className="text-[12px] uppercase font-esports font-black tracking-widest italic">Barrier Integrity: 99.9%</span>
          </div>
        </header>

        <div className="grid gap-12">
          <AnimatePresence mode="wait">
            {activeTab === 'submissions' ? (
              <motion.div
                key="submissions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid gap-12"
              >
                {loading ? (
                  <div className="py-24 text-center text-primary/20 italic font-black font-esports text-3xl uppercase tracking-widest animate-pulse">Synchronizing barriers...</div>
                ) : pendingSubmissions.length > 0 ? (
                  pendingSubmissions.map((submission, i) => (
                    <motion.div 
                      layout
                      key={submission.submissionId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="bg-black/60 border border-primary/20 p-12 relative overflow-hidden group"
                      style={{ clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0% 100%)' }}
                    >
                      <div className="absolute top-0 right-0 w-3 h-full bg-primary digital-glow opacity-40" />
                      
                      <div className="flex flex-col lg:flex-row gap-16">
                        <div className="flex-shrink-0 w-56 h-72 bg-black border border-primary/10 rounded-none overflow-hidden self-center lg:self-start shadow-2xl cursed-energy-aura">
                          {submission.coverImageUrl ? (
                            <img 
                              src={submission.coverImageUrl} 
                              alt={submission.bookTitle} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary/5">
                              <Book size={64} />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow space-y-12">

                          <div>
                            <div className="text-[12px] uppercase font-esports tracking-[0.4em] text-primary mb-4 font-black italic">Manifestation from Sorcerer {submission.userName}</div>
                            <h3 className="text-6xl font-esports italic text-white leading-tight mb-4 uppercase digital-glow">
                              {submission.bookTitle}
                            </h3>
                            <span className="text-xl font-sans text-primary/40 italic uppercase tracking-widest font-bold">Technique Author: {submission.author}</span>
                          </div>

                          <div className="grid md:grid-cols-2 gap-12 border-t border-primary/10 pt-10">
                            <div className="space-y-6">
                              <label className="text-[10px] uppercase font-black tracking-[0.3em] text-primary/30 block italic">Core Synopsis</label>
                              <p className="text-lg font-bold leading-relaxed text-white/60 italic border-l-2 border-primary/20 pl-6">
                                {submission.synopsis}
                              </p>
                            </div>
                            <div className="space-y-6">
                              <label className="text-[10px] uppercase font-black tracking-[0.3em] text-primary/30 block italic">Sorcerer's Reasoning</label>
                              <div className="p-8 bg-primary/5 border border-primary/10">
                                <p className="text-lg font-bold leading-relaxed text-white/80 italic">
                                   "{submission.assessment}"
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="lg:w-[400px] flex flex-col justify-between border-l border-primary/10 pl-12 bg-black/20 p-8 shadow-inner">
                           <div className="space-y-12">
                             <div>
                               <label className="text-[10px] uppercase font-black tracking-[0.3em] text-primary/30 mb-6 block italic">User Refinement</label>
                               <div className="flex gap-4">
                                 {[1, 2, 3, 4, 5].map((star) => (
                                   <div key={star} className={`w-3.5 h-3.5 rounded-none rotate-45 ${star <= submission.rating ? 'bg-primary shadow-[0_0_10px_#F8E71C]' : 'bg-primary/5'}`} />
                                 ))}
                               </div>
                             </div>

                             <div>
                               <label className="text-[10px] uppercase font-black tracking-[0.3em] text-primary/30 mb-6 block italic">Grade Tier</label>
                               <span className="px-6 py-3 bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-[0.3em] font-black text-primary italic">
                                 {submission.category}
                               </span>
                             </div>

                             <div>
                               <label className="text-[10px] uppercase font-black tracking-[0.3em] text-primary/30 mb-6 block italic">Kogane's Verdict (Admin Override)</label>
                               <div className="space-y-4">
                                 <textarea 
                                   value={submissionNotes[submission.submissionId] || ''}
                                   onChange={(e) => setSubmissionNotes(prev => ({ ...prev, [submission.submissionId]: e.target.value }))}
                                   placeholder="Inscribe the final verdict..."
                                   className="w-full bg-black/40 border border-primary/20 p-6 text-sm text-white/80 outline-none focus:border-primary transition-all resize-none h-40 font-bold italic"
                                 />
                               </div>
                             </div>
                           </div>

                           <div className="pt-16 flex gap-6">
                             <button 
                               onClick={() => handleReview(submission, 'approve')}
                               disabled={adjudicating === submission.submissionId}
                               className="flex-grow bg-primary text-black py-6 font-esports font-black text-xl uppercase italic tracking-widest hover:bg-white transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 disabled:opacity-50"
                               style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
                             >
                               <Check size={20} /> SEAL VOW
                             </button>
                             <button 
                                 onClick={() => handleReview(submission, 'reject')}
                                 disabled={adjudicating === submission.submissionId}
                                 className="w-20 bg-black border border-error/40 flex items-center justify-center text-error/40 hover:bg-error hover:text-white transition-all disabled:opacity-50 active:scale-95"
                                 style={{ clipPath: 'polygon(20% 0, 100% 0, 80% 100%, 0% 100%)' }}
                             >
                               <X size={28} />
                             </button>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-48 text-center bg-black/40 border-2 border-dashed border-primary/10 relative overflow-hidden" style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}>
                    <div className="w-32 h-32 bg-primary/10 rounded-none border border-primary/20 flex items-center justify-center mx-auto mb-10 rotate-45 group">
                       <Eye className="text-primary animate-pulse -rotate-45" size={56} />
                    </div>
                    <p className="text-primary/20 italic font-black font-esports text-4xl mb-6 uppercase tracking-widest">Colony Equilibrium Reached</p>
                    <div className="text-[12px] text-primary font-black uppercase tracking-[0.8em] animate-pulse italic">
                      JUDGING COMPLETE
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="rules"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-6xl mx-auto"
              >
                <div className="bg-black/60 border border-primary/20 p-12 relative overflow-hidden" style={{ clipPath: 'polygon(3% 0, 100% 0, 97% 100%, 0% 100%)' }}>
                   <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                  <header className="flex flex-col md:flex-row items-center justify-between gap-12 border-b border-primary/10 pb-12 mb-12">
                    <div>
                      <h3 className="text-5xl font-esports italic text-white mb-2 uppercase digital-glow">Culling Statutes</h3>
                      <div className="flex gap-8 mt-6">
                        <button 
                          onClick={() => setShowAuditTabs('editor')}
                          className={`text-[12px] uppercase font-esports tracking-[0.2em] font-black italic transition-all ${showAuditTabs === 'editor' ? 'text-primary' : 'text-white/20 hover:text-white/40'}`}
                        >
                          Codex Editor
                        </button>
                        <button 
                          onClick={() => setShowAuditTabs('history')}
                          className={`text-[12px] uppercase font-esports tracking-[0.2em] font-black italic transition-all flex items-center gap-3 ${showAuditTabs === 'history' ? 'text-primary' : 'text-white/20 hover:text-white/40'}`}
                        >
                          Audit Manifest
                          {auditLogs.length > 0 && <span className="text-[10px] bg-primary text-black px-2 py-0.5 font-bold">{auditLogs.length}</span>}
                        </button>
                      </div>
                    </div>
                    {showAuditTabs === 'editor' && (
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => setShowPreview(!showPreview)}
                          className={`px-8 py-4 font-esports font-black uppercase tracking-widest text-[12px] italic flex items-center gap-3 transition-all ${showPreview ? 'bg-secondary text-white' : 'bg-primary/10 text-primary border border-primary/20'}`}
                           style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
                        >
                          <Eye size={18} />
                          {showPreview ? 'Edit Codex' : 'Preview Codex'}
                        </button>
                        <button
                          onClick={() => {
                            const { added, removed } = getDiff();
                            setChangeSummary({ added: added.length, removed: removed.length });
                            setShowConfirmRules(true);
                          }}
                          disabled={savingRules || rules === originalRules}
                          className="bg-primary text-black px-10 py-5 font-esports font-black uppercase tracking-widest text-[14px] italic flex items-center gap-4 shadow-2xl shadow-primary/20 hover:bg-white transition-all disabled:opacity-30 active:scale-95"
                           style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
                        >
                          {savingRules ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                          Save Changes
                        </button>
                      </div>
                    )}
                  </header>

                  <div className="space-y-12">
                    {showAuditTabs === 'editor' ? (
                      <>
                        {!showPreview && (
                          <div className="flex gap-4 mb-6 p-4 bg-primary/5 border border-primary/10 w-fit" style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}>
                            <button 
                              onClick={() => applyFormat('bold')}
                              className="p-2 text-primary/40 hover:text-primary transition-all hover:bg-primary/10"
                              title="Bold"
                            >
                              <Bold size={18} />
                            </button>
                            <button 
                              onClick={() => applyFormat('italic')}
                              className="p-2 text-primary/40 hover:text-primary transition-all hover:bg-primary/10"
                              title="Italic"
                            >
                              <Italic size={18} />
                            </button>
                            <button 
                              onClick={() => applyFormat('list')}
                              className="p-2 text-primary/40 hover:text-primary transition-all hover:bg-primary/10"
                              title="Bullet List"
                            >
                              <List size={18} />
                            </button>
                          </div>
                        )}
                        <div className="relative group" ref={editorRef}>
                          <div className="absolute -inset-1 bg-primary/20 rounded-none blur opacity-30 group-focus-within:opacity-100 transition-opacity" />
                          {showPreview ? (
                            <div className="relative w-full h-[700px] bg-[#080808] border border-primary/20 p-20 overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,0.8)] prose prose-invert prose-lg max-w-none scrollbar-hide 
                              prose-headings:font-esports prose-headings:italic prose-headings:uppercase prose-headings:tracking-tighter prose-headings:digital-glow
                              prose-h1:text-8xl prose-h1:mb-16 prose-h1:border-b-2 prose-h1:border-primary/30 prose-h1:pb-8 prose-h1:text-center
                              prose-h2:text-5xl prose-h2:mt-20 prose-h2:mb-8 prose-h2:text-primary
                              prose-h3:text-3xl prose-h3:text-secondary prose-h3:mt-12 prose-h3:mb-4
                              prose-p:font-sans prose-p:text-white/80 prose-p:leading-relaxed prose-p:text-xl prose-p:font-medium
                              prose-strong:text-primary prose-strong:font-black prose-strong:text-2xl
                              prose-blockquote:border-l-8 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-8 prose-blockquote:px-12 prose-blockquote:italic prose-blockquote:text-white/60 prose-blockquote:my-12
                              prose-ul:list-square prose-ul:marker:text-primary prose-ul:my-10 prose-ul:space-y-4
                              prose-li:pl-2
                              prose-hr:border-primary/20 prose-hr:my-16
                              prose-table:w-full prose-table:border-collapse prose-table:my-10
                              prose-th:bg-primary/20 prose-th:text-primary prose-th:p-6 prose-th:font-esports prose-th:tracking-widest prose-th:text-2xl
                              prose-td:p-6 prose-td:border prose-td:border-primary/10 prose-td:bg-white/5
                            ">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {rules}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="relative w-full h-[700px] bg-[#080808] border border-primary/10 overflow-hidden shadow-2xl overflow-y-auto custom-editor">
                              <Editor
                                value={rules}
                                onValueChange={code => setRules(code)}
                                highlight={code => highlight(code, languages.markdown, 'markdown')}
                                padding={40}
                                style={{
                                  fontFamily: '"JetBrains Mono", monospace',
                                  fontSize: 16,
                                  minHeight: '100%',
                                  backgroundColor: 'transparent',
                                  color: 'rgba(248, 231, 28, 0.9)',
                                }}
                                className="outline-none"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-6 p-8 bg-primary/5 border border-primary/10">
                          <Info className="text-primary" size={24} />
                          <p className="text-[12px] uppercase font-esports tracking-widest font-black italic text-primary/60">
                            Culling Statutes updated instantly. Binding vows will be enforced across all sorcerer domains.
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-8">
                        {loadingLogs ? (
                          <div className="py-24 text-center animate-pulse text-primary/10 italic font-black font-esports text-2xl uppercase">Extracting barrier logs...</div>
                        ) : auditLogs.length > 0 ? (
                          auditLogs.map((log) => (
                            <div key={log.id} className="p-10 bg-black/40 border border-primary/10 relative overflow-hidden" style={{ clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0% 100%)' }}>
                              <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                              <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-6">
                                  <div className="w-14 h-14 bg-primary/10 rounded-none border border-primary/20 flex items-center justify-center rotate-45">
                                     <Scroll className="text-primary -rotate-45" size={24} />
                                  </div>
                                  <div>
                                    <div className="text-xl font-esports font-black text-white italic uppercase tracking-widest mb-1">{log.archivistName}</div>
                                    <div className="text-[10px] text-primary/40 uppercase tracking-[0.3em] font-mono font-black italic">
                                      {log.timestamp?.toMillis ? format(new Date(log.timestamp.toMillis()), 'MMM dd, yyyy HH:mm') : 'Recently'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-10">
                                {log.diff?.added?.length > 0 && (
                                  <div className="space-y-4">
                                    <div className="text-[10px] uppercase font-black tracking-widest text-[#a3e635] italic">MANIFESTED (+)</div>
                                    <div className="p-6 bg-[#a3e635]/5 border border-[#a3e635]/10 rounded-none space-y-3">
                                      {log.diff.added.map((line: string, i: number) => (
                                        <div key={i} className="text-xs text-[#a3e635]/80 font-mono break-all line-clamp-1 italic font-bold">+ {line}</div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {log.diff?.removed?.length > 0 && (
                                  <div className="space-y-4">
                                    <div className="text-[10px] uppercase font-black tracking-widest text-error italic">ANNIHILATED (-)</div>
                                    <div className="p-6 bg-error/5 border border-error/10 rounded-none space-y-3">
                                      {log.diff.removed.map((line: string, i: number) => (
                                        <div key={i} className="text-xs text-error/80 font-mono break-all line-clamp-1 italic font-bold">- {line}</div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-24 text-center text-primary/10 italic font-black font-esports text-xl uppercase tracking-widest">No barrier records detected.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmRules && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmRules(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-black border-2 border-primary/40 p-12 max-w-lg w-full shadow-2xl relative overflow-hidden"
              style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}
            >
               <div className="absolute top-0 left-0 w-full h-1 bg-primary digital-glow" />
              <div className="w-20 h-20 bg-primary/10 rounded-none border border-primary/20 flex items-center justify-center mb-10 mx-auto rotate-45 group">
                <AlertCircle className="text-primary -rotate-45" size={40} />
              </div>
              <h3 className="text-4xl font-esports italic text-white text-center mb-6 uppercase digital-glow">Manager Confirmation</h3>
              <p className="text-primary/60 text-center font-bold mb-10 leading-relaxed text-sm uppercase italic tracking-widest">
                Manifest these binding vows? These statutes will instantly alter the reality for every sorcerer in the colony.
              </p>

              <div className="flex justify-center gap-8 mb-12 border-y border-primary/10 py-8">
                <div className="text-center px-6 py-4 bg-[#a3e635]/10 border border-[#a3e635]/20">
                  <div className="text-[10px] uppercase font-black text-[#a3e635]/60 mb-2 italic">MANIFESTED</div>
                  <div className="text-3xl font-mono font-black text-[#a3e635]">+{changeSummary.added}</div>
                </div>
                <div className="text-center px-6 py-4 bg-error/10 border border-error/20">
                  <div className="text-[10px] uppercase font-black text-error/60 mb-2 italic">ANNIHILATED</div>
                  <div className="text-3xl font-mono font-black text-error">-{changeSummary.removed}</div>
                </div>
              </div>

              <div className="flex gap-6">
                <button
                  onClick={() => setShowConfirmRules(false)}
                  className="flex-1 py-5 border border-primary/20 rounded-none text-[12px] uppercase font-black tracking-widest text-primary/40 hover:bg-primary/5 transition-all italic hover:text-primary"
                >
                  Dissipate
                </button>
                <button
                  onClick={() => {
                    handleUpdateRules();
                    setShowConfirmRules(false);
                  }}
                  className="flex-1 py-5 bg-primary text-black rounded-none font-esports font-black text-lg uppercase tracking-widest shadow-2xl hover:bg-white transition-all shadow-primary/20 italic"
                >
                  SEAL VOW
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Oracle;
