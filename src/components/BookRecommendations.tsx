import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../services/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { 
  BookOpen, 
  Sparkles, 
  RefreshCw, 
  Compass, 
  Lock, 
  BrainCircuit, 
  ShieldAlert, 
  Zap, 
  Heart,
  ChevronRight
} from 'lucide-react';
import { getBookRecommendations, BookRecommendation } from '../services/koganeService';
import { Submission } from '../types';

export const BookRecommendations: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>([]);
  const [userGenres, setUserGenres] = useState<string[]>([]);
  const [submissionsCount, setSubmissionsCount] = useState<number>(0);
  const [hasScanned, setHasScanned] = useState<boolean>(false);

  // Default recommendations for non-authenticated or empty-state users
  const DEFAULT_RECOMMENDATIONS: BookRecommendation[] = [
    {
      title: "Frankenstein",
      author: "Mary Shelley",
      genres: ["Gothic Fiction", "Science Fiction"],
      reason: "Aligned with your innate affinity for creation covenants and life-energy alteration.",
      jjkTechniqueName: "Covenant of the Flesh Graft",
      jjkTechniqueDesc: "Generates high physical defense and synthetic cursed energy by bonding literary cores of raw human nature.",
      resonance: 88,
      pagesEstimate: 280
    },
    {
      title: "The Picture of Dorian Gray",
      author: "Oscar Wilde",
      genres: ["Gothic Fiction", "Philosophical"],
      reason: "Resonates with the vanity, soul binding, and aesthetic curses of the Obsidian Archive.",
      jjkTechniqueName: "Dorian's Substitute Portrait",
      jjkTechniqueDesc: "Transfers cognitive exhaustion and mental fatigue onto a spiritual proxy, ensuring high focus during reading sessions.",
      resonance: 92,
      pagesEstimate: 250
    },
    {
      title: "The Fall of the House of Usher",
      author: "Edgar Allan Poe",
      genres: ["Horror", "Gothic Fiction"],
      reason: "A structural masterpiece of environmental despair and psychological domains.",
      jjkTechniqueName: "Innate House Collapse",
      jjkTechniqueDesc: "Infuses the reader with localized gravity energy, allowing rapid comprehension of gothic architectural sub-themes.",
      resonance: 94,
      pagesEstimate: 120
    }
  ];

  // Load user data & check cached recommendations
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setRecommendations(DEFAULT_RECOMMENDATIONS);
        return;
      }

      try {
        // Fetch user genres from user profile
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        let genres: string[] = [];
        if (userDocSnap.exists()) {
          const profileData = userDocSnap.data();
          genres = profileData.favoriteGenres || [];
          setUserGenres(genres);
        }

        // Fetch submissions history
        const q = query(collection(db, 'submissions'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        setSubmissionsCount(querySnapshot.size);

        // Check if recommendations cached in localStorage
        const cached = localStorage.getItem(`rec_cache_${user.uid}`);
        if (cached) {
          setRecommendations(JSON.parse(cached));
          setHasScanned(true);
        } else {
          // Set initial visual placeholder
          setRecommendations([]);
        }
      } catch (error) {
        // Continue silently on cache read failure
      }
    };

    loadUserData();
  }, [user]);

  const handleInitiateScan = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch fresh submissions history to represent the exact reading profile
      const q = query(collection(db, 'submissions'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const historyList = querySnapshot.docs.map(doc => {
        const data = doc.data() as Submission;
        return {
          bookTitle: data.bookTitle,
          author: data.author,
          synopsis: data.synopsis,
          status: data.status
        };
      });

      // Call the AI integration
      const freshRecs = await getBookRecommendations(userGenres, historyList);

      if (freshRecs && freshRecs.length > 0) {
        setRecommendations(freshRecs);
        localStorage.setItem(`rec_cache_${user.uid}`, JSON.stringify(freshRecs));
        setHasScanned(true);
      } else {
        // Fallback if AI fails or returns blank
        setRecommendations(DEFAULT_RECOMMENDATIONS);
      }
    } catch (error) {
      // Fallback
      setRecommendations(DEFAULT_RECOMMENDATIONS);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="obsidian-cognitive-chamber" 
      className="w-full max-w-7xl mx-auto my-24 px-6 md:px-12 py-16 bg-gradient-to-b from-black/80 to-surface-charcoal/80 border-t-2 border-b-2 border-primary/10 relative overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 domain-grid-bg opacity-[0.03] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-3xl pointer-events-none rounded-full" />
      
      {/* Absolute Edge Labels */}
      <div className="absolute top-4 left-6 text-[8px] font-mono tracking-[0.4em] text-primary/30 uppercase font-black">
        Colony Core System v4.51
      </div>
      <div className="absolute bottom-4 right-6 text-[8px] font-mono tracking-[0.4em] text-secondary/30 uppercase font-black">
        Projection Status: Operational
      </div>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-primary/15 pb-8">
        <div id="recs-header-content" className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary/40" />
            <span className="text-[10px] tracking-[0.5em] font-esports text-primary font-black uppercase italic">
              Cognitive Domain Alignment
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-esports font-black text-on-surface uppercase italic tracking-tighter">
            AI Tome Recommendations
          </h2>
          <p className="text-sm font-sans font-bold text-on-surface-variant max-w-2xl leading-relaxed italic">
            Analyze your reading lineage, genre affinities, and previous cursed energy outputs. 
            Kogane's intelligence synthesizes actual external books and extracts potential Techniques for your arsenal.
          </p>
        </div>

        <div>
          {user ? (
            <button
              id="initiate-neural-probe-btn"
              onClick={handleInitiateScan}
              disabled={loading}
              className="relative px-8 py-4 bg-primary text-black font-esports font-black text-xs uppercase tracking-[0.3em] italic hover:bg-white hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all flex items-center gap-3 disabled:opacity-45 disabled:pointer-events-none cursor-pointer"
              style={{ clipPath: 'polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%)' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin inline" /> SCANNING LINEAGE...
                </>
              ) : (
                <>
                  <BrainCircuit size={14} className="inline animate-pulse" /> {hasScanned ? "REFRESH TECHNIQUE SCAN" : "INITIATE COGNITIVE SCAN"}
                </>
              )}
            </button>
          ) : (
            <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 text-yellow-500 text-[10px] font-esports uppercase tracking-widest italic flex items-center gap-3">
              <Lock size={12} /> Sync lineage by entering the colony
            </div>
          )}
        </div>
      </header>

      {/* Main recommendation Display */}
      <AnimatePresence mode="wait">
        {!user ? (
          // Visitor Mode teaser with preview
          <motion.div 
            key="visitor-teaser"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-12"
          >
            <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-primary/5 border border-primary/20 rounded-none relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Compass size={120} />
              </div>
              <div className="space-y-4 max-w-3xl mb-6 md:mb-0">
                <span className="px-3 py-1 bg-primary/10 border border-primary/25 text-[8px] font-mono tracking-widest text-primary uppercase font-bold italic">Unregistered Contender</span>
                <h3 className="text-2xl font-esports font-black text-on-surface uppercase">Unleash Your Reading Cursed Technique</h3>
                <p className="text-xs font-sans text-on-surface-variant font-bold leading-relaxed">
                  Sign in using Google Auth to let our AI scan your historic manifestations (submitted book logs) and favorite genres, and generate personalized cursed technique alignments for premium literary recommendations. Here is a baseline projection for gothic themes:
                </p>
              </div>
              <Compass size={24} className="text-primary hidden md:block" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {DEFAULT_RECOMMENDATIONS.map((rec, idx) => (
                <div 
                  key={idx} 
                  id={`baseline-tome-card-${idx}`}
                  className="bg-black/40 border border-white/5 p-8 relative overflow-hidden flex flex-col justify-between hover:border-primary/20 transition-all group"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 92%, calc(100% - 20px) 100%, 0 100%)' }}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-3">
                      <span className="text-[10px] font-mono tracking-widest text-primary/40 font-black uppercase">Preset Probe {idx + 1}</span>
                      <span className="text-[10px] font-mono text-secondary bg-secondary/5 border border-secondary/15 px-2 py-0.5 font-bold italic">
                        {rec.resonance}% SYNC
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-2xl font-serif font-black italic text-on-surface leading-tight group-hover:text-primary transition-colors">{rec.title}</h4>
                      <p className="text-xs font-sans tracking-[0.2em] uppercase font-bold text-primary/60">— {rec.author}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rec.genres.map((g, gi) => (
                        <span key={gi} className="text-[8px] font-mono font-bold tracking-widest uppercase bg-white/5 px-2 py-0.5 border border-white/5">{g}</span>
                      ))}
                    </div>

                    <div className="h-px bg-white/5 pt-2" />

                    <div className="space-y-2">
                      <span className="text-[8px] tracking-widest font-esports italic text-primary font-black uppercase">Acquired Technique: {rec.jjkTechniqueName}</span>
                      <p className="text-[11px] font-sans text-on-surface-variant/90 leading-relaxed italic">{rec.jjkTechniqueDesc}</p>
                    </div>
                  </div>

                  <div className="text-[8.5px] font-mono tracking-widest font-bold text-primary/30 uppercase pt-6">Est. Depth — {rec.pagesEstimate} pages</div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : loading ? (
          // Loading Sequence
          <motion.div 
            key="loading-sequence"
            className="flex flex-col items-center justify-center py-20 text-center space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative">
              <RefreshCw size={54} className="text-primary animate-spin" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-secondary-coral rounded-none rotate-45 animate-ping opacity-30" />
            </div>
            <div className="space-y-2 max-w-md">
              <span className="text-[10px] tracking-[0.4em] font-esports text-secondary font-black uppercase italic animate-pulse">
                Accessing Culling Log Registry
              </span>
              <p className="text-[11px] font-semibold text-primary/70 tracking-[0.2em] font-mono uppercase">
                Calculating index of {submissionsCount} submissions and favored domains...
              </p>
            </div>
          </motion.div>
        ) : !hasScanned ? (
          // Initial Empty State for logged user - Encourage to trigger scan
          <motion.div 
            key="empty-state"
            className="flex flex-col items-center justify-center text-center py-16 px-6 bg-primary/[0.02] border border-dashed border-primary/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BrainCircuit size={48} className="text-primary/30 mb-4 animate-bounce" />
            <h3 className="text-xl font-esports uppercase tracking-tight text-on-surface mb-2">Linage Record Unresolved</h3>
            <p className="text-xs font-sans text-on-surface-variant max-w-lg mb-8 font-semibold italic">
              Your domain currently records <span className="text-primary">{submissionsCount} manifests</span>. 
              Initiate a high-energy mental scan to construct tailored classic recommendations that complement your sorcerer lineage.
            </p>
            
            <button
              onClick={handleInitiateScan}
              className="px-10 py-5 bg-transparent border-2 border-primary hover:bg-primary/[0.08] hover:text-white text-primary font-esports font-black text-xs uppercase tracking-[0.3em] italic cursor-pointer transition-all"
              style={{ clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)' }}
            >
              TRIGGER RESONANCE SCAN
            </button>
          </motion.div>
        ) : (
          // Genuine fully tailored AI Recommendations
          <motion.div 
            key="tailored-recs"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Context bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/5 p-4 border border-primary/10">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-none animate-ping" />
                <span className="text-[10px] font-mono font-black tracking-widest text-primary uppercase italic">
                  Domain Projection Verified
                </span>
              </div>
              <div className="flex gap-4 text-[9px] font-mono tracking-wider text-on-surface-variant font-bold uppercase">
                <div>Manifestations Conquered: <span className="text-primary font-black">{submissionsCount} tomes</span></div>
                <div className="hidden sm:block text-white/20">|</div>
                <div>Target Genres: <span className="text-secondary font-black">{userGenres.length > 0 ? userGenres.join(', ') : 'All/Adaptive'}</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {recommendations.map((rec, index) => (
                <motion.div 
                  id={`ai-recs-card-${index}`}
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: index * 0.15 } }}
                  className="bg-black/40 border border-primary/20 hover:border-primary/50 hover:shadow-[0_10px_30px_rgba(240,196,25,0.05)] p-8 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group/card"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 94%, calc(100% - 15px) 100%, 0 100%)' }}
                >
                  <div className="space-y-6">
                    <header className="flex justify-between items-start gap-4 border-b border-primary/10 pb-4">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 font-mono text-[8px] bg-primary/10 tracking-widest text-primary border border-primary/15 uppercase font-bold italic">
                          TOME SPECIMEN 0{index + 1}
                        </span>
                        <div className="text-[8px] font-mono font-bold tracking-widest text-on-surface-variant/60 uppercase">
                          MATCHING YOUR ARCHIVE
                        </div>
                      </div>
                      
                      {/* Resonance index badge */}
                      <span className="text-[10px] font-mono text-secondary bg-secondary/5 border border-secondary/15 px-2.5 py-1 font-black italic shadow-sm tracking-wide">
                        {rec.resonance}% SYNC
                      </span>
                    </header>

                    {/* Book Metadata */}
                    <div className="space-y-2">
                      <h4 className="text-2xl md:text-3xl font-serif font-black italic tracking-wide text-on-surface leading-tight group-hover/card:text-primary transition-colors">
                        "{rec.title}"
                      </h4>
                      <p className="text-xs font-sans tracking-[0.2em] font-black uppercase text-primary/70">
                        — By {rec.author}
                      </p>
                    </div>

                    {/* Book tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rec.genres.map((g, gi) => (
                        <span key={gi} className="text-[8px] font-mono font-bold tracking-widest uppercase bg-white/5 border border-white/5 px-2.5 py-0.5 text-on-surface-variant">
                          {g}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-2 bg-primary/[0.02] border border-primary/5 p-4 rounded-none">
                      <div className="text-[8.5px] tracking-widest font-esports italic text-primary font-black uppercase flex items-center gap-1.5">
                        <Zap size={10} className="text-primary" /> Inherited Curse: {rec.jjkTechniqueName}
                      </div>
                      <p className="text-[11px] font-sans text-on-surface-variant/90 leading-relaxed font-semibold italic">
                        {rec.jjkTechniqueDesc}
                      </p>
                    </div>

                    {/* Alignment reason */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[8px] tracking-widest font-mono text-secondary font-black uppercase">
                        Socio-Cognitive Rationale:
                      </span>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        {rec.reason}
                      </p>
                    </div>
                  </div>

                  {/* Estimated size */}
                  <footer className="pt-8 border-t border-white/5 flex justify-between items-center text-on-surface-variant/50">
                    <span className="text-[8.5px] font-mono tracking-widest font-black uppercase">
                      Dimensional Weight: {rec.pagesEstimate} pages
                    </span>
                    <Heart size={11} className="text-red-500/30 group-hover/card:text-red-500/80 transition-colors cursor-pointer" />
                  </footer>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
