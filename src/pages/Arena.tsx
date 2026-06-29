import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Submission, BookCategory, SubmissionStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal, Crown, Search, Zap, Shield, Filter, LayoutGrid, List, Clock, Star, BookOpen, User as UserIcon } from 'lucide-react';

import Logo from '../components/Logo';
import SeasonCountdown from '../components/SeasonCountdown';
import Kogane from '../components/Kogane';
import { getKoganeMotto } from '../services/koganeService';
import { SubmissionCard } from '../components/SubmissionCard';
import { TomeDuel } from '../components/TomeDuel';

type ViewMode = 'sorcerers' | 'techniques' | 'duels';

const formatDate = (date: any) => {
  if (!date) return 'Unknown';
  if (typeof date === 'string') return new Date(date).toLocaleDateString();
  if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
  if (date.toDate) return date.toDate().toLocaleDateString();
  return 'Unknown';
};

const Arena: React.FC = () => {
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('sorcerers');
  const [userSortBy, setUserSortBy] = useState<'totalPoints' | 'tomesConquered' | 'createdAt'>('totalPoints');
  const [submissionSortBy, setSubmissionSortBy] = useState<'createdAt' | 'pointsEarned' | 'rating'>('createdAt');
  const [categoryFilter, setCategoryFilter] = useState<BookCategory | 'all'>('all');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [koganeSpeech, setKoganeSpeech] = useState("JUDGMENT!");

  useEffect(() => {
    const fetchKogane = async () => {
      const speech = await getKoganeMotto();
      setKoganeSpeech(speech);
    };
    fetchKogane();
  }, []);

  useEffect(() => {
    if (viewMode === 'duels') {
      setLoading(false);
      return;
    }
    setLoading(true);
    let unsubscribe: () => void;

    if (viewMode === 'sorcerers') {
      const q = query(
        collection(db, 'users'),
        orderBy(userSortBy, 'desc'),
        limit(50)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const users: UserProfile[] = [];
        snapshot.forEach((doc) => {
          users.push(doc.data() as UserProfile);
        });
        setLeaders(users);
        setLoading(false);
      }, (error) => {
        // Ignore
        setLoading(false);
      });
    } else {
      let q = query(
        collection(db, 'submissions'),
        where('status', '==', SubmissionStatus.APPROVED),
        orderBy(submissionSortBy, 'desc'),
        limit(50)
      );

      if (categoryFilter !== 'all') {
        q = query(
          collection(db, 'submissions'),
          where('status', '==', SubmissionStatus.APPROVED),
          where('category', '==', categoryFilter),
          orderBy(submissionSortBy, 'desc'),
          limit(50)
        );
      }

      unsubscribe = onSnapshot(q, (snapshot) => {
        const subs: Submission[] = [];
        snapshot.forEach((doc) => {
          subs.push(doc.data() as Submission);
        });
        setSubmissions(subs);
        setLoading(false);
      }, (error) => {
        // Ignore
        setLoading(false);
      });
    }

    return () => unsubscribe && unsubscribe();
  }, [viewMode, userSortBy, submissionSortBy, categoryFilter]);

  const filteredLeaders = leaders.filter(l => 
    l.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubmissions = submissions.filter(s => 
    s.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRank = (index: number, list: UserProfile[]) => {
    if (index === 0) return 1;
    const currentScore = list[index].totalPoints;
    const prevScore = list[index - 1].totalPoints;
    if (currentScore === prevScore) {
      // Find the first occurrence of this score to get its rank
      let i = index - 1;
      while (i >= 0 && list[i].totalPoints === currentScore) {
        i--;
      }
      return i + 2;
    }
    return index + 1;
  };

  const getRankIcon = (index: number, list: UserProfile[]) => {
    const rank = getRank(index, list);
    const rankTitle = rank === 1 ? "Special Grade Sorcerer" : 
                     rank < 4 ? "Grade 1 Sorcerer" : 
                     rank < 11 ? "Semi-Grade 1" : `Grade ${Math.min(4, Math.floor(rank/10) + 2)}`;

    switch(rank) {
      case 1: return <span className="cursor-help" title={rankTitle}><Crown className="text-primary digital-glow" size={24} /></span>;
      case 2: return <span className="cursor-help" title={rankTitle}><Shield className="text-secondary" size={22} /></span>;
      case 3: return <span className="cursor-help" title={rankTitle}><Zap className="text-accent" size={20} /></span>;
      default: return <span className="text-xs font-esports opacity-30 cursor-help" title={rankTitle}>#{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12 domain-expansion-bg">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 border-b border-primary/20 pb-12 mb-8">
            <div className="flex items-center gap-8">
              <div className="relative">
                <Logo size="md" className="hidden md:flex" />
                <div className="absolute -right-12 -top-12">
                  <Kogane size={80} speech={koganeSpeech} />
                </div>
              </div>
              <div>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-7xl font-esports italic text-white mb-2 tracking-tighter uppercase"
                >
                  The <span className="text-primary digital-glow">Arena</span>
                </motion.h2>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setViewMode('sorcerers')}
                    className={`text-[10px] uppercase font-black tracking-[0.3em] px-4 py-1 border transition-all ${viewMode === 'sorcerers' ? 'bg-primary text-black border-primary' : 'text-primary/40 border-primary/20 hover:border-primary/40'}`}
                  >
                    Sorcerer Standings
                  </button>
                  <button 
                    onClick={() => setViewMode('techniques')}
                    className={`text-[10px] uppercase font-black tracking-[0.3em] px-4 py-1 border transition-all ${viewMode === 'techniques' ? 'bg-primary text-black border-primary' : 'text-primary/40 border-primary/20 hover:border-primary/40'}`}
                  >
                    Technique Records
                  </button>
                  <button 
                    onClick={() => setViewMode('duels')}
                    className={`text-[10px] uppercase font-black tracking-[0.3em] px-4 py-1 border transition-all ${viewMode === 'duels' ? 'bg-primary text-black border-primary' : 'text-primary/40 border-primary/20 hover:border-primary/40'}`}
                  >
                    Tome Duels ⚔️
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-12">
              <SeasonCountdown />
              <motion.div 
                className="relative w-full md:w-80"
                initial={{ clipPath: 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)', opacity: 0 }}
                animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
              >
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary/30">
                  <Search size={16} />
                </div>
                <input 
                  type="text"
                  placeholder={viewMode === 'sorcerers' ? "Search Sorcerers..." : viewMode === 'techniques' ? "Search Techniques..." : "Search Duels..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-primary/20 rounded-none py-3 pl-12 pr-4 text-white font-esports text-lg outline-none focus:border-primary transition-all placeholder:text-white/10 uppercase tracking-widest"
                />
              </motion.div>
            </div>
          </div>

          {viewMode !== 'duels' && (
            <motion.div 
              initial={{ clipPath: 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)', opacity: 0 }}
              animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.4 }}
              className="flex flex-wrap items-center gap-4 bg-black/40 p-4 border border-primary/10"
            >
              <div className="flex items-center gap-3 text-primary/40 mr-4">
                <Filter size={14} />
                <span className="text-[10px] uppercase font-black tracking-widest">Filters:</span>
              </div>

              {viewMode === 'sorcerers' ? (
                <div className="flex gap-2">
                  {[
                    { id: 'totalPoints', label: 'By Score' },
                    { id: 'tomesConquered', label: 'By Tomes' },
                    { id: 'createdAt', label: 'By Arrival' }
                  ].map((sort) => (
                    <button
                      key={sort.id}
                      onClick={() => setUserSortBy(sort.id as any)}
                      className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest border transition-all ${userSortBy === sort.id ? 'bg-primary/20 text-primary border-primary' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
                    >
                      {sort.label}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 md:border-r md:border-primary/10 md:pr-4">
                    {[
                      { id: 'all', label: 'All Manifests' },
                      { id: BookCategory.NOVEL, label: 'Novels' },
                      { id: BookCategory.POETRY, label: 'Poetry' },
                      { id: BookCategory.NON_FICTION, label: 'Non-Fiction' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategoryFilter(cat.id as any)}
                        className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest border transition-all ${categoryFilter === cat.id ? 'bg-secondary/20 text-secondary border-secondary' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {[
                      { id: 'createdAt', label: 'Recent' },
                      { id: 'pointsEarned', label: 'High Score' },
                      { id: 'rating', label: 'High Rating' }
                    ].map((sort) => (
                      <button
                        key={sort.id}
                        onClick={() => setSubmissionSortBy(sort.id as any)}
                        className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest border transition-all ${submissionSortBy === sort.id ? 'bg-primary/20 text-primary border-primary' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
                      >
                        {sort.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => setLayoutMode('grid')}
                      className={`p-2 border transition-all ${layoutMode === 'grid' ? 'bg-secondary text-black border-secondary' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
                      title="Grid View"
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button
                      onClick={() => setLayoutMode('list')}
                      className={`p-2 border transition-all ${layoutMode === 'list' ? 'bg-secondary text-black border-secondary' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
                      title="List View"
                    >
                      <List size={14} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </header>

        {viewMode === 'duels' ? (
          <div className="p-6 md:p-10 bg-black/60 border border-primary/20" style={{ clipPath: 'polygon(2% 0, 100% 0, 100% 98%, 98% 100%, 0 100%, 0 2%)' }}>
            <TomeDuel />
          </div>
        ) : (
          <div className="bg-black/60 border border-primary/20 relative overflow-hidden" style={{ clipPath: 'polygon(2% 0, 100% 0, 100% 98%, 98% 100%, 0 100%, 0 2%)' }}>
            {viewMode === 'sorcerers' ? (
              <>
                <div className="grid grid-cols-12 gap-4 px-10 py-5 bg-primary/5 text-[12px] uppercase font-esports tracking-[0.3em] text-primary font-bold border-b border-primary/20 italic">
                  <div className="col-span-1">Grade</div>
                  <div className="col-span-6 md:col-span-7">Sorcerer</div>
                  <div className="col-span-3 text-right">Techniques</div>
                  <div className="col-span-2 md:col-span-1 text-right">Score</div>
                </div>

                <div className="divide-y divide-primary/10">
                  <AnimatePresence mode="popLayout">
                    {loading ? (
                      <LeaderboardSkeleton />
                    ) : filteredLeaders.length > 0 ? (
                      filteredLeaders.map((leader, index) => {
                        const rank = getRank(index, filteredLeaders);
                        return (
                          <motion.div 
                            layout
                            key={leader.userId}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-20px" }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            whileHover={{ scale: 1.01, x: 8, backgroundColor: "rgba(250, 204, 21, 0.05)" }}
                            className="grid grid-cols-12 gap-4 px-10 py-6 items-center group cursor-default transition-colors"
                          >
                            <div className="col-span-1 flex justify-center">
                              {getRankIcon(index, filteredLeaders)}
                            </div>
                            
                            <div className="col-span-6 md:col-span-7 flex items-center gap-5">
                              <div className="relative">
                                <img 
                                  src={leader.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leader.userId}`} 
                                  alt={leader.displayName} 
                                  className="w-12 h-12 rounded-none border border-primary/20 group-hover:scale-105 transition-transform cursed-energy-aura"
                                />
                                {rank <= 3 && (
                                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-black flex items-center justify-center font-black text-[8px] rotate-12 shadow-lg">
                                    {rank}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-white font-serif italic text-xl leading-tight group-hover:text-primary transition-colors uppercase font-black">
                                  {leader.displayName}
                                </span>
                                <span className="text-[10px] text-primary/40 font-bold uppercase tracking-widest mt-1">
                                  Manifested: {formatDate(leader.createdAt)}
                                </span>
                              </div>
                            </div>

                          <div className="col-span-3 text-right">
                            <span className="text-white font-mono text-lg">
                              {leader.tomesConquered}
                            </span>
                          </div>

                          <div className="col-span-2 md:col-span-1 text-right">
                            <span className="text-primary font-esports font-black text-3xl italic digital-glow">
                              {leader.totalPoints}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <EmptyState message="No Sorcerers found in this colony..." />
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                {layoutMode === 'list' ? (
                  <>
                    <div className="grid grid-cols-12 gap-4 px-10 py-5 bg-secondary/5 text-[12px] uppercase font-esports tracking-[0.3em] text-secondary font-bold border-b border-secondary/20 italic">
                      <div className="col-span-6 md:col-span-7">Technique Manifest</div>
                      <div className="col-span-3 text-right">Champion</div>
                      <div className="col-span-3 md:col-span-2 text-right">Extraction</div>
                    </div>

                    <div className="divide-y divide-secondary/10">
                      <AnimatePresence mode="popLayout">
                        {loading ? (
                          <LeaderboardSkeleton />
                        ) : filteredSubmissions.length > 0 ? (
                          filteredSubmissions.map((sub, index) => (
                            <motion.div 
                              layout
                              key={sub.submissionId}
                              initial={{ opacity: 0, y: 30 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-20px" }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              whileHover={{ scale: 1.01, x: 8, backgroundColor: "rgba(163, 230, 53, 0.05)" }}
                              className="grid grid-cols-12 gap-4 px-10 py-6 items-center group cursor-default transition-colors"
                            >
                              <div className="col-span-6 md:col-span-7 flex items-center gap-5">
                                <div className="relative w-12 h-16 bg-black flex-shrink-0 border border-secondary/20 overflow-hidden group-hover:border-secondary/50 flex items-center justify-center">
                                  {sub.coverImageUrl ? (
                                    <img src={sub.coverImageUrl} alt={sub.bookTitle} className="w-full h-full object-cover" />
                                  ) : (
                                    <>
                                      <div className="absolute inset-0 bg-secondary/5 opacity-40" />
                                      <BookOpen size={24} className="text-secondary/40 relative z-10 transition-transform group-hover:scale-110" />
                                    </>
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-white font-serif italic text-xl leading-tight group-hover:text-secondary transition-colors uppercase font-black">
                                    {sub.bookTitle}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-secondary/40 font-bold uppercase tracking-widest">
                                      By {sub.author}
                                    </span>
                                    <span className="w-1 h-1 bg-secondary/20 rounded-full" />
                                    <span className="text-[10px] text-secondary/60 font-black uppercase tracking-tighter">
                                      {sub.category}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="col-span-3 text-right flex flex-col items-end">
                                <span className="text-white font-bold italic uppercase text-xs">
                                   {sub.userName}
                                </span>
                                <span className="text-[9px] text-white/20 uppercase tracking-widest mt-1">
                                  {formatDate(sub.createdAt)}
                                </span>
                              </div>

                              <div className="col-span-3 md:col-span-2 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="text-secondary font-esports font-black text-3xl italic digital-glow leading-none">
                                      +{sub.pointsEarned}
                                  </span>
                                  <div className="flex items-center gap-1 mt-1 text-[10px] text-secondary/40">
                                      <Star size={10} fill="currentColor" />
                                      <span className="font-mono">{sub.rating}/10</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <EmptyState message="No techniques recorded in this manifest..." />
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  <div className="p-6 md:p-10">
                    <AnimatePresence mode="popLayout">
                      {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="animate-pulse bg-white/5 border border-white/10 rounded-2xl h-[410px] w-full" />
                          ))}
                        </div>
                      ) : filteredSubmissions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {filteredSubmissions.map((sub) => (
                            <motion.div
                              key={sub.submissionId}
                              initial={{ opacity: 0, y: 30, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -20, scale: 0.95 }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              layout
                            >
                              <SubmissionCard submission={sub} />
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState message="No techniques recorded in this manifest..." />
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

const LeaderboardSkeleton = () => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="animate-pulse grid grid-cols-12 gap-4 px-10 py-8 items-center">
        <div className="col-span-1 h-6 bg-primary/5 rounded-full w-8" />
        <div className="col-span-6 md:col-span-7 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/5 rounded-full" />
          <div className="h-4 bg-primary/5 rounded-full w-32" />
        </div>
        <div className="col-span-3 h-4 bg-primary/5 rounded-full ml-auto w-12" />
        <div className="col-span-2 md:col-span-1 h-4 bg-primary/5 rounded-full ml-auto w-12" />
      </div>
    ))}
  </>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="py-32 text-center">
    <p className="text-primary/20 italic font-bold font-esports text-2xl uppercase tracking-widest">{message}</p>
  </div>
);

export default Arena;
