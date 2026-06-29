import React, { useMemo, useState } from 'react';
import { Submission, SubmissionStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Gauge, Award, Clock, Flame, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

interface ReadingVelocityGaugeProps {
  submissions: Submission[];
}

interface VelocityTier {
  name: string;
  min: number;
  max: number;
  color: string;
  glow: string;
  stroke: string;
  bg: string;
  description: string;
  title: string;
}

const VELOCITY_TIERS: VelocityTier[] = [
  {
    name: 'Resting State',
    min: 0,
    max: 5,
    color: 'text-neutral-400',
    glow: 'shadow-neutral-500/20',
    stroke: '#a3a3a3',
    bg: 'bg-neutral-500/5 border-neutral-500/10',
    title: 'ACOLYTE DORMANT',
    description: 'Minimal activity. Gather your focus, or your cognitive domain will slowly crumble.'
  },
  {
    name: 'Steady Extraction',
    min: 5,
    max: 15,
    color: 'text-emerald-400',
    glow: 'shadow-emerald-500/30',
    stroke: '#34d399',
    bg: 'bg-emerald-500/5 border-emerald-500/10',
    title: 'STABLE SORCERER',
    description: 'Steady extraction. Controlled technique, healthy speed, and balanced consistency.'
  },
  {
    name: 'Rapid Combustion',
    min: 15,
    max: 30,
    color: 'text-amber-400',
    glow: 'shadow-amber-500/30',
    stroke: '#fbbf24',
    bg: 'bg-amber-500/5 border-amber-500/10',
    title: 'COMBUSTION MATRIX',
    description: 'Rapid combustion. High-friction ingestion of ancient books and sacred codices.'
  },
  {
    name: 'Hyperbaric Domain',
    min: 30,
    max: 60,
    color: 'text-orange-500',
    glow: 'shadow-orange-500/40',
    stroke: '#f97316',
    bg: 'bg-orange-500/5 border-orange-500/10',
    title: 'WARP-SPEED EXORCIST',
    description: 'Hyperbaric domain. Extreme mental synthesis. Cursed energy levels rising dangerously.'
  },
  {
    name: 'Infinite Void',
    min: 60,
    max: Infinity,
    color: 'text-pink-500',
    glow: 'shadow-pink-500/50',
    stroke: '#ec4899',
    bg: 'bg-pink-500/5 border-pink-500/10',
    title: 'TRANSCENDENT ARCHIVIST',
    description: 'Infinite Void. Boundless, absolute comprehension. The mortal cognitive limit has been shattered!'
  }
];

export const ReadingVelocityGauge: React.FC<ReadingVelocityGaugeProps> = ({ submissions }) => {
  const [timeframe, setTimeframe] = useState<30 | 7>(30);
  const [showTooltip, setShowTooltip] = useState(false);

  // Calculate pages and averages
  const { averagePagesPerDay, totalPagesInPeriod, approvedSubmissionsCount } = useMemo(() => {
    const periodMs = timeframe * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - periodMs;

    const approvedPeriodSubs = submissions.filter(sub => {
      if (sub.status !== SubmissionStatus.APPROVED) return false;
      let createdTime = 0;
      if (sub.createdAt) {
        if (typeof sub.createdAt.toMillis === 'function') {
          createdTime = sub.createdAt.toMillis();
        } else if (sub.createdAt.seconds) {
          createdTime = sub.createdAt.seconds * 1000;
        } else {
          createdTime = new Date(sub.createdAt).getTime();
        }
      }
      return createdTime >= cutoffTime;
    });

    const pages = approvedPeriodSubs.reduce((sum, s) => sum + (Number(s.pagesRead) || 0), 0);
    const rawAverage = pages / timeframe;
    const average = Math.round(rawAverage * 10) / 10; // Round to 1 decimal place

    return {
      averagePagesPerDay: average,
      totalPagesInPeriod: pages,
      approvedSubmissionsCount: approvedPeriodSubs.length
    };
  }, [submissions, timeframe]);

  // Determine current tier
  const currentTier = useMemo(() => {
    const tier = VELOCITY_TIERS.find(t => averagePagesPerDay >= t.min && averagePagesPerDay < t.max);
    return tier || VELOCITY_TIERS[0];
  }, [averagePagesPerDay]);

  // SVG Gauge calculations
  // Let's create an arc with radius 50. Total circumference is 2 * PI * 50 = 314.159
  // We represent a semi-circle (180 degrees), so total arc length of progress is half, which is 157.08
  // Or we do a 3/4 circle (270 degrees) for that retro speedo dial feel!
  // Let's do a 240-degree dial centered. Start at -210 degrees, end at 30 degrees.
  // Radius = 50. Circumference = 314.159.
  // Dasharray is 314.159.
  // 240 degrees is (240 / 360) * 314.159 = 209.44.
  // So the full gauge arc is 209.44 long, and we leave 104.72 gap.
  const r = 50;
  const circumference = 2 * Math.PI * r; // 314.159
  const arcLength = (240 / 360) * circumference; // 209.44
  const arcGap = circumference - arcLength; // 104.72

  // Map averagePagesPerDay (0 to 100 max display) to the 240-degree active arc
  const maxDisplayVal = 100;
  const clampedVal = Math.min(maxDisplayVal, averagePagesPerDay);
  const percentage = clampedVal / maxDisplayVal;
  const strokeDashoffset = arcLength * (1 - percentage);

  // Projections
  const pagesOneYear = Math.round(averagePagesPerDay * 365);
  const tomesOneYear = Math.round((pagesOneYear / 250) * 10) / 10; // 250 pages per book/tome average

  return (
    <motion.section
      id="reading-velocity-gauge"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-24 w-full bg-neutral-900/40 backdrop-blur-md border border-primary/20 p-8 md:p-10 relative overflow-hidden"
      style={{ clipPath: 'polygon(40px 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%)' }}
    >
      {/* Dynamic Aura background based on speed */}
      <div 
        className="absolute inset-0 opacity-10 blur-[120px] pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: currentTier.stroke }}
      />
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      {/* Decorative Golden Accents */}
      <div className="absolute top-0 left-0 w-[2px] h-8 bg-primary shadow-[0_0_8px_#F8E71C]" />
      <div className="absolute top-0 left-0 w-8 h-[2px] bg-primary shadow-[0_0_8px_#F8E71C]" />
      <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-primary shadow-[0_0_8px_#F8E71C]" />
      <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-primary shadow-[0_0_8px_#F8E71C]" />

      {/* Header section with toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 mb-10 border-b border-white/10 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <Gauge className="text-primary" size={24} />
            <h3 className="text-3xl font-esports italic text-on-surface uppercase tracking-tighter digital-glow">
              Reading Velocity
            </h3>
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-white/40 hover:text-white transition-colors cursor-help p-1"
                aria-label="Information about Reading Velocity"
              >
                <HelpCircle size={14} />
              </button>
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 bg-[#0a0a0c] border border-white/10 text-[11px] leading-relaxed text-white/80 rounded shadow-xl font-mono"
                  >
                    <p>
                      <strong>Reading Velocity</strong> is a real-time metrics engine measuring your average pages-per-day volume of SANCTIFIED (approved) records.
                    </p>
                    <p className="mt-2 text-primary">
                      Formula: Total approved pages in timeframe / number of days.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <span className="text-[10px] uppercase font-esports tracking-[0.3em] text-primary/40 font-black italic block mt-1">
            Real-time Cognitive Extraction speed matrix
          </span>
        </div>

        {/* Timeframe Selector */}
        <div className="flex bg-black/40 border border-white/5 p-1 rounded self-start md:self-auto">
          <button
            onClick={() => setTimeframe(30)}
            className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer ${
              timeframe === 30
                ? 'bg-primary text-black font-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeframe(7)}
            className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer ${
              timeframe === 7
                ? 'bg-primary text-black font-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            7 Days
          </button>
        </div>
      </div>

      {/* Main Grid: Gauge Dial and Tier Profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        
        {/* Left Column: Visual Speedometer Gauge */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-black/30 border border-white/5 p-8 rounded-2xl relative">
          
          <div className="relative w-56 h-56 flex items-center justify-center">
            
            {/* SVG Speedo Gauge */}
            <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
              <defs>
                {/* Dynamic glow filter inside SVG */}
                <filter id="gauge-glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="velocityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F8E71C" />
                  <stop offset="100%" stopColor={currentTier.stroke} />
                </linearGradient>
              </defs>

              {/* Gauge Background Track (240 degrees) */}
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="8"
                strokeDasharray={`${arcLength} ${arcGap}`}
                strokeLinecap="round"
                className="origin-center"
                style={{ transform: 'rotate(150deg)' }}
              />

              {/* Gauge Sub-track border accent */}
              <circle
                cx="60"
                cy="60"
                r={r + 4}
                fill="none"
                stroke="rgba(255,255,255,0.01)"
                strokeWidth="1"
                strokeDasharray={`${arcLength} ${arcGap}`}
                className="origin-center"
                style={{ transform: 'rotate(150deg)' }}
              />

              {/* Dynamic Animated Active Gauge Track */}
              <motion.circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke="url(#velocityGradient)"
                strokeWidth="8"
                strokeDasharray={`${arcLength} ${arcGap}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                filter="url(#gauge-glow)"
                className="origin-center"
                style={{ transform: 'rotate(150deg)' }}
                initial={{ strokeDashoffset: arcLength }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />

              {/* Decorative ticks inside the gauge dial */}
              {Array.from({ length: 9 }).map((_, i) => {
                const angle = 150 + (i * 30); // 150 to 390 degrees (240 degree spread)
                const rad = (angle * Math.PI) / 180;
                const x1 = 60 + (r - 6) * Math.cos(rad);
                const y1 = 60 + (r - 6) * Math.sin(rad);
                const x2 = 60 + (r - 2) * Math.cos(rad);
                const y2 = 60 + (r - 2) * Math.sin(rad);
                const isTickPassed = (i * 12.5) <= clampedVal;

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isTickPassed ? currentTier.stroke : 'rgba(255,255,255,0.1)'}
                    strokeWidth={isTickPassed ? 1.5 : 1}
                  />
                );
              })}
            </svg>

            {/* Inner Dashboard Core */}
            <div className="absolute text-center flex flex-col items-center justify-center">
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest block mb-0.5">Average</span>
              
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-esports italic font-black text-white leading-none digital-glow">
                  {averagePagesPerDay}
                </span>
              </div>
              
              <span className="text-[8px] font-mono text-primary uppercase font-bold tracking-widest mt-1 block bg-primary/10 px-2 py-0.5 border border-primary/20">
                Pages/Day
              </span>
            </div>

            {/* Radial Velocity Pointer Dial Line */}
            <motion.div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              style={{ originX: '50%', originY: '50%' }}
              animate={{ rotate: -120 + (percentage * 240) }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            >
              <div 
                className="w-1.5 h-16 bg-gradient-to-t from-transparent via-white/80 to-primary rounded-full" 
                style={{ transform: 'translateY(-24px)' }} 
              />
            </motion.div>

          </div>

          <div className="mt-6 text-center w-full">
            <span className={`text-[11px] font-esports font-black tracking-widest uppercase italic block ${currentTier.color}`}>
              ⚡ {currentTier.title} ⚡
            </span>
            <div className="h-[1px] w-12 bg-white/10 mx-auto my-2" />
            <p className="text-[10px] font-mono text-white/40 uppercase">
              Period volume: {totalPagesInPeriod} pages ({approvedSubmissionsCount} submissions)
            </p>
          </div>

        </div>

        {/* Right Column: Speed Classification, Aura Details & Projections */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full gap-6">
          
          {/* Detailed Tier Card */}
          <div className={`p-6 border rounded-xl relative overflow-hidden transition-colors duration-1000 ${currentTier.bg}`}>
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <Zap size={36} className={currentTier.color} />
            </div>
            
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mb-1">
              Active Tier Classification
            </span>
            <h4 className={`text-xl font-esports font-black italic uppercase tracking-wider mb-2 ${currentTier.color}`}>
              {currentTier.name}
            </h4>
            <p className="text-xs text-white/80 leading-relaxed font-medium italic border-l-2 border-white/20 pl-4 py-1">
              "{currentTier.description}"
            </p>
          </div>

          {/* Matrix projections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Projected pages card */}
            <div className="bg-black/20 border border-white/5 p-5 rounded-xl">
              <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest block mb-1">
                Projected Yearly Conquests
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-esports font-black text-white italic">
                  {pagesOneYear.toLocaleString()}
                </span>
                <span className="text-[10px] font-mono text-white/30 uppercase">Pages</span>
              </div>
              <p className="text-[10px] font-mono text-white/40 mt-2">
                Your estimated page volume over the next 365 cycles at current extraction rates.
              </p>
            </div>

            {/* Tome equivalent card */}
            <div className="bg-black/20 border border-white/5 p-5 rounded-xl">
              <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest block mb-1">
                Sacred Tome Equivalents
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-esports font-black text-primary italic">
                  {tomesOneYear}
                </span>
                <span className="text-[10px] font-mono text-white/30 uppercase">Tomes</span>
              </div>
              <p className="text-[10px] font-mono text-white/40 mt-2">
                Assuming standard culling codices of approximately 250 high-tier pages each.
              </p>
            </div>

          </div>

          {/* Velocity Matrix Legend / Progression */}
          <div className="bg-black/30 border border-white/5 p-4 rounded-xl">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mb-3">
              Velocity Progression Matrix
            </span>
            <div className="flex flex-wrap gap-2">
              {VELOCITY_TIERS.map((tier) => {
                const isActive = currentTier.name === tier.name;
                return (
                  <div
                    key={tier.name}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded border transition-all ${
                      isActive 
                        ? 'bg-white/10 text-white border-primary shadow-[0_0_10px_rgba(248,231,28,0.2)]'
                        : 'bg-black/40 text-white/30 border-white/5'
                    }`}
                  >
                    <div 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: tier.stroke }} 
                    />
                    <span>{tier.name}</span>
                    <span className="opacity-50">
                      ({tier.min}-{tier.max === Infinity ? '∞' : tier.max} p/d)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </motion.section>
  );
};
