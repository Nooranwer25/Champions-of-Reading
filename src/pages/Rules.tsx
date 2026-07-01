import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Trophy, Swords, Zap, HelpCircle, ShieldCheck, Scroll } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Rules: React.FC = () => {
  const [leagueRules, setLeagueRules] = useState<string>('');

  useEffect(() => {
    // Update last seen rule time
    localStorage.setItem('lastSeenRuleTime', Date.now().toString());

    const fetchRules = async () => {
      try {
        const docRef = doc(db, 'config', 'league_rules');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLeagueRules(docSnap.data().content || '');
        }
      } catch (err) {
        console.error("Failed to fetch rules", err);
      }
    };
    fetchRules();
  }, []);

  return (
    <div className="min-h-screen bg-surface px-6 pb-24 font-sans text-on-surface">
      <div className="max-w-4xl mx-auto pt-12 space-y-24">
        
        {/* Header */}
        <div className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-esports font-black italic uppercase tracking-tighter text-on-surface mb-6 digital-glow"
          >
            The <span className="text-primary">Protocols</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-on-surface-variant font-medium max-w-2xl mx-auto italic"
          >
            "A sorcerer's growth is defined by their knowledge. The Culling Games of Reading are designed to push you beyond your limits."
          </motion.p>
        </div>

        {/* Tutorial Section */}
        <section className="space-y-12">
          <div className="flex items-center gap-4 mb-8">
            <Zap className="text-primary w-8 h-8" />
            <h2 className="text-3xl font-esports italic uppercase tracking-widest">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-surface-charcoal border-2 border-primary/20 p-8 hover:border-primary/50 transition-colors shadow-lg"
              style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}
            >
              <BookOpen className="text-primary w-8 h-8 mb-4" />
              <h3 className="text-xl font-black uppercase tracking-wide mb-3">1. Conquer Tomes</h3>
              <p className="text-on-surface-variant/80 text-sm leading-relaxed">
                Read books and expand your knowledge. Every book you finish is a victory. Head to the <span className="text-primary font-bold">Submission</span> page to log your conquered tomes.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-surface-charcoal border-2 border-secondary/20 p-8 hover:border-secondary/50 transition-colors shadow-lg"
              style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}
            >
              <ShieldCheck className="text-secondary w-8 h-8 mb-4" />
              <h3 className="text-xl font-black uppercase tracking-wide mb-3">2. Oracle's Judgment</h3>
              <p className="text-on-surface-variant/80 text-sm leading-relaxed">
                Once submitted, Kogane (The Oracle) will review your insights. A thorough assessment yields higher Cursed Energy points and impact scores.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-surface-charcoal border-2 border-accent/20 p-8 hover:border-accent/50 transition-colors shadow-lg"
              style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}
            >
              <Swords className="text-accent w-8 h-8 mb-4" />
              <h3 className="text-xl font-black uppercase tracking-wide mb-3">3. Ascend Ranks</h3>
              <p className="text-on-surface-variant/80 text-sm leading-relaxed">
                Accumulate points to climb the Global Leaderboards in the <span className="text-accent font-bold">Arena</span>. Prove yourself against other champions.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-surface-charcoal border-2 border-primary/20 p-8 hover:border-primary/50 transition-colors shadow-lg"
              style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}
            >
              <Trophy className="text-primary w-8 h-8 mb-4" />
              <h3 className="text-xl font-black uppercase tracking-wide mb-3">4. Unlock Crests</h3>
              <p className="text-on-surface-variant/80 text-sm leading-relaxed">
                Reach milestones (number of books read) to unlock Sovereign Badges. Equip these crests on your <span className="text-primary font-bold">Profile</span> to show off your rank.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Dynamic Rules from DB */}
        {leagueRules && (
          <section className="space-y-12">
            <div className="flex items-center gap-4 mb-8">
              <Scroll className="text-primary w-8 h-8" />
              <h2 className="text-3xl font-esports italic uppercase tracking-widest">The Binding Vows</h2>
            </div>
            
            <div className={`prose prose-invert prose-lg max-w-none text-on-surface-variant/80 font-sans font-medium leading-relaxed italic prose-h3:text-primary prose-h3:font-esports prose-h3:uppercase prose-h3:tracking-widest prose-h3:text-sm prose-h3:mb-2 prose-h3:mt-8 first:prose-h3:mt-0 bg-surface-charcoal/50 p-8 md:p-12 border border-primary/20 shadow-[0_0_30px_rgba(250,204,21,0.05)]`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {leagueRules}
              </ReactMarkdown>
            </div>
          </section>
        )}

        {/* FAQs */}
        <section className="space-y-12">
          <div className="flex items-center gap-4 mb-8">
            <HelpCircle className="text-secondary w-8 h-8" />
            <h2 className="text-3xl font-esports italic uppercase tracking-widest">F.A.Q.</h2>
          </div>

          <div className="space-y-6">
            <FAQItem 
              question="What is Cursed Energy?" 
              answer="Cursed Energy is the point system of the tournament. You earn it by submitting books you've read. The longer the book and the better your assessment, the more energy you generate."
            />
            <FAQItem 
              question="Who is Kogane / The Oracle?" 
              answer="Kogane is an AI judge that reviews your book submissions. It calculates your Cursed Energy points and assigns an Impact Score based on the depth of your written assessment."
            />
            <FAQItem 
              question="Can I read any genre of books?" 
              answer="Yes! All genres are permitted. However, Kogane might reward complex non-fiction or epic fantasy with a higher Impact Score depending on your insights."
            />
            <FAQItem 
              question="What happens if I forget to log my reading duration?" 
              answer="You can still submit your book! We added reading duration to help you track your reading speed (pages per hour), but you can estimate it or leave it as the default 60 minutes."
            />
            <FAQItem 
              question="How do I unlock Special Grade?" 
              answer="Special Grade is reserved for champions who have conquered 50 or more tomes. Keep reading consistently to reach this legendary status."
            />
          </div>
        </section>

      </div>
    </div>
  );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-black/40 border border-primary/20 overflow-hidden"
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-bold text-lg">{question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <Zap className="w-5 h-5 text-primary" />
        </motion.div>
      </button>
      <motion.div 
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden bg-primary/5"
      >
        <div className="p-6 pt-0 text-on-surface-variant leading-relaxed">
          {answer}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Rules;
