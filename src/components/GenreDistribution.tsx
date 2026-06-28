import React from 'react';
import { Submission, SubmissionStatus, BookCategory } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { Book, Compass, Sparkles } from 'lucide-react';

interface GenreDistributionProps {
  submissions: Submission[];
}

interface ChartItem {
  name: string;
  value: number;
  color: string;
  glowColor: string;
  percentage: number;
}

export const GenreDistribution: React.FC<GenreDistributionProps> = ({ submissions }) => {
  // 1. Filter approved submissions (books read)
  const approvedSubmissions = submissions.filter(
    (s) => s.status === SubmissionStatus.APPROVED
  );

  const totalConquered = approvedSubmissions.length;

  // 2. Count genres (categories)
  const counts = {
    [BookCategory.NOVEL]: 0,
    [BookCategory.POETRY]: 0,
    [BookCategory.NON_FICTION]: 0,
  };

  approvedSubmissions.forEach((s) => {
    if (s.category && counts[s.category] !== undefined) {
      counts[s.category]++;
    } else {
      // Fallback/safety for any unexpected categories
      counts[BookCategory.NOVEL]++;
    }
  });

  // 3. Format data for the Recharts Doughnut Chart
  // Map standard genres to lore-friendly descriptions with customized anime/magic theme colors
  const genreMetadata = {
    [BookCategory.NOVEL]: {
      label: 'Novels & Lore',
      color: '#F8E71C', // Signature Gold
      glowColor: 'rgba(248, 231, 28, 0.4)',
    },
    [BookCategory.POETRY]: {
      label: 'Verse & Incantations',
      color: '#9333EA', // Deep Purple
      glowColor: 'rgba(147, 51, 234, 0.4)',
    },
    [BookCategory.NON_FICTION]: {
      label: 'Chronicles & Treatises',
      color: '#3B82F6', // Blue Energy
      glowColor: 'rgba(59, 130, 246, 0.4)',
    },
  };

  const chartData: ChartItem[] = [
    {
      name: genreMetadata[BookCategory.NOVEL].label,
      value: counts[BookCategory.NOVEL],
      color: genreMetadata[BookCategory.NOVEL].color,
      glowColor: genreMetadata[BookCategory.NOVEL].glowColor,
      percentage: totalConquered > 0 ? Math.round((counts[BookCategory.NOVEL] / totalConquered) * 100) : 0,
    },
    {
      name: genreMetadata[BookCategory.POETRY].label,
      value: counts[BookCategory.POETRY],
      color: genreMetadata[BookCategory.POETRY].color,
      glowColor: genreMetadata[BookCategory.POETRY].glowColor,
      percentage: totalConquered > 0 ? Math.round((counts[BookCategory.POETRY] / totalConquered) * 100) : 0,
    },
    {
      name: genreMetadata[BookCategory.NON_FICTION].label,
      value: counts[BookCategory.NON_FICTION],
      color: genreMetadata[BookCategory.NON_FICTION].color,
      glowColor: genreMetadata[BookCategory.NON_FICTION].glowColor,
      percentage: totalConquered > 0 ? Math.round((counts[BookCategory.NON_FICTION] / totalConquered) * 100) : 0,
    },
  ].filter((item) => item.value > 0);

  // Custom tooltips matching Culling Game look
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ChartItem = payload[0].payload;
      return (
        <div 
          className="bg-black/95 border border-primary/30 p-3 shadow-2xl backdrop-blur-md relative font-mono text-[11px]" 
          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5" style={{ backgroundColor: data.color }} />
            <span className="text-[10px] font-esports font-black text-on-surface uppercase italic tracking-wider">
              {data.name}
            </span>
          </div>
          <div className="space-y-1 text-white/75 font-bold uppercase tracking-wide">
            <p className="flex justify-between gap-6">
              <span>MANIFESTED:</span>
              <span className="text-primary font-black">{data.value} {data.value === 1 ? 'TOME' : 'TOMES'}</span>
            </p>
            <p className="flex justify-between gap-6">
              <span>RATIO:</span>
              <span className="text-secondary font-black">{data.percentage}% OF SOUL</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      id="genre-distribution-dashboard"
      className="bg-black/40 border border-primary/10 p-8 md:p-12 relative overflow-hidden mb-24 transition-all hover:border-primary/25"
      style={{ clipPath: 'polygon(3% 0, 100% 0, 97% 100%, 0% 100%)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-20 pointer-events-none" />
      
      {/* Decorative JRPG accents */}
      <div className="absolute top-0 right-12 w-[1px] h-4 bg-primary/40" />
      <div className="absolute bottom-0 left-12 w-[1px] h-4 bg-primary/40" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-[0.03] select-none pointer-events-none font-black text-9xl italic font-mono uppercase tracking-widest text-primary">
        GENRE
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-center justify-between">
        
        {/* Left Side: Category Breakdown and Text Description */}
        <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-left">
          <header className="space-y-3">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <span className="p-2 bg-primary/10 border border-primary/20 text-primary rounded-none rotate-45">
                <Compass size={16} className="-rotate-45 animate-pulse" />
              </span>
              <span className="text-[10px] uppercase font-esports tracking-[0.4em] text-primary/60 font-black italic">
                Aura Alignment Analysis
              </span>
            </div>
            
            <h3 className="text-4xl md:text-5xl font-esports italic text-on-surface uppercase tracking-tighter digital-glow leading-none">
              Genre Incantations
            </h3>
            
            <p className="text-xs uppercase font-bold text-on-surface-variant font-sans tracking-widest leading-relaxed max-w-xl text-primary/40">
              Your consciousness aligns with specific domain matrices based on the materials you analyze. Balancing across disciplines fortifies your understanding.
            </p>
          </header>

          <div className="h-px bg-primary/10" />

          {/* Table Breakdown / Custom Legend */}
          <div className="space-y-4">
            {totalConquered === 0 ? (
              <div className="border bg-black/50 p-4 border-l-4 border-l-primary/40 max-w-xl italic text-white/40 border-white/5">
                <div className="flex gap-4 items-center">
                  <span className="p-1 px-3 bg-primary/10 border border-primary/25 text-[8px] uppercase tracking-[0.2em] font-black italic font-esports">UNALIGNED</span>
                  <p className="text-[10px] tracking-wider uppercase font-black">EXORCISE YOUR FIRST TOMES TO ACTIVATE GENRE ALIGNMENT GRAPHS.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-w-xl">
                {[
                  { key: BookCategory.NOVEL, label: 'Novels & Lore' },
                  { key: BookCategory.POETRY, label: 'Verse & Incantations' },
                  { key: BookCategory.NON_FICTION, label: 'Chronicles & Treatises' },
                ].map((item) => {
                  const count = counts[item.key as BookCategory] || 0;
                  const pct = totalConquered > 0 ? Math.round((count / totalConquered) * 100) : 0;
                  const meta = genreMetadata[item.key as BookCategory];

                  return (
                    <div 
                      key={item.key}
                      className="bg-black/30 border border-white/5 hover:border-white/10 p-3 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
                      style={{ clipPath: 'polygon(1% 0, 100% 0, 99% 100%, 0% 100%)' }}
                    >
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <span className="w-3 h-3 block border border-white/10 flex-shrink-0" style={{ backgroundColor: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
                        <div>
                          <h5 className="text-[11px] font-esports font-black italic uppercase tracking-wider text-on-surface">
                            {meta.label}
                          </h5>
                          <span className="text-[8px] text-white/30 font-mono tracking-widest uppercase font-bold">
                            Category: {item.key}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                        <div className="w-24 bg-white/5 h-1.5 rounded-none overflow-hidden relative border border-white/10">
                          <motion.div 
                            className="h-full" 
                            style={{ backgroundColor: meta.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                        
                        <div className="text-right font-mono text-[11px] font-black uppercase">
                          <span className="text-on-surface">{count} {count === 1 ? 'TOME' : 'TOMES'}</span>
                          <span className="text-white/30 mx-2">/</span>
                          <span className="text-primary" style={{ textShadow: `0 0 8px ${meta.glowColor}` }}>{pct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Recharts Doughnut Chart */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
          {totalConquered === 0 ? (
            <div className="relative w-48 h-48 flex items-center justify-center border-2 border-dashed border-primary/20 rounded-full animate-pulse">
              <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-30 rounded-full" />
              <div className="text-center p-4">
                <Book size={24} className="mx-auto text-primary/40 mb-2" />
                <span className="text-[9px] uppercase font-esports tracking-widest text-primary/40 font-black block italic">
                  Aura Dormant
                </span>
              </div>
            </div>
          ) : (
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Animated outer ring */}
              <div className="absolute inset-0 border border-primary/10 rounded-full animate-spin" style={{ animationDuration: '25s' }} />
              <div className="absolute inset-2 border border-dashed border-secondary/10 rounded-full animate-spin" style={{ animationDuration: '40s', animationDirection: 'reverse' }} />
              
              {/* Subtle background glow */}
              <div className="absolute inset-8 bg-primary/5 blur-3xl opacity-40 rounded-full animate-pulse" />
              
              {/* Recharts Pie component */}
              <div className="w-full h-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={88}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={1200}
                      animationEasing="ease-out"
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke="rgba(0,0,0,0.8)" 
                          strokeWidth={2}
                          style={{
                            filter: `drop-shadow(0px 0px 5px ${entry.glowColor})`,
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Central text displaying total read stats */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[9px] text-primary/40 leading-none tracking-[0.2em] font-black italic uppercase font-esports">
                  Total Conquered
                </span>
                <span className="text-3xl font-esports font-black text-on-surface digital-glow-large leading-none my-1">
                  {totalConquered}
                </span>
                <div className="flex items-center gap-1 text-[8px] uppercase font-mono font-black tracking-widest text-white/50">
                  <Sparkles size={8} className="text-secondary animate-pulse" />
                  <span>Culling Season</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
