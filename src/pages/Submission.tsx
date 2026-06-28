import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { db, handleFirestoreError } from '../services/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { BookCategory, SubmissionStatus } from '../types';
import { motion } from 'motion/react';
import { Book, PenTool, Hash, Info, Star, ChevronRight, Image as ImageIcon, Sparkles, Loader2, Link as LinkIcon, X, Zap } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import Kogane from '../components/Kogane';
import { getKoganeJudgment } from '../services/koganeService';
import { checkAndAwardBadges } from '../services/badgeService';
import { ParticleExplosion } from '../components/ParticleExplosion';
import { CelebrationConfetti } from '../components/CelebrationConfetti';
import { playPageFlip } from '../services/audioService';
import { useToast } from '../services/ToastContext';
import { updateReadingStreak } from '../services/streakService';

const Submission: React.FC = () => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [koganeJudgment, setKoganeJudgment] = useState("");
  const [showExplosion, setShowExplosion] = useState(false);
  const [showCelebrationConfetti, setShowCelebrationConfetti] = useState(false);
  
  const [formData, setFormData] = useState({
    bookTitle: '',
    author: '',
    category: BookCategory.NOVEL,
    synopsis: '',
    assessment: '',
    rating: 3,
    pagesRead: 250,
    coverImageUrl: ''
  });

  const [coverUrlInput, setCoverUrlInput] = useState('');

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!editId || !user) return;
      
      setFetching(true);
      try {
        const docRef = doc(db, 'submissions', editId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Security check: only owner can edit
          if (data.userId !== user.uid) {
            navigate('/profile');
            return;
          }
          // Only pending can be edited
          if (data.status !== SubmissionStatus.PENDING) {
            setStatusError(`JUDGMENT! This record is sealed. Modifications are only permitted for pending techniques.`);
            return;
          }

          setFormData({
            bookTitle: data.bookTitle || '',
            author: data.author || '',
            category: data.category || BookCategory.NOVEL,
            synopsis: data.synopsis || '',
            assessment: data.assessment || '',
            rating: data.rating || 3,
            pagesRead: data.pagesRead !== undefined ? data.pagesRead : 250,
            coverImageUrl: data.coverImageUrl || ''
          });
          if (data.coverImageUrl && data.coverImageUrl.startsWith('http')) {
            setCoverUrlInput(data.coverImageUrl);
          }
        }
      } catch (error) {
        // Ignore
      } finally {
        setFetching(false);
      }
    };

    fetchSubmission();
  }, [editId, user, navigate]);
  
  const generateCover = async () => {
    if (!formData.bookTitle) return;
    
    setGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `A cinematic, atmospheric book cover design for a book titled "${formData.bookTitle}" by ${formData.author || 'an unknown author'}. The style should be dark, mysterious, and obsidian-themed, fitting for a grand literary archive. Minimal text, artistic illustration, photorealistic textures, 3:4 aspect ratio.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4"
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            setFormData(prev => ({ ...prev, coverImageUrl: `data:image/png;base64,${base64Data}` }));
            break;
          }
        }
      }
    } catch (error) {
      // Ignore
    } finally {
      setGenerating(false);
    }
  };

  const handleUrlPreview = () => {
    if (coverUrlInput) {
      setFormData(prev => ({ ...prev, coverImageUrl: coverUrlInput }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // Get Kogane's AI judgment
      const judgment = await getKoganeJudgment(formData.bookTitle, formData.assessment);
      setKoganeJudgment(judgment);

      if (editId) {
        const submissionRef = doc(db, 'submissions', editId);
        await updateDoc(submissionRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
        showToast({
          title: 'Tome Transcribed',
          description: `The records for "${formData.bookTitle}" have been successfully updated.`,
          type: 'success'
        });
      } else {
        const submissionData = {
          userId: user.uid,
          userName: profile?.displayName || user.displayName || 'Champion',
          ...formData,
          status: SubmissionStatus.PENDING,
          pointsEarned: 0,
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'submissions'), submissionData);
        showToast({
          title: 'Tome Sealed',
          description: `The records for "${formData.bookTitle}" have been submitted for Oracle's review.`,
          type: 'success'
        });
      }
      
      // Recalculate user's consecutive day reading streak in Firestore
      await updateReadingStreak(user.uid);
      
      await checkAndAwardBadges(user.uid, { isSubmission: true });
      
      // Play page flip sound
      playPageFlip();
      
      // Trigger the particle-explosion animation on the button
      setShowExplosion(true);
      
      // Wait for the gorgeous explosion animation to unfold before transitioning to the success page
      await new Promise((resolve) => setTimeout(resolve, 1400));
      
      setSuccess(true);
      setShowCelebrationConfetti(true);
      setTimeout(() => navigate('/profile'), 10000);
    } catch (error) {
      handleFirestoreError(error, editId ? 'update' : 'create', '/submissions');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-primary font-serif italic text-xl animate-pulse"
        >
          Retrieving Scroll archival data...
        </motion.div>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-6 domain-expansion-bg">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-12 bg-surface-charcoal border border-error/40 rounded-sm shadow-2xl max-w-lg"
          style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)' }}
        >
          <Kogane size={80} speech="ILLEGAL ACTION!" className="mb-12" />
          <h2 className="text-4xl font-esports italic text-primary mb-4 uppercase">JUDGMENT RENDERED</h2>
          <p className="text-on-surface-variant font-bold mb-8 italic">
            {statusError}
          </p>
          <button 
            onClick={() => navigate('/profile')}
            className="w-full bg-error/10 text-error border border-error/20 py-4 rounded-full font-bold tracking-widest text-[10px] uppercase hover:bg-error hover:text-white transition-all active:scale-95"
          >
            Return to Colony
          </button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-6 domain-expansion-bg relative overflow-hidden">
        <CelebrationConfetti active={showCelebrationConfetti} />
        {/* Animated background elements to prevent "black screen" feel */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="text-center p-8 md:p-16 bg-surface-charcoal/80 backdrop-blur-xl border-2 border-primary/30 rounded-sm shadow-[0_0_50px_rgba(250,204,21,0.15)] relative max-w-2xl w-full z-10"
          style={{ clipPath: 'polygon(5% 0, 100% 0, 100% 95%, 95% 100%, 0 100%, 0 5%)' }}
        >
          <div className="flex justify-center mb-10">
            <Kogane size={100} speech={koganeJudgment} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl md:text-6xl font-esports italic text-primary mb-2 uppercase digital-glow">SCORE REPORTED!</h2>
            <div className="w-24 h-1 bg-primary/40 mx-auto mb-8 esports-edge-flat" />
          </motion.div>

          <p className="text-on-surface-variant font-bold mb-10 max-w-sm mx-auto italic text-lg leading-relaxed">
            Kogane has accepted your report. The binding vows are sealed.
          </p>

          {/* User Stats Display */}
          <div className="grid grid-cols-2 gap-4 mb-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-black/40 border border-primary/10 p-6 flex flex-col items-center justify-center"
              style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-primary/40 font-black mb-1">TOTAL SCORE</div>
              <div className="text-4xl font-esports font-black text-white italic digital-glow">{profile?.totalPoints || 0}</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-black/40 border border-secondary/10 p-6 flex flex-col items-center justify-center"
              style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-secondary/40 font-black mb-1">COLONY RANK</div>
              <div className="text-4xl font-esports font-black text-white italic digital-glow">
                #{profile?.rank || '--'}
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/profile')}
              className="w-full md:w-auto px-10 py-4 bg-primary/10 text-primary border border-primary/20 rounded-none font-esports font-bold tracking-[0.2em] text-lg uppercase hover:bg-primary hover:text-black transition-all active:scale-95 italic"
              style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
            >
              Return to Colony
            </button>
            <button 
              onClick={() => navigate('/arena')}
              className="w-full md:w-auto px-10 py-4 bg-secondary/10 text-secondary border border-secondary/20 rounded-none font-esports font-bold tracking-[0.2em] text-lg uppercase hover:bg-secondary hover:text-white transition-all active:scale-95 italic"
              style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
            >
              View Rankings
            </button>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            className="mt-12 text-[8px] uppercase tracking-[0.5em] font-black text-primary animate-pulse"
          >
            Redirecting automatically in 10 seconds...
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12 overflow-hidden">
      <motion.div 
        className="max-w-4xl mx-auto"
        initial={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 50%, 0 50%)', opacity: 0 }}
        animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
      >
        <header className="mb-16">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="text-5xl font-serif italic text-on-surface mb-4 tracking-tighter"
          >
            {editId ? 'Revise your Log' : 'Log a new Conquest'}
          </motion.h2>
          <motion.p 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.6 }}
             className="text-on-surface/40 font-light max-w-lg"
          >
            {editId ? 'Refine your assessment before the oracles look upon it.' : 'Document your journey through literature. Be precise, be honest, and be thorough. The oracles are watching.'}
          </motion.p>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Left Column: Basic Info */}
          <div className="space-y-10 group frosted-card !rounded-[32px]">
             <div className="relative">
               <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-on-surface/40 mb-3 block font-bold">
                 Book Title
               </label>
               <div className="relative">
                 <input 
                   required
                   value={formData.bookTitle}
                   onChange={e => setFormData({...formData, bookTitle: e.target.value})}
                   className="w-full bg-transparent border-b border-on-surface/10 py-4 font-serif italic text-2xl text-on-surface outline-none focus:border-primary transition-all placeholder:text-on-surface/5"
                   placeholder="The Great Gatsby"
                 />
                 <Book className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20 text-on-surface" size={24} />
               </div>
             </div>

             <div className="relative">
               <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-on-surface/40 mb-3 block font-bold">
                 Author
               </label>
               <input 
                 required
                 value={formData.author}
                 onChange={e => setFormData({...formData, author: e.target.value})}
                 className="w-full bg-transparent border-b border-on-surface/10 py-4 font-sans text-lg text-on-surface outline-none focus:border-primary transition-all placeholder:text-on-surface/5"
                 placeholder="F. Scott Fitzgerald"
               />
               <PenTool className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20 text-on-surface" size={20} />
             </div>

             <div className="relative">
               <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-on-surface/40 mb-3 block font-bold">
                 Book Cover Design
               </label>
               <div className="space-y-4">
                 <div className="relative aspect-[3/4] bg-on-surface/5 border-2 border-dashed border-on-surface/10 rounded-2xl flex items-center justify-center overflow-hidden group shadow-inner">
                   {formData.coverImageUrl ? (
                     <>
                        <img 
                          src={formData.coverImageUrl} 
                          alt="Cover" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <button 
                          type="button" 
                          onClick={() => { setFormData(prev => ({...prev, coverImageUrl: ''})); setCoverUrlInput(''); }}
                          className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-full text-on-surface/80 hover:text-on-surface opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                     </>
                   ) : (
                     <div className="text-center p-8">
                       <ImageIcon className="mx-auto mb-4 text-on-surface/10 animate-pulse-slow" size={48} />
                       <p className="text-[10px] text-on-surface/20 uppercase tracking-[0.3em] font-bold">No Cover Assigned</p>
                     </div>
                   )}
                   {generating && (
                     <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-on-surface z-20">
                        <Loader2 className="animate-spin mb-4 text-primary" size={40} />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Forging in AI Flames...</span>
                     </div>
                   )}
                 </div>

                 <div className="space-y-4">
                   <div className="flex gap-2">
                     <div className="relative flex-grow">
                       <input 
                         type="text"
                         placeholder="Paste Book Cover URL"
                         value={coverUrlInput}
                         className="w-full bg-on-surface/5 border border-on-surface/10 rounded-xl py-4 pl-12 pr-12 text-xs text-on-surface outline-none focus:border-primary/50 transition-all placeholder:text-on-surface/20 font-sans"
                         onChange={(e) => setCoverUrlInput(e.target.value)}
                       />
                       <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                       {coverUrlInput && (
                         <button 
                           type="button"
                           onClick={() => setCoverUrlInput('')}
                           className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/40 hover:text-primary transition-colors"
                         >
                           <X size={14} />
                         </button>
                       )}
                     </div>
                     <button
                       type="button"
                       onClick={handleUrlPreview}
                       disabled={!coverUrlInput}
                       className="px-6 bg-on-surface/5 border border-on-surface/10 rounded-xl text-[10px] uppercase tracking-widest font-bold text-on-surface/60 hover:text-on-surface hover:bg-on-surface/10 transition-all disabled:opacity-20"
                     >
                       Preview
                     </button>
                   </div>

                   <button
                     type="button"
                     onClick={generateCover}
                     disabled={generating || !formData.bookTitle}
                     className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-xl text-[11px] uppercase tracking-[0.2em] font-bold text-primary hover:from-primary/30 hover:to-secondary/30 transition-all disabled:opacity-20 shadow-lg shadow-primary/5 group"
                   >
                     <Sparkles size={16} className="group-hover:rotate-12 transition-transform" /> 
                     Generate Cover with AI
                   </button>
                 </div>
               </div>
             </div>

             <div className="space-y-8">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                   <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-white/40 mb-3 block font-bold">
                     Category
                   </label>
                   <select 
                     value={formData.category}
                     onChange={e => setFormData({...formData, category: e.target.value as BookCategory})}
                     className="w-full bg-on-surface/5 border border-on-surface/10 py-4 px-4 rounded-xl font-sans text-xs uppercase tracking-widest font-bold text-on-surface outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                   >
                     <option value={BookCategory.NOVEL} className="bg-[#0a0a0c]">Novel</option>
                     <option value={BookCategory.POETRY} className="bg-[#0a0a0c]">Poetry</option>
                     <option value={BookCategory.NON_FICTION} className="bg-[#0a0a0c]">Non-Fiction</option>
                   </select>
                 </div>

                 <div>
                   <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-white/40 mb-3 block font-bold">
                     Pages Read
                   </label>
                   <input 
                     type="number"
                     required
                     min={1}
                     max={10000}
                     value={formData.pagesRead}
                     onChange={e => setFormData({...formData, pagesRead: parseInt(e.target.value) || 0})}
                     className="w-full bg-on-surface/5 border border-on-surface/10 py-4 px-4 rounded-xl font-sans text-xs uppercase tracking-widest font-bold text-on-surface outline-none focus:border-primary transition-all"
                     placeholder="250"
                   />
                 </div>
               </div>
               
               <div>
                 <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-white/40 mb-3 block font-bold">
                   Personal Verdict
                 </label>
                 <div className="flex items-center gap-4 h-[54px] bg-white/5 border border-white/10 px-6 rounded-xl">
                   {[1, 2, 3, 4, 5].map(star => (
                     <button
                       key={star}
                       type="button"
                       onClick={() => setFormData({...formData, rating: star})}
                       className={`transition-all duration-300 ${formData.rating >= star ? 'text-primary scale-110' : 'text-on-surface/10 hover:text-on-surface/30'}`}
                     >
                       <Star size={16} fill={formData.rating >= star ? 'currentColor' : 'none'} />
                     </button>
                   ))}
                 </div>
               </div>
             </div>
          </div>

          {/* Right Column: Descriptions & Preview */}
          <div className="space-y-10">
             {/* Tome Preview Section */}
             <div className="frosted-card !rounded-[32px] !p-10 border-primary/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />
               <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-primary mb-6 block font-bold">
                 Tome Preview
               </label>
               
               <div className="flex flex-col md:flex-row gap-8 items-start">
                 <div className="flex-shrink-0 w-48 md:w-64 h-64 md:h-80 bg-white/5 rounded-xl overflow-hidden shadow-2xl border border-white/10 relative group mx-auto md:mx-0">
                   {formData.coverImageUrl ? (
                     <>
                        <img 
                          src={formData.coverImageUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                          <button 
                            type="button"
                            onClick={() => { setFormData(prev => ({...prev, coverImageUrl: ''})); setCoverUrlInput(''); }}
                            className="bg-[#ef4444] text-white px-6 py-3 rounded-full font-esports font-bold text-[10px] uppercase tracking-[0.2em] transform scale-90 group-hover:scale-100 transition-all hover:bg-[#dc2626] shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                          >
                            Remove Cover
                          </button>
                        </div>
                     </>
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-white/5">
                       <Book size={64} />
                     </div>
                   )}
                 </div>
                 
                 <div className="flex-grow pt-4">
                   <h4 className="text-3xl font-serif italic text-white mb-2 leading-tight min-h-[1.2em]">
                     {formData.bookTitle || 'Untitled Tome'}
                   </h4>
                   <p className="text-sm font-sans text-white/40 mb-6 italic">
                     by {formData.author || 'Anonymous'}
                   </p>
                   
                   <div className="flex gap-1.5">
                     {[1, 2, 3, 4, 5].map(star => (
                       <Star 
                        key={star} 
                        size={12} 
                        className={formData.rating >= star ? 'text-primary fill-primary' : 'text-white/5'} 
                       />
                     ))}
                   </div>
                 </div>
               </div>
             </div>

             {/* Form Fields Section */}
             <div className="frosted-card !rounded-[32px] !p-10 space-y-10 shadow-2xl">
               <div className="relative">
                 <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-white/40 mb-3 block font-bold">
                   Synopsis
                 </label>
                 <textarea 
                   required
                   rows={4}
                   value={formData.synopsis}
                   onChange={e => setFormData({...formData, synopsis: e.target.value})}
                   className="w-full bg-white/5 border border-white/10 py-4 px-4 rounded-xl font-sans text-sm text-white outline-none focus:border-primary transition-all resize-none placeholder:text-white/5"
                   placeholder="What was the essence of this tome?"
                 />
               </div>

               <div className="relative">
                 <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-white/40 mb-3 block font-bold">
                   Your Assessment
                 </label>
                 <textarea 
                   required
                   rows={6}
                   value={formData.assessment}
                   onChange={e => setFormData({...formData, assessment: e.target.value})}
                   className="w-full bg-white/5 border border-white/10 py-4 px-4 rounded-xl font-sans text-sm text-white outline-none focus:border-primary transition-all resize-none placeholder:text-white/5"
                   placeholder="How did this work impact your intellect? What were the standout themes?"
                 />
               </div>

               <div className="pt-4 relative"><ParticleExplosion active={showExplosion} onComplete={() => setShowExplosion(false)} />
                 <button 
                   disabled={loading || showExplosion}
                   type="submit"
                   className="relative overflow-visible w-full bg-gradient-to-tr from-primary to-secondary text-white py-5 rounded-full font-bold tracking-widest text-[10px] uppercase hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                 >
                   {loading ? (editId ? 'Updating Archive...' : 'Submitting to Archive...') : (
                     <>
                       {editId ? 'Archive Revision' : 'Submit for Adjudication'}
                       <ChevronRight size={14} />
                     </>
                   )}
                 </button>
               </div>
             </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Submission;
