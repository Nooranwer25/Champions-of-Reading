import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Quote, RefreshCw, Sparkles } from 'lucide-react';

interface QuoteData {
  id: string;
  text: string;
  author: string;
  source: string;
  commentary: string;
  technique: string;
}

const SCHOLARLY_QUOTES: QuoteData[] = [
  {
    id: "quote_goethe",
    text: "That I may detect the inmost force which binds the world, and guides its course.",
    author: "Johann Wolfgang von Goethe",
    source: "Faust",
    commentary: "A technique which seeks the fundamental laws of energy. Mastery of reading is the ultimate binding vow of reality.",
    technique: "VOW LAWS"
  },
  {
    id: "quote_poe",
    text: "Deep into that darkness peering, long I stood there wondering, fearing, doubting, dreaming dreams no mortal ever dared to dream before.",
    author: "Edgar Allan Poe",
    source: "The Raven",
    commentary: "Immersion within the abyss of the unknown resides at the core of heavy intellect. Let raw curiosity feed focus.",
    technique: "ABYSS COGNITION"
  },
  {
    id: "quote_milton",
    text: "The mind is its own place, and in itself can make a heaven of hell, a hell of heaven.",
    author: "John Milton",
    source: "Paradise Lost",
    commentary: "The ultimate blueprint for domain refinement. Your consciousness alone defines the battlefield of the reading colony.",
    technique: "INNATE SPHERE"
  },
  {
    id: "quote_shelley",
    text: "You seek for knowledge and wisdom, as I once did; and I ardently hope that the gratification of your wishes may not be a serpent to sting you.",
    author: "Mary Shelley",
    source: "Frankenstein",
    commentary: "Knowledge is a powerful force of creation and curse alike. Refine your technique with severe devotion.",
    technique: "COVENANT DREAD"
  },
  {
    id: "quote_nietzsche",
    text: "He who fights with monsters should look to it that he himself does not become a monster. And if you gaze long into an abyss, the abyss also gazes into you.",
    author: "Friedrich Nietzsche",
    source: "Thus Spoke Zarathustra",
    commentary: "The reader and the tome are locked in mutual observation. True wisdom arises when you embrace the complexity of the struggle.",
    technique: "ECHO REFLECTION"
  },
  {
    id: "quote_shakespeare",
    text: "There are more things in heaven and earth, Horatio, than are dreamt of in your philosophy.",
    author: "William Shakespeare",
    source: "Hamlet",
    commentary: "A reminder that standard cognitive parameters are heavily limited. Seek works outside your comfort comfort zones.",
    technique: "HORIZON BEYOND"
  },
  {
    id: "quote_dante",
    text: "Consider your origin. You were not formed to live like brutes, but to follow virtue and knowledge.",
    author: "Dante Alighieri",
    source: "The Divine Comedy: Inferno",
    commentary: "To read is to cultivate spirit. Rise from a simple colony contender to a sovereign elite through continuous conquest.",
    technique: "ASCENT METHOD"
  },
  {
    id: "quote_lovecraft",
    text: "The oldest and strongest emotion of mankind is fear, and the oldest and strongest fear is fear of the unknown.",
    author: "H.P. Lovecraft",
    source: "The Call of Cthulhu",
    commentary: "True breakthroughs occur when we face absolute mystery. Accept the fear as fuel for profound intellectual insights.",
    technique: "OCCULT FOCUS"
  },
  {
    id: "quote_aurelius",
    text: "The soul becomes dyed with the color of its thoughts.",
    author: "Marcus Aurelius",
    source: "Meditations",
    commentary: "Every conquered chapter alters the composite index of your mind. Choose your reading subjects deliberately.",
    technique: "AURAL DECORATIVE"
  },
  {
    id: "quote_wilde",
    text: "The books that the world calls immoral are books that show the world its own shame.",
    author: "Oscar Wilde",
    source: "The Picture of Dorian Gray",
    commentary: "Deep resonance requires confronting difficult truths. Analyze texts in their rawest, least censored states.",
    technique: "MIRROR REVELATION"
  }
];

