import React, { useRef } from 'react';
import { useMotionValue, useTransform, useSpring, motion } from 'motion/react';
import { Star, BookOpen, Clock, Award, ShieldAlert, Sparkles, User } from 'lucide-react';
import { Submission, BookCategory } from '../types';
import { useTheme } from '../services/ThemeContext';

interface SubmissionCardProps {
  submission: Submission;
}

export const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission }) => {
  const { theme } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);

  // Framer Motion values for 3D rotation
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs to avoid jitter
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), { stiffness: 220, damping: 22 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), { stiffness: 220, damping: 22 });

  // Holographic glare tracking
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), { stiffness: 220, damping: 22 });
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), { stiffness: 220, damping: 22 });
  const glareOpacity = useSpring(useTransform(mouseX, [-0.5, 0.5], [0.1, 0.35]), { stiffness: 220, damping: 22 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Normalize coordinates between -0.5 and 0.5
    const relativeX = (event.clientX - rect.left) / width - 0.5;
    const relativeY = (event.clientY - rect.top) / height - 0.5;

    mouseX.set(relativeX);
    mouseY.set(relativeY);
  };

  const handleMouseLeave = () => {
    // Reset back to center smoothly
    mouseX.set(0);
    mouseY.set(0);
  };

  const getCategoryColor = (category: BookCategory) => {
    switch (category) {
      case BookCategory.NOVEL:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          glow: 'rgba(16, 185, 129, 0.15)',
          primary: 'text-emerald-400',
          solid: 'bg-emerald-500'
        };
      case BookCategory.POETRY:
        return {
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
          glow: 'rgba(99, 102, 241, 0.15)',
          primary: 'text-indigo-400',
          solid: 'bg-indigo-500'
        };
      case BookCategory.NON_FICTION:
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          glow: 'rgba(245, 158, 11, 0.15)',
          primary: 'text-amber-400',
          solid: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          glow: 'rgba(168, 85, 247, 0.15)',
          primary: 'text-purple-400',
          solid: 'bg-purple-500'
        };
    }
  };

  const colors = getCategoryColor(submission.category);
  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return 'Unknown';
  };

  return (
    <div 
      className="perspective-1000 w-full"
      style={{ perspective: '1200px' }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          boxShadow: `0 15px 35px -5px ${colors.glow}, 0 0 1px 1px rgba(255, 255, 255, 0.05)`
        }}
        className={`group relative w-full h-[410px] rounded-2xl border p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-neutral-900/95 border-white/5 hover:border-purple-500/20'
            : 'bg-white border-black/10 hover:border-purple-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
        }`}
      >
        {/* Specular Glare Overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: useTransform(
              [glareX, glareY],
              ([x, y]) => `radial-gradient(circle 220px at ${x}% ${y}%, rgba(255, 255, 255, 0.12), transparent 80%)`
            ),
            opacity: glareOpacity
          }}
        />

        {/* Diagonal Light Sweep */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-20"
          initial={{ x: '-100%', y: '-100%' }}
          whileHover={{ x: '100%', y: '100%' }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />

        {/* Card Header (Preserve 3D layered depth) */}
        <div 
          style={{ transform: 'translateZ(30px)' }}
          className="flex justify-between items-start z-10"
        >
          <span className={`text-[9px] font-esports font-bold tracking-widest px-2.5 py-1.5 border rounded-lg uppercase ${colors.bg}`}>
            {submission.category}
          </span>
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2.5 py-1.5 rounded-lg">
            <Star className="text-yellow-400" size={12} fill="currentColor" />
            <span className="font-mono text-xs font-black text-white">{submission.rating}/10</span>
          </div>
        </div>

        {/* Card Body (Book Cover & Title Layer with Parallax) */}
        <div className="flex gap-4 items-center my-4 z-10">
          {/* Cover image wrapper with separate 3D float */}
          <div 
            style={{ transform: 'translateZ(45px)' }}
            className={`relative w-20 h-28 flex-shrink-0 bg-black border rounded-xl overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.4)] ${
              theme === 'dark' ? 'border-white/10' : 'border-black/10'
            }`}
          >
            {submission.coverImageUrl ? (
              <img 
                referrerPolicy="no-referrer"
                src={submission.coverImageUrl} 
                alt={submission.bookTitle} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-800 to-neutral-950 p-2 text-center">
                <BookOpen className={`${colors.primary} mb-1 opacity-60`} size={20} />
                <span className="text-[7px] text-white/30 uppercase tracking-widest font-mono">Grimoire</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
          </div>

          {/* Book title and author info layer */}
          <div 
            style={{ transform: 'translateZ(35px)' }}
            className="flex-grow min-w-0"
          >
            <h4 className="text-xl font-serif italic font-black text-on-surface tracking-tight leading-tight uppercase group-hover:text-primary transition-colors line-clamp-2">
              {submission.bookTitle}
            </h4>
            <p className="text-[10px] text-on-surface-variant/70 font-semibold tracking-wider uppercase mt-1 line-clamp-1">
              By {submission.author}
            </p>
            <div className="flex items-center gap-1.5 text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-widest mt-2">
              <User size={10} />
              <span className="truncate max-w-[120px]">{submission.userName}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Inner Description Box */}
        <div 
          style={{ transform: 'translateZ(20px)' }}
          className={`flex-grow overflow-hidden rounded-xl p-3 border mb-4 text-[11px] leading-relaxed relative ${
            theme === 'dark' 
              ? 'bg-black/40 border-white/5 text-neutral-400' 
              : 'bg-neutral-50 border-black/5 text-neutral-600'
          }`}
        >
          <div className="absolute top-2 right-3 flex items-center gap-1 opacity-25">
            <Sparkles size={10} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-widest">Assessment</span>
          </div>
          <p className="line-clamp-4 pr-1 font-medium italic">
            "{submission.synopsis || 'This cursed book holds secrets awaiting decryption.'}"
          </p>
        </div>

        {/* Footer (Stats and Energy Extracted) */}
        <div 
          style={{ transform: 'translateZ(25px)' }}
          className="flex justify-between items-center pt-3 border-t border-white/5 z-10"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/60 font-bold uppercase">
              <BookOpen size={11} className="opacity-60" />
              <span className="font-mono">{submission.pagesRead || 0} p.</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/60 font-bold uppercase">
              <Clock size={11} className="opacity-60" />
              <span className="font-mono">{formatDate(submission.createdAt)}</span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[8px] uppercase tracking-wider text-on-surface-variant/50 font-bold">Energy Extracted</span>
            <span className={`font-esports font-black text-2xl italic digital-glow leading-none mt-0.5 ${colors.primary}`}>
              +{submission.pointsEarned}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
