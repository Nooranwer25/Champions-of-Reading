import React, { useState, useMemo } from 'react';
import { Submission, BookCategory, SubmissionStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Calendar, Clock, Sparkles, Award, Star, ListFilter, Activity, Compass } from 'lucide-react';
import { useTheme } from '../services/ThemeContext';

interface ReadingTimelineProps {
  submissions: Submission[];
}

export const ReadingTimeline: React.FC<ReadingTimelineProps> = ({ submissions }) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'journey' | 'feed'>('journey');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Parse Date helper
  const parseDate = (createdAt: any): Date => {
    if (!createdAt) return new Date();
    if (typeof createdAt.toDate === 'function') {
      return createdAt.toDate();
    }
    if (createdAt.seconds) {
      return new Date(createdAt.seconds * 1000);
    }
    const d = new Date(createdAt);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // Generate the last 30 days array
  const last30Days = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    return days;
  }, []);

  // Format date helper to matching key "YYYY-MM-DD"
  const getLocalDateKey = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Group submissions by local date key
  const groupedSubmissions = useMemo(() => {
    const groups: { [key: string]: Submission[] } = {};
    submissions.forEach((sub) => {
      // Apply optional filter category
      if (filterCategory !== 'ALL' && sub.category !== filterCategory) return;

      const dateObj = parseDate(sub.createdAt);
      const key = getLocalDateKey(dateObj);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(sub);
    });
    return groups;
  }, [submissions, filterCategory]);

  // Map the last 30 days to check for activity
  const timelineDays = useMemo(() => {
    return last30Days.map((date) => {
      const key = getLocalDateKey(date);
      const daySubmissions = groupedSubmissions[key] || [];
      const totalPages = daySubmissions.reduce((sum, s) => sum + (Number(s.pagesRead) || 0), 0);
      const points = daySubmissions.reduce((sum, s) => sum + (Number(s.pointsEarned) || 0), 0);
      
      return {
        date,
        key,
        hasActivity: daySubmissions.length > 0,
        submissions: daySubmissions,
        totalPages,
        points,
      };
    });
  }, [last30Days, groupedSubmissions]);

  // List of only active submissions in the last 30 days (newest first)
  const activeTimelineSubmissions = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    return submissions
      .map(sub => ({
        ...sub,
        parsedDate: parseDate(sub.createdAt)
      }))
      .filter(sub => {
        // Must be within last 30 days
        const isInTimeframe = sub.parsedDate.getTime() >= cutoffDate.getTime();
        // Check filter category
        const matchesCategory = filterCategory === 'ALL' || sub.category === filterCategory;
        return isInTimeframe && matchesCategory;
      })
      .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime()); // Newest first
  }, [submissions, filterCategory]);

  const getCategoryTheme = (category: BookCategory) => {
    switch (category) {
      case BookCategory.NOVEL:
        return {
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        };
      case BookCategory.POETRY:
        return {
          glow: 'shadow-[0_0_15px_rgba(99,102,241,0.3)]',
          border: 'border-indigo-500/30',
          bg: 'bg-indigo-500/10',
          text: 'text-indigo-400',
          badge: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
        };
      case BookCategory.NON_FICTION:
        return {
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
          border: 'border-amber-500/30',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          badge: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
        };
      default:
        return {
          glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
          border: 'border-purple-500/30',
          bg: 'bg-purple-500/10',
          text: 'text-purple-400',
          badge: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
        };
    }
  };

  const activeDaysCount = useMemo(() => {
    return timelineDays.filter(d => d.hasActivity).length;
  }, [timelineDays]);

  const totalPagesIn30Days = useMemo(() => {
    return timelineDays.reduce((sum, d) => sum + d.totalPages, 0);
  }, [timelineDays]);

  const totalPointsIn30Days = useMemo(() => {
    return timelineDays.reduce((sum, d) => sum + d.points, 0);
  }, [timelineDays]);

  return (
    <motion.div
      id="reading-timeline-wrapper"
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative w-full border p-6 md:p-8 mb-16 overflow-hidden ${
        theme === 'dark' 
          ? 'bg-neutral-900/40 border-primary/20 text-white' 
          : 'bg-white border-black/10 text-neutral-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
      }`}
      style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
    >
      {/* Decorative grids */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 mb-8 border-b border-primary/10">
        <div>
          <div className="flex items-center gap-3">
            <Activity className="text-secondary animate-pulse" size={20} />
            <h4 className="text-xl font-esports italic uppercase tracking-tight">Vortex Temporal Line</h4>
          </div>
          <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-widest mt-1">
            Analyzing dynamic chronicle extraction and page conquest within the last 30 days
          </p>
        </div>

        {/* View Mode controls & Category Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeline View Selectors */}
          <div className="flex bg-neutral-950 border border-white/10 p-1">
            <button
              onClick={() => setViewMode('journey')}
              className={`px-3 py-1.5 text-[9px] font-esports font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'journey'
                  ? 'bg-secondary text-black font-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Journey Map
            </button>
            <button
              onClick={() => setViewMode('feed')}
              className={`px-3 py-1.5 text-[9px] font-esports font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'feed'
                  ? 'bg-secondary text-black font-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Archive Feed
            </button>
          </div>

          {/* Category Filter dropdown */}
          <div className="flex items-center gap-1.5 bg-neutral-950 border border-white/10 py-1.5 px-3">
            <ListFilter size={10} className="text-secondary" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent border-none text-white font-mono text-[10px] uppercase font-bold tracking-wider focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Manifests</option>
              <option value="NOVEL">Novels</option>
              <option value="POETRY">Poetry</option>
              <option value="NON-FICTION">Non-Fiction</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center gap-4 relative overflow-hidden group">
          <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg text-secondary group-hover:scale-110 transition-transform duration-300">
            <Calendar size={18} />
          </div>
          <div>
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">Active Extraction Days</span>
            <span className="text-xl font-esports font-black italic text-secondary leading-none mt-1 block">
              {activeDaysCount} <span className="text-xs font-mono font-bold text-white/30">/ 30 DAYS</span>
            </span>
          </div>
        </div>

        <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center gap-4 relative overflow-hidden group">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary group-hover:scale-110 transition-transform duration-300">
            <BookOpen size={18} />
          </div>
          <div>
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">Pages Transmuted</span>
            <span className="text-xl font-esports font-black italic text-primary leading-none mt-1 block">
              {totalPagesIn30Days.toLocaleString()} <span className="text-xs font-mono font-bold text-white/30">PGS</span>
            </span>
          </div>
        </div>

        <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center gap-4 relative overflow-hidden group">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 group-hover:scale-110 transition-transform duration-300">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">Accumulated Aura Energy</span>
            <span className="text-xl font-esports font-black italic text-purple-400 leading-none mt-1 block">
              +{totalPointsIn30Days} <span className="text-xs font-mono font-bold text-white/30">PTS</span>
            </span>
          </div>
        </div>
      </div>

      {/* Render Main Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'journey' ? (
          <motion.div
            key="journey"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <div className="mb-4">
              <h5 className="text-xs font-esports italic text-white/80 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Compass size={12} className="text-secondary" />
                Chronological Matrix Journey Map
              </h5>
              <p className="text-[10px] text-white/40 font-mono uppercase">
                A daily sequence starting 30 days ago (top left) leading to today (bottom right).
              </p>
            </div>

            {/* Grid display of 30 days */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
              {timelineDays.map((day, idx) => {
                const isToday = idx === 29;
                const dateLabel = day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const categoryColorClass = day.submissions.length > 0 
                  ? getCategoryTheme(day.submissions[0].category).text 
                  : '';
                const categoryGlowClass = day.submissions.length > 0 
                  ? getCategoryTheme(day.submissions[0].category).glow 
                  : '';

                return (
                  <motion.div
                    key={day.key}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.015, duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    className={`relative aspect-square flex flex-col justify-between p-2 rounded-lg border transition-all ${
                      day.hasActivity
                        ? `bg-neutral-950 border-secondary/30 ${categoryGlowClass}`
                        : `bg-neutral-950/20 border-white/5`
                    } ${isToday ? 'ring-2 ring-primary border-primary/60' : ''}`}
                  >
                    {/* Top Row: Date & Sequence Number */}
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] font-mono text-white/30">{idx + 1}</span>
                      <span className="text-[8px] font-mono font-bold text-white/50">{dateLabel}</span>
                    </div>

                    {/* Middle Content */}
                    <div className="flex flex-col items-center justify-center my-1">
                      {day.hasActivity ? (
                        <div className="flex flex-col items-center">
                          <BookOpen size={16} className={`${categoryColorClass} animate-pulse`} />
                          <span className={`text-[10px] font-esports font-bold italic mt-1 ${categoryColorClass}`}>
                            +{day.points}
                          </span>
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-white/5 border border-white/5" />
                      )}
                    </div>

                    {/* Hover Tooltip Info using local css peer */}
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-neutral-950/95 border border-secondary/50 rounded-lg p-2 flex flex-col justify-between z-20 transition-all pointer-events-none duration-200">
                      <div className="text-[7px] font-mono text-secondary uppercase tracking-widest border-b border-white/5 pb-1 flex justify-between">
                        <span>{day.key}</span>
                        {isToday && <span className="text-primary font-black">TODAY</span>}
                      </div>
                      {day.hasActivity ? (
                        <div className="flex flex-col gap-0.5 justify-center py-1">
                          <span className="text-[8px] font-serif italic text-white truncate max-w-full font-bold">
                            {day.submissions[0].bookTitle}
                          </span>
                          <span className="text-[7px] font-mono text-white/60">
                            {day.totalPages} pages read
                          </span>
                          <span className="text-[7px] font-mono text-white/40">
                            By {day.submissions[0].author}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[8px] font-mono text-white/30 italic text-center py-2 uppercase">
                          No Manifest Logs
                        </div>
                      )}
                      <div className="text-[6px] font-mono text-white/30 uppercase text-right">
                        {day.hasActivity ? 'DECIPHERED' : 'AWAITING'}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="feed"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full relative pl-6 md:pl-8 border-l border-white/10 space-y-6"
          >
            {activeTimelineSubmissions.length === 0 ? (
              <div className="py-12 text-center text-white/40 font-mono text-xs uppercase tracking-widest">
                No active extraction records logged in the past 30 days under this category.
              </div>
            ) : (
              activeTimelineSubmissions.map((sub, idx) => {
                const subTheme = getCategoryTheme(sub.category);
                const isApproved = sub.status === SubmissionStatus.APPROVED;

                return (
                  <motion.div
                    key={sub.submissionId}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{ delay: Math.min(idx * 0.05, 0.3), duration: 0.4 }}
                    className="relative"
                  >
                    {/* Glowing timeline node indicator */}
                    <div className="absolute -left-[31px] md:-left-[39px] top-4 w-4 h-4 rounded-full bg-neutral-950 border border-secondary/40 flex items-center justify-center z-10 shadow-[0_0_8px_rgba(163,230,53,0.3)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                    </div>

                    {/* Timeline card wrapper */}
                    <div 
                      className={`relative bg-neutral-950/40 border border-white/5 rounded-xl p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-neutral-950/60 hover:border-secondary/20`}
                    >
                      {/* Left: Cover & Info */}
                      <div className="flex gap-4 items-center min-w-0">
                        <div className="relative w-12 h-16 bg-black border border-white/10 rounded overflow-hidden flex-shrink-0 shadow-lg">
                          {sub.coverImageUrl ? (
                            <img referrerPolicy="no-referrer" src={sub.coverImageUrl} alt={sub.bookTitle} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                              <BookOpen className="text-white/20" size={20} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 border rounded uppercase ${subTheme.badge}`}>
                              {sub.category}
                            </span>
                            <div className="flex items-center gap-1 text-[9px] font-mono text-white/40">
                              <Clock size={10} />
                              <span>{sub.parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          </div>

                          <h5 className="text-sm font-serif italic font-black text-white leading-tight uppercase truncate max-w-[280px] md:max-w-[400px]">
                            {sub.bookTitle}
                          </h5>
                          <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-0.5">
                            By {sub.author}
                          </p>
                        </div>
                      </div>

                      {/* Right: Pages and Points */}
                      <div className="flex md:flex-col items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-none border-white/5">
                        <div className="flex flex-col items-start md:items-end mb-1">
                          <span className="text-[8px] uppercase tracking-wider text-white/40 font-mono">Conquest Extraction</span>
                          <span className="text-lg font-esports font-black italic text-secondary leading-none mt-0.5">
                            +{sub.pointsEarned} PTS
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-white/40 uppercase">
                          <span>{sub.pagesRead} Pages</span>
                          <span className="h-1 w-1 bg-white/20 rounded-full" />
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star size={10} fill="currentColor" />
                            <span>{sub.rating}/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