export const ScholarlyQuote: React.FC = () => {
  const [selectedQuote, setSelectedQuote] = useState<QuoteData | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Get quote based on the current day's index to make it static per calendar date
    const today = new Date();
    const day = today.getDate();
    const index = (day + today.getMonth()) % SCHOLARLY_QUOTES.length;
    setSelectedQuote(SCHOLARLY_QUOTES[index]);
  }, []);

  if (!selectedQuote) return null;

  return (
    <div 
      id="scholarly-quote-covenant"
      className="w-full max-w-4xl mx-auto my-16 p-8 md:p-12 bg-black/40 border-2 border-primary/20 relative overflow-hidden transition-all hover:border-primary/40 group/quote shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
      style={{ clipPath: 'polygon(0 0, 100% 0, 97% 100%, 3% 100%)' }}
    >
      {/* Dynamic Grid Background Accent */}
      <div className="absolute inset-0 domain-grid-bg opacity-[0.05] pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-secondary/5 blur-3xl pointer-events-none" />

      {/* Decorative corners & sidebars */}
      <div className="absolute top-0 left-0 w-8 h-[2px] bg-primary/40" />
      <div className="absolute top-0 left-0 w-[2px] h-8 bg-primary/40" />
      <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-primary/40" />
      <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-primary/40" />

      <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center gap-8 md:gap-12">
        {/* Left icon section */}
        <div className="flex flex-col items-center justify-center text-center self-center flex-shrink-0">
          <div className="relative p-5 bg-primary/10 border border-primary/25 rounded-none animate-pulse">
            <Quote size={28} className="text-primary transform -scale-x-100" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary-coral rounded-none rotate-45" />
          </div>
          <span className="text-[8px] tracking-[0.3em] font-mono text-primary/40 font-black mt-3 uppercase italic">
            Day {new Date().getDate()} Decrypt
          </span>
        </div>

        {/* Core content */}
        <div className="flex-grow space-y-5">
          <header className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase font-esports tracking-[0.4em] text-primary/70 font-black italic">
                Daily Scholarly Vow
              </span>
              <span className="h-px w-10 bg-primary/25" />
            </div>
            <div className="px-3 py-1 bg-secondary/5 border border-secondary/20 text-[8px] uppercase font-mono font-black italic tracking-widest text-secondary/70">
              TECHNIQUE: {selectedQuote.technique}
            </div>
          </header>

          <div className="space-y-3">
            <blockquote className="text-xl md:text-2xl font-serif font-black italic leading-relaxed text-on-surface text-center md:text-left">
              "{selectedQuote.text}"
            </blockquote>
            
            <cite className="block text-right text-xs uppercase font-sans tracking-[0.2em] font-bold text-primary/60 not-italic">
              — {selectedQuote.author}, <span className="text-on-surface select-all underline decoration-primary/30 decoration-dashed">{selectedQuote.source}</span>
            </cite>
          </div>

          <div className="h-[1px] bg-primary/10" />

          {/* Interactive contemplative insight expander */}
          <div className="pt-2">
            {!revealed ? (
              <button 
                onClick={() => setRevealed(true)}
                className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-secondary hover:text-white transition-all cursor-pointer font-esports italic"
              >
                <Sparkles size={11} className="text-secondary animate-bounce" /> Contemplation Insight [Extract Energy]
              </button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/5 border border-primary/15 p-4 italic text-xs uppercase font-bold tracking-widest leading-relaxed text-on-surface-variant/90"
              >
                <div className="text-[9px] text-primary font-black mb-1 tracking-[0.3em] font-esports">RECONSTRUCTED SIGNIFICANCE / KOGANE INTELLIGENCE</div>
                "{selectedQuote.commentary}"
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
