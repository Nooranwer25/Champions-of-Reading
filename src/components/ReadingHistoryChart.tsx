import React, { useState, useMemo } from 'react';
import { Submission, BookCategory, SubmissionStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Legend, Cell 
} from 'recharts';
import { BookOpen, Calendar, BarChart3, Filter, Zap, Compass, RefreshCw } from 'lucide-react';

interface ReadingHistoryChartProps {
  submissions: Submission[];
}

export const ReadingHistoryChart: React.FC<ReadingHistoryChartProps> = ({ submissions }) => {
  const [chartType, setChartType] = useState<'pages' | 'frequency'>('pages');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<'all' | '30days' | '7days'>('all');

  // Parse Date from firestore timestamp safely
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

  // Filter and process submissions
  const processedData = useMemo(() => {
    // Standardize and sort submissions chronologically
    const list = submissions
      .map(sub => ({
        ...sub,
        date: parseDate(sub.createdAt),
        pages: Number(sub.pagesRead) || 0
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Apply time-range filter
    const now = new Date();
    const filteredByTime = list.filter(sub => {
      if (timeRange === '7days') {
        const diff = now.getTime() - sub.date.getTime();
        return diff <= 7 * 24 * 60 * 60 * 1000;
      }
      if (timeRange === '30days') {
        const diff = now.getTime() - sub.date.getTime();
        return diff <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });

    // Apply category filter
    const filteredByCategory = filteredByTime.filter(sub => {
      if (selectedCategory === 'ALL') return true;
      return sub.category.toUpperCase() === selectedCategory.toUpperCase();
    });

    return filteredByCategory;
  }, [submissions, selectedCategory, timeRange]);

  // Aggregate pages read over time (by date)
  const chartData = useMemo(() => {
    if (processedData.length === 0) return [];

    // Map to group pages and frequencies by formatted date
    const dateMap: { [key: string]: { dateStr: string; rawDate: Date; pages: number; submissions: number; books: string[] } } = {};

    processedData.forEach(sub => {
      const dateStr = sub.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {
          dateStr,
          rawDate: sub.date,
          pages: 0,
          submissions: 0,
          books: []
        };
      }
      dateMap[dateStr].pages += sub.pages;
      dateMap[dateStr].submissions += 1;
      dateMap[dateStr].books.push(sub.bookTitle);
    });

    // Sort again to be absolutely sure chronologically
    return Object.values(dateMap).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
  }, [processedData]);

  // Total pages and books read count for filtered subset
  const totals = useMemo(() => {
    return processedData.reduce((acc, curr) => {
      if (curr.status === SubmissionStatus.APPROVED) {
        acc.approvedPages += curr.pages;
        acc.approvedBooks += 1;
      }
      acc.totalPages += curr.pages;
      acc.totalBooks += 1;
      return acc;
    }, { totalPages: 0, totalBooks: 0, approvedPages: 0, approvedBooks: 0 });
  }, [processedData]);

  // Custom tooltips with Obsidian styling
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div 
          className="bg-neutral-950/95 border border-primary/40 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.85)] backdrop-blur-md relative"
          style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)' }}
        >
          <div className="absolute top-0 left-4 w-12 h-0.5 bg-primary"></div>
          <p className="text-[10px] font-esports italic text-primary uppercase tracking-wider mb-2">
            {data.dateStr}
          </p>
          <div className="space-y-1.5 font-mono text-[11px] text-on-surface">
            <div className="flex justify-between gap-6">
              <span className="text-on-surface-variant/70">PAGES CONQUERED:</span>
              <span className="text-white font-black">{data.pages} pages</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-on-surface-variant/70">TECHNIQUES SUBMITTED:</span>
              <span className="text-secondary font-bold">{data.submissions} entry</span>
            </div>
            {data.books.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5">
                <span className="text-[9px] text-primary/60 uppercase block mb-1 font-bold">TITLES LOGGED:</span>
                <ul className="list-disc list-inside text-[10px] text-white/80 space-y-0.5">
                  {data.books.map((b: string, i: number) => (
                    <li key={i} className="truncate max-w-[200px]">{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      id="reading-history-charts-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-neutral-900/40 border border-primary/20 p-6 md:p-8 relative overflow-hidden mb-16"
      style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
    >
      {/* Visual accents */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Type selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 className="text-primary animate-pulse" size={20} />
            <h4 className="text-xl font-esports italic text-on-surface uppercase tracking-tight">Archive Chronology</h4>
          </div>
          <p className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-widest mt-1">
            Visualizing scrolls deciphered and energy accumulated
          </p>
        </div>

        {/* Filters and buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Chart Type Toggle */}
          <div className="flex bg-neutral-950 border border-white/10 p-1">
            <button
              onClick={() => setChartType('pages')}
              className={`px-3 py-1.5 text-[9px] font-esports font-black uppercase tracking-wider transition-all cursor-pointer ${
                chartType === 'pages' 
                  ? 'bg-primary text-black' 
                  : 'text-on-surface-variant/70 hover:text-on-surface'
              }`}
            >
              Pages Read
            </button>
            <button
              onClick={() => setChartType('frequency')}
              className={`px-3 py-1.5 text-[9px] font-esports font-black uppercase tracking-wider transition-all cursor-pointer ${
                chartType === 'frequency' 
                  ? 'bg-primary text-black' 
                  : 'text-on-surface-variant/70 hover:text-on-surface'
              }`}
            >
              Submissions
            </button>
          </div>

          {/* Timeframe Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-neutral-950 border border-white/10 text-on-surface font-mono text-[10px] uppercase font-bold tracking-wider py-2 px-3 focus:outline-none focus:border-primary transition-all cursor-pointer"
          >
            <option value="all">Culling Era (All)</option>
            <option value="30days">Last 30 Days</option>
            <option value="7days">Last 7 Days</option>
          </select>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-neutral-950 border border-white/10 py-1.5 px-3">
            <Filter size={10} className="text-primary" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none text-on-surface font-mono text-[10px] uppercase font-bold tracking-wider focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Lore</option>
              <option value="NOVEL">Novels</option>
              <option value="POETRY">Poetry</option>
              <option value="NON-FICTION">Non-Fiction</option>
            </select>
          </div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="py-16 text-center text-on-surface-variant/50 font-mono text-xs uppercase tracking-wider">
          <BookOpen className="mx-auto text-primary/20 mb-3 animate-bounce" size={32} />
          Your reading ledger is currently empty.
        </div>
      ) : chartData.length === 0 ? (
        <div className="py-16 text-center text-on-surface-variant/50 font-mono text-xs uppercase tracking-wider">
          No matches found for the active filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-stretch">
          {/* Left Panel: Statistics Highlight */}
          <div className="flex flex-col justify-between gap-4 bg-neutral-950/50 border border-white/5 p-4 relative" style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)' }}>
            <div className="space-y-4">
              <div>
                <span className="text-[8px] font-mono text-primary uppercase font-bold tracking-[0.2em] block mb-1">
                  ENERGY REVELATION
                </span>
                <h5 className="text-sm font-esports font-bold italic text-on-surface uppercase tracking-tight">
                  Active Filter Stats
                </h5>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white/[0.02] border border-white/5">
                  <span className="text-[8px] font-mono text-on-surface-variant/60 uppercase tracking-widest block">
                    Pages Transformed
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-esports font-black italic text-primary digital-glow">
                      {totals.totalPages.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-mono text-on-surface-variant/40 uppercase">PGS</span>
                  </div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/5">
                  <span className="text-[8px] font-mono text-on-surface-variant/60 uppercase tracking-widest block">
                    Approved Techniques
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-esports font-black italic text-secondary">
                      {totals.approvedBooks}
                    </span>
                    <span className="text-[9px] font-mono text-on-surface-variant/40 uppercase">/ {totals.totalBooks} TOTAL</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 text-[9px] font-mono text-on-surface-variant/50 leading-relaxed uppercase tracking-wider">
              <Zap size={10} className="inline text-primary mr-1.5 -mt-0.5 animate-pulse" />
              Keep log entries up to date to maintain accuracy of your comprehension aura.
            </div>
          </div>

          {/* Right Panel: Recharts Visualization */}
          <div className="lg:col-span-3 h-[280px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'pages' ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="pagesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F8E71C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F8E71C" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis 
                    dataKey="dateStr" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={9}
                    fontFamily="monospace"
                    dy={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={9}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(248, 231, 28, 0.25)', strokeWidth: 1 }} />
                  <Area 
                    type="monotone" 
                    dataKey="pages" 
                    stroke="#F8E71C" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#pagesGradient)" 
                    animationDuration={1200}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis 
                    dataKey="dateStr" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={9}
                    fontFamily="monospace"
                    dy={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={9}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar 
                    dataKey="submissions" 
                    fill="#3B82F6" 
                    radius={[2, 2, 0, 0]}
                    animationDuration={1200}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.submissions > 1 ? '#9333EA' : '#F8E71C'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
};
