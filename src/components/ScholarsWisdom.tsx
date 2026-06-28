import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Quote, RefreshCw, Sparkles, BookMarked, HelpCircle, AlertCircle } from 'lucide-react';

interface QuoteData {
  text: string;
  author: string;
  source?: string;
  commentary?: string;
  technique?: string;
}

// Curated literature/scholarly quotes for guaranteed beautiful fallbacks & fallback rotation
const FALLBACK_QUOTES: QuoteData[] = [
  {
    text: "That I may detect the inmost force which binds the world, and guides its course.",
    author: "Johann Wolfgang von Goethe",
    source: "Faust",
    commentary: "Mastery of reading is the ultimate binding vow of reality. Study with absolute devotion.",
    technique: "VOW LAWS"
  },
  {
    text: "Deep into that darkness peering, long I stood there wondering, fearing, doubting, dreaming dreams no mortal ever dared to dream before.",
    author: "Edgar Allan Poe",
    source: "The Raven",
    commentary: "Immersion within the abyss of the unknown resides at the core of heavy intellect.",
    technique: "ABYSS COGNITION"
  },
  {
    text: "The mind is its own place, and in itself can make a heaven of hell, a hell of heaven.",
    author: "John Milton",
    source: "Paradise Lost",
    commentary: "Your consciousness alone defines the battlefield of the reading colony.",
    technique: "INNATE SPHERE"
  },
  {
    text: "You seek for knowledge and wisdom, as I once did; and I ardently hope that the gratification of your wishes may not be a serpent to sting you.",
    author: "Mary Shelley",
    source: "Frankenstein",
    commentary: "Knowledge is a powerful force of creation and curse alike. Cultivate it wisely.",
    technique: "COVENANT DREAD"
  },
  {
    text: "He who fights with monsters should look to it that he himself does not become a monster. And if you gaze long into an abyss, the abyss also gazes into you.",
    author: "Friedrich Nietzsche",
    source: "Thus Spoke Zarathustra",
    commentary: "The reader and the tome are locked in mutual observation. True wisdom arises from this struggle.",
    technique: "ECHO REFLECTION"
  },
  {
    text: "There are more things in heaven and earth, Horatio, than are dreamt of in your philosophy.",
    author: "William Shakespeare",
    source: "Hamlet",
    commentary: "Standard cognitive parameters are heavily limited. Seek works outside your comfort zone.",
    technique: "HORIZON BEYOND"
  },
  {
    text: "Consider your origin. You were not formed to live like brutes, but to follow virtue and knowledge.",
    author: "Dante Alighieri",
    source: "The Divine Comedy",
    commentary: "To read is to cultivate spirit. Rise from a simple colony contender to a sovereign elite.",
    technique: "ASCENT METHOD"
  },
  {
    text: "The oldest and strongest emotion of mankind is fear, and the oldest and strongest fear is fear of the unknown.",
    author: "H.P. Lovecraft",
    source: "Supernatural Horror in Literature",
    commentary: "True breakthroughs occur when we face absolute mystery. Accept fear as fuel for insight.",
    technique: "OCCULT FOCUS"
  }
];

// Generates an anime/sorcery-styled technique name for random quotes
const GENERATE_TECHNIQUES = [
  'DOMAIN RESONANCE',
  'CURSED CHRONICLE',
  'SOUL ALIGNMENT',
  'RECONSTRUCTED VOID',
  'INFINITE INSIGHT',
  'LIMITLESS PAGES',
  'ECHO CHAMBER',
  'SATORI PROTOCOL',
  'TOME REFRACTION'
];

// Lore-friendly scholarly commentaries based on general quotes
const GENERATE_COMMENTARIES = [
  "This wisdom anchors your focus in the deep currents of human literature. Harness it to conquer your current chapters.",
  "An incantation that stabilizes a reader's mind against distraction. Read with relentless intensity.",
  "A high-level binding vow of comprehension. Let this perspective dissolve standard limits of study.",
  "This historical observation aligns your cognitive parameters with those of ancient library masters.",
  "Your analytical aura flares upon confronting this truth. Memorize its structure to guard your domain."
];

