import React, { useMemo, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { Submission, SubmissionStatus } from '../types';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { TrendingUp, Award, Sparkles, Flame, Shield, ArrowUpRight, Activity } from 'lucide-react';

interface AscensionLogProps {
  submissions: Submission[];
}

interface MonthRange {
  label: string;
  fullLabel: string;
  start: number;
  end: number;
  year: number;
  month: number;
}

export const AscensionLog: React.FC<AscensionLogProps> = ({ submissions }) => {
  const { profile } = useAuth();
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  // Helper to extract timestamp safely
  const getTimestamp = (createdAt: any): number => {
    if (!createdAt) return Date.now();
    if (typeof createdAt.toMillis === 'function') {
      return createdAt.toMillis();
    }
    if (createdAt.seconds) {
      return createdAt.seconds * 1000;
    }
    return new Date(createdAt).getTime();
  };

  // 1. Calculate dynamic 6-month boundaries (up to current local time)
  const ranges = useMemo<MonthRange[]>(() => {
    const result: MonthRange[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      
      const start = new Date(year, month, 1, 0, 0, 0, 0).getTime();
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
      
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const fullLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      result.push({
        label,
        fullLabel,
        start,
        end,
        year,
        month
      });
    }
    return result;
  }, []);

  // 2. Define the Grade mapping
  const getGradeFromPoints = (points: number) => {
    if (points >= 1200) {
      return {
        name: 'Special Grade',
        levelStr: 'S',
        color: 'text-red-400',
        borderColor: 'border-red-500/30',
        bg: 'bg-red-500/10',
        badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/30',
        description: 'Boundless cursed energy reserves. Peerless comprehension.'
      };
    }
    if (points >= 750) {
      return {
        name: 'Grade 1',
        levelStr: '1',
        color: 'text-orange-400',
        borderColor: 'border-orange-500/30',
        bg: 'bg-orange-500/10',
        badgeClass: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
        description: 'Elite sorcerer. High-level cognitive extraction capacity.'
      };
    }
    if (points >= 400) {
      return {
        name: 'Grade 2',
        levelStr: '2',
        color: 'text-yellow-400',
        borderColor: 'border-yellow-500/30',
        bg: 'bg-yellow-500/10',
        badgeClass: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
        description: 'Formidable strength. Consistently mastering rich tomes.'
      };
    }
    if (points >= 150) {
      return {
        name: 'Grade 3',
        levelStr: '3',
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        bg: 'bg-emerald-500/10',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        description: 'Active combatant. Breaking through standard limits.'
      };
    }
    return {
      name: 'Grade 4',
      levelStr: '4',
      color: 'text-sky-400',
      borderColor: 'border-sky-500/30',
      bg: 'bg-sky-500/10',
      badgeClass: 'bg-sky-500/10 text-sky-400 border border-sky-500/30',
      description: 'Starting acolyte. Initiating formal comprehension techniques.'
    };
  };

  // 3. Process submissions to generate cumulative point progress
  const chartData = useMemo(() => {
    const approvedSubs = submissions.filter(s => s.status === SubmissionStatus.APPROVED);
    
    // Sync total points discrepancy (base energy if they earned points outside submissions)
    const totalPointsFromSubs = approvedSubs.reduce((sum, s) => sum + (s.pointsEarned || 0), 0);
    const baseEnergy = Math.max(0, (profile?.totalPoints || 0) - totalPointsFromSubs);

    return ranges.map((r) => {
      // Points up to the end of this month
      const pointsInMonth = approvedSubs
        .filter(s => getTimestamp(s.createdAt) <= r.end)
        .reduce((sum, s) => sum + (s.pointsEarned || 0), 0);

      // Books completed up to the end of this month
      const booksInMonth = approvedSubs
        .filter(s => getTimestamp(s.createdAt) <= r.end)
        .length;

      const points = baseEnergy + pointsInMonth;
      const grade = getGradeFromPoints(points);

      return {
        name: r.label,
        fullLabel: r.fullLabel,
        points,
        booksCompleted: booksInMonth,
        gradeName: grade.name,
        gradeLevel: grade.levelStr,
        gradeColor: grade.color,
        gradeDesc: grade.description,
        badgeClass: grade.badgeClass,
        bg: grade.bg,
        borderColor: grade.borderColor
      };
    });
  }, [submissions, ranges, profile?.totalPoints]);

  // Current grade summary
  const currentGrade = useMemo(() => {
    const latestPoints = chartData[chartData.length - 1]?.points || 0;
    return getGradeFromPoints(latestPoints);
  }, [chartData]);

  // Calculate insights
  const insights = useMemo(() => {
    const firstPoints = chartData[0]?.points || 0;
    const lastPoints = chartData[chartData.length - 1]?.points || 0;
    const diff = lastPoints - firstPoints;
    const pctGrowth = firstPoints > 0 ? Math.round((diff / firstPoints) * 100) : 0;

    // Find month with the most point gain
    let maxGain = 0;
    let peakMonth = 'N/A';
    for (let i = 1; i < chartData.length; i++) {
      const gain = chartData[i].points - chartData[i - 1].points;
      if (gain > maxGain) {
        maxGain = gain;
        peakMonth = chartData[i].fullLabel;
      }
    }

    return {
      growth: diff,
      percent: pctGrowth,
      peakMonth,
      peakGain: maxGain
    };
  }, [chartData]);

  const activeDetail = hoveredPoint || chartData[chartData.length - 1];

  return (
    <motion.section
      id="ascension-log-section"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-24 w-full bg-neutral-900/40 border border-primary/20 p-6 md:p-8 relative overflow-hidden text-white"
      style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
    >
      {/* Background visual elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12 border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <Activity className="text-primary" size={24} />
            <h3 className="text-4xl font-esports italic text-on-surface uppercase tracking-tighter digital-glow">
              Ascension Log
            </h3>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-white/40 font-black italic block mt-1">
            Sorcerer Rank & Cursed Energy Progression (6-Month Matrix)
          </span>
        </div>

        {/* Current Rank Badge */}
        <div className={`flex items-center gap-3 px-5 py-2.5 border backdrop-blur-sm ${currentGrade.borderColor} ${currentGrade.bg}`}>
          <Award className={currentGrade.color} size={20} />
          <div>
            <span className="text-[8px] font-mono text-white/40 uppercase block tracking-wider">Current Classification</span>
            <span className={`text-sm font-esports italic uppercase font-black tracking-widest ${currentGrade.color}`}>
              {currentGrade.name} [Grade {currentGrade.levelStr}]
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Graphical Line Chart of Progress */}
        <div className="lg:col-span-2 bg-black/40 border border-white/5 p-6 rounded-xl flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-mono text-white/50 uppercase tracking-widest block">
                Cursed Energy Matrix (CE)
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-mono text-primary uppercase tracking-widest">Live Integration</span>
              </div>
            </div>

            {/* Recharts Area / Line Chart */}
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onMouseMove={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length) {
                      setHoveredPoint(state.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <defs>
                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff30" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#ffffff30" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                  />
                  
                  {/* Threshold markers for visual guides */}
                  <ReferenceLine y={150} stroke="#ffffff10" strokeDasharray="2 2" />
                  <ReferenceLine y={400} stroke="#ffffff10" strokeDasharray="2 2" />
                  <ReferenceLine y={750} stroke="#ffffff10" strokeDasharray="2 2" />
                  <ReferenceLine y={1200} stroke="#ffffff10" strokeDasharray="2 2" />

                  <Tooltip 
                    content={() => null} // We render the interactive stats details in the sidebar panel dynamically
                  />
                  <Line
                    type="monotone"
                    dataKey="points"
                    stroke="#facccd" // Matches standard primary energy color
                    strokeWidth={3}
                    dot={{ r: 4, stroke: '#121214', strokeWidth: 2, fill: '#facccd' }}
                    activeDot={{ r: 7, stroke: '#121214', strokeWidth: 2, fill: '#ef4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Guide legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/5 text-[9px] font-mono text-white/40 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> G4: &lt;150 CE</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> G3: 150+ CE</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> G2: 400+ CE</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> G1: 750+ CE</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Special Grade: 1200+ CE</span>
          </div>
        </div>

        {/* Right Side: Interactive Ascension Chronicle Info Panel */}
        <div className="bg-[#0c0c0e] border border-white/5 p-6 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
                Chronicle Details
              </span>
              <span className="text-[9px] font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded uppercase tracking-wider">
                {activeDetail?.fullLabel || 'Active Register'}
              </span>
            </div>

            {/* Animated Active Register Block */}
            <div className="space-y-5">
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mb-1">
                  ENERGY REGISTER
                </span>
                <span className="text-3xl font-esports font-black text-primary tracking-tight block">
                  {activeDetail?.points} <span className="text-xs text-white/40 tracking-normal font-mono font-medium">CE</span>
                </span>
                <span className="text-[9px] font-mono text-white/50 block mt-1">
                  Cumulative Points gathered via approved sacred synopses
                </span>
              </div>

              <div>
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mb-1.5">
                  GRADE CLASSIFICATION
                </span>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-esports font-black text-lg ${activeDetail?.badgeClass}`}>
                    {activeDetail?.gradeLevel}
                  </div>
                  <div>
                    <span className={`text-base font-esports italic uppercase font-black tracking-wider block ${activeDetail?.gradeColor}`}>
                      {activeDetail?.gradeName}
                    </span>
                    <p className="text-[10px] text-white/60 leading-relaxed max-w-[200px]">
                      {activeDetail?.gradeDesc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
                  <span className="text-[8px] font-mono text-white/40 uppercase block mb-1">Tomes Sealed</span>
                  <span className="text-base font-esports font-black text-white block">
                    {activeDetail?.booksCompleted} Complete
                  </span>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-lg">
                  <span className="text-[8px] font-mono text-white/40 uppercase block mb-1">Technique State</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold uppercase block">
                    {activeDetail?.points >= 750 ? 'Refined Domain' : 'Flowing Essence'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Core progression growth indicator */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded border border-primary/20">
                <ArrowUpRight size={16} className="text-primary" />
              </div>
              <div>
                <span className="text-[8px] font-mono text-white/40 uppercase block">Total Growth</span>
                <span className="text-xs font-mono font-black text-white">
                  +{insights.growth} CE ({insights.percent}% Increase)
                </span>
              </div>
            </div>

            {insights.peakGain > 0 && (
              <div className="text-right">
                <span className="text-[8px] font-mono text-white/40 uppercase block">Peak Expansion</span>
                <span className="text-[10px] font-mono text-primary font-black uppercase">
                  {insights.peakMonth}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Timeline Block */}
      <div className="mt-8 bg-black/30 border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 bg-black/20 flex justify-between items-center">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-black">
            Ascension Chronicle Timeline
          </span>
          <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
            6 Cycles Logged
          </span>
        </div>
        <div className="divide-y divide-white/5">
          {chartData.map((data, idx) => (
            <div 
              key={idx} 
              className="px-5 py-3.5 flex flex-wrap justify-between items-center gap-4 hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono font-bold text-white/40 w-8">{data.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-esports italic uppercase tracking-tight text-white">{data.gradeName}</span>
                  <span className="text-[8px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/50">
                    Grade {data.gradeLevel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-8 text-[11px] font-mono">
                <div className="hidden sm:block">
                  <span className="text-white/40 uppercase text-[9px] mr-2">Tomes Compleat</span>
                  <span className="text-white font-bold">{data.booksCompleted}</span>
                </div>
                <div>
                  <span className="text-white/40 uppercase text-[9px] mr-2">Cursed Energy</span>
                  <span className="text-primary font-black">{data.points} CE</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
