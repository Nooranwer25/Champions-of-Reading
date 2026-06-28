import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { useTheme } from '../services/ThemeContext';
import { signInWithGoogle, signInWithTestAccount, db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { BookOpen, Trophy, Scroll, Sword, X, Zap, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LeagueRules } from '../types';
import Logo from '../components/Logo';
import SeasonCountdown from '../components/SeasonCountdown';
import Kogane from '../components/Kogane';
import { getKoganeMotto } from '../services/koganeService';
import { OnboardingTutorial } from '../components/OnboardingTutorial';
import { ScholarsWisdom } from '../components/ScholarsWisdom';
import { BookRecommendations } from '../components/BookRecommendations';
import { TopArchivists } from '../components/TopArchivists';
import { GrandLeaderboard } from '../components/GrandLeaderboard';
import { WeeklyLeaderboard } from '../components/WeeklyLeaderboard';
import { WorkspaceTools } from '../components/WorkspaceTools';
import { RecentActivity } from '../components/RecentActivity';
import { DailyMissions } from '../components/DailyMissions';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [leagueRules, setLeagueRules] = useState<string>('');
  const [hasNewRule, setHasNewRule] = useState(false);
  const [koganeSpeech, setKoganeSpeech] = useState("JUDGMENT!");
  const [lastSeenRuleTime, setLastSeenRuleTime] = useState<number>(() => {
    return Number(localStorage.getItem('lastSeenRuleTime') || '0');
  });

  useEffect(() => {
    const fetchKogane = async () => {
      const speech = await getKoganeMotto();
      setKoganeSpeech(speech);
    };
    fetchKogane();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'config', 'league_rules'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as LeagueRules;
        setLeagueRules(data.content);
        
        const updateTime = data.lastUpdated?.toMillis() || 0;
        if (updateTime > lastSeenRuleTime) {
          setHasNewRule(true);
        }
      } else {
        setLeagueRules(`
### I. The Commitment
Every logged tome must be read in its entirety. Cursed energy is only generated through true comprehension.

### II. The Execution
A simple log is insufficient. Champions must demonstrate their mastery. Judgment will be severe.

### III. The Points
Points are awarded by Kogane based on the cursed energy manifest in the reflection.

### IV. The Domain
Only through consistent conquest can one expand their domain and sit upon the throne of the Elite.
        `);
      }
    }, (error) => {
      // Ignore
    });

    return () => unsubscribe();
  }, [lastSeenRuleTime]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      // Ignore
    }
  };

  const [testEmail, setTestEmail] = useState('');
  const [testPass, setTestPass] = useState('');
  const [showTestForm, setShowTestForm] = useState(false);

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testPass) return;
    try {
      await signInWithTestAccount(testEmail, testPass);
    } catch (error) {
      // Ignore
    }
  };

  const [showRules, setShowRules] = useState(false);

  const handleOpenRules = () => {
    setShowRules(true);
    setHasNewRule(false);
    const now = Date.now();
    setLastSeenRuleTime(now);
    localStorage.setItem('lastSeenRuleTime', now.toString());
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div className="relative overflow-hidden domain-expansion-bg">
      <OnboardingTutorial />
      {/* Decorative background energy */}
      <div className="mesh-gradient-1 !bg-secondary/20"></div>
      <div className="mesh-gradient-2 !bg-primary/10"></div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#facc15 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
            onClick={() => setShowRules(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, rotate: -1 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.9, y: 20, rotate: 1 }}
              className="cursed-contract-bg border-4 border-primary/20 p-12 md:p-20 max-w-2xl w-full relative overflow-y-auto max-h-[85vh] hide-scrollbar shadow-[0_0_100px_rgba(248,231,28,0.1)]"
              style={{ clipPath: 'polygon(2% 0, 98% 0, 100% 4%, 100% 96%, 98% 100%, 2% 100%, 0 96%, 0 4%)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                 <ShieldCheck size={300} className="text-primary" strokeWidth={0.5} />
              </div>

              <button 
                onClick={() => setShowRules(false)}
                className="absolute top-8 right-8 text-on-surface-variant hover:text-primary transition-all hover:rotate-90 p-2"
              >
                <X size={28} />
              </button>
              
              <div className="flex flex-col items-center text-center mb-16">
                <div className="text-[10px] uppercase font-sans tracking-[0.6em] text-primary mb-6 font-black italic digital-glow">The Culling Statutes</div>
                <h2 className="text-6xl font-esports italic text-on-surface mb-4 font-headline uppercase tracking-tighter">The Binding Vow</h2>
                <div className="w-48 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              </div>
              
              <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} prose-lg max-w-none text-on-surface-variant/80 font-sans font-medium leading-relaxed italic prose-h3:text-primary prose-h3:font-esports prose-h3:uppercase prose-h3:tracking-widest prose-h3:text-sm prose-h3:mb-2 prose-h3:mt-8 first:prose-h3:mt-0`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {leagueRules}
                </ReactMarkdown>
              </div>

              <div className="mt-20 pt-10 border-t border-primary/10 flex flex-col items-center gap-8">
                 <div className="flex items-center gap-6 opacity-30">
                    <div className="w-12 h-[2px] bg-primary/20" />
                    <Zap className="text-primary" size={20} />
                    <div className="w-12 h-[2px] bg-primary/20" />
                 </div>
                 
                 <button 
                  onClick={() => setShowRules(false)}
                  className="group relative px-12 py-4 bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all overflow-hidden"
                  style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
                 >
                   <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                   <span className="relative text-xs uppercase tracking-[0.5em] text-primary font-black italic">Vow Observed</span>
                 </button>

                 <div className="text-[8px] font-mono text-primary/20 uppercase tracking-[0.2em] font-bold">
                   Non-compliance results in immediate exile from the colony.
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-6">
        <motion.div 
          className="relative z-10 text-center max-w-6xl flex flex-col items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Kogane Float Left */}
          <div className="absolute -left-20 top-20 hidden xl:block">
            <Kogane size={120} speech={koganeSpeech} />
          </div>

          <motion.div 
            variants={itemVariants}
            className="mb-8 relative"
          >
            <div className="w-64 h-64 md:w-80 md:h-80 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/10 rotate-45 border-4 border-primary/40 scale-105 animate-pulse"></div>
              <div className="absolute inset-0 bg-secondary/10 -rotate-12 border-2 border-secondary/30"></div>
              <div className="relative z-10 transform hover:scale-110 transition-transform duration-500 cursed-energy-aura">
                <Logo size="lg" />
              </div>
            </div>
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-full text-center">
                <span className="text-primary font-esports text-6xl font-black italic tracking-widest uppercase digital-glow">REFINE</span>
            </div>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-7xl md:text-[10rem] font-esports font-black text-on-surface leading-[0.8] mb-8 italic uppercase tracking-tighter"
          >
            COLONY OF <span className="text-primary drop-shadow-[5px_5px_0_rgba(139,92,246,0.5)]">READING</span> CHAMPIONS
          </motion.h1>
 
          <motion.p 
            variants={itemVariants}
            className="text-xl md:text-2xl text-on-surface-variant max-w-3xl font-bold uppercase italic tracking-wide mb-12 border-l-4 border-primary pl-4"
          >
            The game has begun. Accumulate points. Refine your technique. Log your triumphs or be erased from the archive.
          </motion.p>
 
          <motion.div 
            variants={itemVariants}
            className="flex flex-col md:flex-row gap-8 mb-6"
          >
            {!user ? (
              <div className="flex flex-col items-center gap-4">
                <button 
                  id="tour-login-btn"
                  onClick={handleLogin}
                  className="bg-primary hover:bg-white hover:text-primary text-surface px-12 py-6 text-2xl font-esports font-black uppercase tracking-widest transition-all duration-300 transform hover:scale-105 shadow-[0_0_30px_rgba(250,204,21,0.3)]"
                  style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
                >
                  ENTER THE COLONY
                </button>
                
                {showTestForm ? (
                   <form onSubmit={handleTestLogin} className="flex flex-col gap-2 p-4 bg-surface-charcoal border border-primary/20 rounded w-full">
                     <input type="email" placeholder="Email (test)" value={testEmail} onChange={e => setTestEmail(e.target.value)} className="bg-transparent border border-primary/20 p-2 text-xs text-on-surface" />
                     <input type="password" placeholder="Password (test)" value={testPass} onChange={e => setTestPass(e.target.value)} className="bg-transparent border border-primary/20 p-2 text-xs text-on-surface" />
                     <button type="submit" className="bg-primary/20 hover:bg-primary text-on-surface p-2 text-xs uppercase font-bold tracking-widest">Login</button>
                   </form>
                ) : (
                  <button onClick={() => setShowTestForm(true)} className="text-[10px] text-on-surface-variant/40 hover:text-primary uppercase tracking-widest font-mono">
                    Developer Access
                  </button>
                )}
              </div>
            ) : (
              <Link 
                id="tour-submit-btn"
                to="/submit"
                className="bg-primary hover:bg-white hover:text-primary text-surface px-12 py-6 text-2xl font-esports font-black uppercase tracking-widest transition-all duration-300 transform hover:scale-105 shadow-[0_0_30px_rgba(250,204,21,0.3)]"
                style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
              >
                REPORT SCORE
              </Link>
            )}
            <Link 
             id="tour-rankings-btn"
             to="/arena"
             className="bg-transparent border-4 border-primary/40 hover:border-primary text-on-surface px-12 py-6 text-2xl font-esports font-black uppercase tracking-widest transition-all duration-300 transform hover:scale-105"
             style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}
            >
              RANKINGS
            </Link>
          </motion.div>

          {/* Mobile Kogane */}
          <div className="xl:hidden mb-12">
            <Kogane size={80} speech={koganeSpeech} />
          </div>

          <motion.div variants={itemVariants} className="mb-12 flex justify-center">
            <SeasonCountdown className="scale-90 md:scale-100" />
          </motion.div>

          <motion.button
            variants={itemVariants}
            onClick={handleOpenRules}
            className="text-xl font-esports font-bold uppercase tracking-[0.4em] text-white/40 hover:text-primary transition-all flex items-center gap-4 group mb-12"
          >
            <Scroll className="group-hover:rotate-12 transition-transform" />
            CONSULT THE BINDING VOWS
            {hasNewRule && (
              <div className="relative flex items-center justify-center">
                <span className="absolute w-6 h-6 bg-primary/30 rounded-full animate-ping"></span>
                <span className="relative w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_#facc15] border border-white/20"></span>
              </div>
            )}
          </motion.button>

          <motion.div variants={itemVariants} className="w-full mb-16">
            <GrandLeaderboard />
          </motion.div>

          {user && (
            <>
              <motion.div variants={itemVariants} className="w-full mb-16">
                <DailyMissions />
              </motion.div>
              <motion.div variants={itemVariants} className="w-full mb-16">
                <WorkspaceTools />
              </motion.div>
            </>
          )}

          <motion.div variants={itemVariants} className="w-full mb-16">
            <WeeklyLeaderboard />
          </motion.div>

          <motion.div variants={itemVariants} className="w-full mb-16">
            <TopArchivists />
          </motion.div>

          <motion.div variants={itemVariants} className="w-full mb-16">
            <RecentActivity />
          </motion.div>

          <motion.div variants={itemVariants} className="w-full">
            <ScholarsWisdom />
          </motion.div>

          <motion.div variants={itemVariants} className="w-full">
            <BookRecommendations />
          </motion.div>
        </motion.div>
      </section>

      {/* Cursed Techniques Section */}
      <section className="py-40 px-6 relative z-10 bg-surface-charcoal border-t border-primary/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
             <h2 className="text-5xl md:text-7xl font-esports font-black text-on-surface italic uppercase tracking-tighter mb-4">REASONING TECHNIQUES</h2>
             <div className="w-24 h-2 bg-primary mx-auto esports-edge-flat"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <Zap />,
                title: "BLACK FLASH FOCUS",
                description: "Enter a state of complete immersion. Readers who hit 'Black Flash' earn 2.5x points for their submissions."
              },
              {
                icon: <BookOpen />,
                title: "DOMAIN EXPANSION",
                description: "Establish your own reading ritual. Your profile is your innate domain—refine it to dominate the rankings."
              },
              {
                icon: <Sword />,
                title: "TECHNIQUE EXTRACTION",
                description: "Extract the core themes of every tome. Kogane judges the depth of your analysis. No shallow reading allowed."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-12 group border border-white/5 bg-black/40 hover:border-primary/40 transition-colors relative overflow-hidden"
                style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)' }}
              >
                <div className="absolute -right-4 -top-4 text-primary/5 group-hover:text-primary/10 transition-colors">
                  {React.cloneElement(feature.icon as React.ReactElement<any>, { size: 180 })}
                </div>
                <div className="text-primary mb-8 group-hover:scale-125 transition-transform duration-500 transform -rotate-6">
                  {React.cloneElement(feature.icon as React.ReactElement<any>, { size: 64, strokeWidth: 3 })}
                </div>
                <h3 className="text-4xl font-esports font-black text-on-surface mb-6 uppercase italic tracking-tight relative z-10">
                   {feature.title}
                </h3>
                <p className="text-on-surface-variant font-bold leading-relaxed relative z-10">
                  {feature.description}
                </p>
                <div className="absolute top-0 right-0 w-12 h-12 bg-primary/20 flex items-center justify-center font-esports font-black text-on-surface italic">
                    T{i + 1}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rankings Preview */}
      <section className="py-32 border-t-8 border-primary bg-surface relative overflow-hidden">
        <div className="className-aura"></div>
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-12 relative z-10">
          {[
            { label: "SORCERERS REGISTERED", value: "1.2K" },
            { label: "POINTS DISTRIBUTED", value: "854K" },
            { label: "PAGES EXORCISED", value: "2.4M" }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center md:items-start group">
              <span className="text-7xl md:text-9xl font-esports font-black text-on-surface italic tracking-tighter leading-none mb-4 digital-glow group-hover:text-primary transition-colors">
                {stat.value}
              </span>
              <span className="text-xl font-esports font-bold tracking-[0.4em] text-secondary uppercase">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