export const ScholarsWisdom: React.FC = () => {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isApiSourced, setIsApiSourced] = useState(false);

  const fetchQuote = async () => {
    setLoading(true);
    setRevealed(false);
    setIsApiSourced(false);

    try {
      // Fetch a random quote from ZenQuotes via AllOrigins proxy to bypass CORS
      const url = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://zenquotes.io/api/random')}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Network response failed');
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0 && data[0].q) {
        const rawQuote = data[0];
        
        // Pick a random technique and commentary for the dynamic quote to match the app's Jujutsu lore!
        const randomTech = GENERATE_TECHNIQUES[Math.floor(Math.random() * GENERATE_TECHNIQUES.length)];
        const randomCommentary = GENERATE_COMMENTARIES[Math.floor(Math.random() * GENERATE_COMMENTARIES.length)];

        setQuote({
          text: rawQuote.q,
          author: rawQuote.a || 'Unknown Scholar',
          source: 'External Codex',
          technique: randomTech,
          commentary: randomCommentary
        });
        setIsApiSourced(true);
      } else {
        throw new Error('Unexpected API format');
      }
    } catch (error) {
      // Fallback: Pick a beautiful curated quote deterministically or randomly based on refresh index
      const fallbackIndex = (new Date().getDate() + refreshCount) % FALLBACK_QUOTES.length;
      setQuote(FALLBACK_QUOTES[fallbackIndex]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [refreshCount]);

  if (!quote) return null;

  return (
    <div 
      id="scholars-wisdom-covenant"
      className="w-full max-w-4xl mx-auto my-16 p-8 md:p-12 bg-black/50 border-2 border-primary/20 relative overflow-hidden transition-all hover:border-primary/40 group/quote shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
      style={{ clipPath: 'polygon(0 0, 100% 0, 97% 100%, 3% 100%)' }}
    >
      {/* Decorative magical grids & glows */}
      <div className="absolute inset-0 domain-grid-bg opacity-[0.04] pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-secondary/5 blur-3xl pointer-events-none" />

      {/* Futuristic borders */}
      <div className="absolute top-0 left-0 w-8 h-[2px] bg-primary/40" />
      <div className="absolute top-0 left-0 w-[2px] h-8 bg-primary/40" />
      <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-primary/40" />
      <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-primary/40" />

      <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center gap-8 md:gap-12">
        
        {/* Quote graphic marker */}
        <div className="flex flex-col items-center justify-center text-center self-center flex-shrink-0">
          <div className="relative p-5 bg-primary/10 border border-primary/25 rounded-none">
            <Quote size={28} className="text-primary transform -scale-x-100 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary rounded-none rotate-45 animate-pulse" />
          </div>
          
          <button
            onClick={() => setRefreshCount(prev => prev + 1)}
            disabled={loading}
            className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-primary/10 border border-white/15 hover:border-primary/30 text-[9px] text-white/50 hover:text-primary uppercase tracking-wider font-mono font-black transition-all cursor-pointer disabled:opacity-40"
          >
            <RefreshCw size={10} className={`${loading ? 'animate-spin' : ''}`} />
            REFRESH
          </button>
        </div>

        {/* Content Box */}
        <div className="flex-grow space-y-5">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase font-esports tracking-[0.4em] text-primary font-black italic">
                SCHOLAR'S WISDOM
              </span>
              <span className="h-px w-10 bg-primary/25 hidden sm:block" />
              <span className="text-[8px] px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary font-mono uppercase tracking-widest font-black">
                {isApiSourced ? 'Live Codex Feed' : 'Local Archive'}
              </span>
            </div>
            
            {quote.technique && (
              <div className="px-3 py-1 bg-secondary/5 border border-secondary/20 text-[8px] uppercase font-mono font-black italic tracking-widest text-secondary/80">
                TECHNIQUE: {quote.technique}
              </div>
            )}
          </header>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-6 flex flex-col justify-center items-center gap-2"
              >
                <div className="h-6 w-3/4 bg-white/5 animate-pulse" />
                <div className="h-6 w-1/2 bg-white/5 animate-pulse" />
                <span className="text-[8px] text-white/30 uppercase tracking-widest font-mono font-black mt-4">
                  DECRYPTING HIGH-GRADE COGNITION...
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="quote-content"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <blockquote className="text-lg md:text-xl font-serif font-black italic leading-relaxed text-on-surface text-center md:text-left">
                  "{quote.text}"
                </blockquote>
                
                <cite className="block text-right text-xs uppercase font-sans tracking-[0.2em] font-bold text-primary/60 not-italic">
                  — {quote.author} {quote.source && quote.source !== 'External Codex' ? `, ` : ''}
                  {quote.source && quote.source !== 'External Codex' && (
                    <span className="text-on-surface underline decoration-primary/30 decoration-dashed">{quote.source}</span>
                  )}
                </cite>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-[1px] bg-primary/10" />

          {/* Interactive contemplative insight expander */}
          <div className="pt-2">
            {!revealed ? (
              <button 
                onClick={() => setRevealed(true)}
                className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-secondary hover:text-white transition-all cursor-pointer font-esports italic disabled:opacity-40"
                disabled={loading}
              >
                <Sparkles size={11} className="text-secondary animate-bounce" /> CONTEMPLATION INSIGHT [EXTRACTENERGY]
              </button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/5 border border-primary/15 p-4 italic text-xs uppercase font-bold tracking-widest leading-relaxed text-on-surface-variant/90"
              >
                <div className="text-[9px] text-primary font-black mb-1.5 tracking-[0.3em] font-esports">
                  RECONSTRUCTED SIGNIFICANCE / KOGANE INTELLIGENCE
                </div>
                "{quote.commentary || "A high-grade cognitive seal. Reflect on these literary formulas to balance your reading speed and comprehension aura."}"
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
