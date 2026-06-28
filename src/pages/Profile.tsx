import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useTheme } from '../services/ThemeContext';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError } from '../services/firebase';
import { Submission, SubmissionStatus } from '../types';
import { motion, AnimatePresence, useSpring, useTransform } from 'motion/react';
import { Book, Clock, CheckCircle, XCircle, Award, TrendingUp, Pencil, Zap, Shield, Target, Camera, Loader2, Sparkles, X, Download, Share2, BookOpen, Flame } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BADGES, getBadgeIcon } from '../constants/badges';
import { getTechniqueSummary } from '../services/koganeService';
import { getGlobalRank } from '../services/rankingService';
import { ProgressDashboard } from '../components/ProgressDashboard';
import { ReadingGoals } from '../components/ReadingGoals';
import { CursedEnergyParticles } from '../components/CursedEnergyParticles';
import { CursedConfetti } from '../components/CursedConfetti';
import { GenreDistribution } from '../components/GenreDistribution';
import { AnimatedFlame } from '../components/AnimatedFlame';
import { ReadingHistoryChart } from '../components/ReadingHistoryChart';
import { ReadingTimeline } from '../components/ReadingTimeline';
import { TrophyTracker } from '../components/TrophyTracker';

const AnimatedNumber = ({ value }: { value: number }) => {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (current) => Math.floor(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

const DomainBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20">
      <div className="absolute inset-0 domain-grid-bg" />
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: Math.random() * 100 - 50 + '%' }}
          animate={{ 
            opacity: [0, 0.5, 0],
            y: [-100, 1100],
            rotate: [0, 360]
          }}
          transition={{ 
            duration: 10 + Math.random() * 20,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear"
          }}
          className="absolute text-[80px] font-black italic text-primary/10 select-none kanji-watermark whitespace-nowrap"
        >
          領域展開
        </motion.div>
      ))}
    </div>
  );
};

const Profile: React.FC = () => {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [hoveredSubmission, setHoveredSubmission] = useState<Submission | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [aiSummary, setAiSummary] = useState<{ content: string; bookTitle: string } | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState<string | null>(null);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [copiedBadgeId, setCopiedBadgeId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<typeof BADGES[number] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    profileBannerUrl: '',
    favoriteGenres: [] as string[]
  });

  const GENRES = [
    'Dark Fantasy', 'Cyberpunk', 'Eldritch Horror', 'Shonen', 'Seinen', 
    'Mystery', 'Philosophy', 'Science Fiction', 'Classic Literature', 
    'Historical Fiction', 'Grimdark', 'Utopian'
  ];

  useEffect(() => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        profileBannerUrl: profile.profileBannerUrl || '',
        favoriteGenres: profile.favoriteGenres || []
      });
    }
  }, [profile, isEditing]);

  const handleSave = async () => {
    if (!user) return;
    setUploading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: editForm.displayName,
        bio: editForm.bio,
        profileBannerUrl: editForm.profileBannerUrl,
        favoriteGenres: editForm.favoriteGenres
      });
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, 'update', `/users/${user.uid}`);
    } finally {
      setUploading(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setEditForm(prev => {
      const exists = prev.favoriteGenres.includes(genre);
      return {
        ...prev,
        favoriteGenres: exists 
          ? prev.favoriteGenres.filter(g => g !== genre)
          : [...prev.favoriteGenres, genre]
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Only images are accepted for transcription.');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 300;

          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          
          try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { photoURL: base64 });
          } catch (err) {
            handleFirestoreError(err, 'update', `/users/${user.uid}`);
          } finally {
            setUploading(false);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      // Ignore
      setUploading(false);
    }
  };

  const handleGenerateSummary = async (e: React.MouseEvent, submission: Submission) => {
    e.stopPropagation();
    if (generatingSummary) return;

    setGeneratingSummary(submission.submissionId);
    try {
      const summary = await getTechniqueSummary(
        submission.bookTitle,
        submission.author,
        submission.synopsis,
        submission.assessment
      );
      setAiSummary({ content: summary, bookTitle: submission.bookTitle });
    } finally {
      setGeneratingSummary(null);
    }
  };

  const exportToCSV = () => {
    if (submissions.length === 0) return;

    const headers = [
      'Book Title',
      'Author',
      'Category',
      'Pages Read',
      'Rating',
      'Status',
      'Points Earned',
      'Impact Score',
      'Date Submitted',
      'Synopsis',
      'Assessment'
    ];

    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return '';
      let str = '';
      if (val instanceof Date) {
        str = val.toISOString();
      } else if (typeof val === 'object' && val.seconds) { // Firestore timestamp
        str = new Date(val.seconds * 1000).toLocaleDateString();
      } else {
        str = String(val);
      }
      // Escape double quotes
      const escaped = str.replace(/"/g, '""');
      // Wrap in quotes if it contains comma, newline, or double quote
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r') || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      return escaped;
    };

    const rows = submissions.map(sub => [
      escapeCSV(sub.bookTitle),
      escapeCSV(sub.author),
      escapeCSV(sub.category),
      escapeCSV(sub.pagesRead),
      escapeCSV(sub.rating),
      escapeCSV(sub.status),
      escapeCSV(sub.pointsEarned),
      escapeCSV(sub.impactScore),
      escapeCSV(sub.createdAt),
      escapeCSV(sub.synopsis),
      escapeCSV(sub.assessment)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${profile?.displayName || 'reading'}_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'submissions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: Submission[] = [];
      snapshot.forEach((doc) => {
        logs.push({ submissionId: doc.id, ...doc.data() } as Submission);
      });
      setSubmissions(logs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const fetchRank = async () => {
      if (profile) {
        const rank = await getGlobalRank(profile.totalPoints);
        setGlobalRank(rank);
      }
    };
    fetchRank();
  }, [profile?.totalPoints]);

  useEffect(() => {
    if (!profile || !profile.userId) return;

    const storageKey = `cursed_academy_seen_badges_${profile.userId}`;
    const initKey = `cursed_academy_seen_badges_init_${profile.userId}`;
    const rawSeen = localStorage.getItem(storageKey);
    const seenBadges: string[] = rawSeen ? JSON.parse(rawSeen) : [];
    const isInitialized = localStorage.getItem(initKey) === 'true';

    const currentBadges = profile.badges || [];

    if (!isInitialized) {
      // First time loading Profile on this device/browser for this user.
      // Initialize seen badges with existing badges so we don't burst confetti on load
      localStorage.setItem(storageKey, JSON.stringify(currentBadges));
      localStorage.setItem(initKey, 'true');
    } else {
      // Find badges that are in profile.badges but not in seenBadges
      const newBadges = currentBadges.filter(id => !seenBadges.includes(id));
      if (newBadges.length > 0) {
        // Trigger celebration for the first new badge we find
        const badgeId = newBadges[0];
        const badge = BADGES.find(b => b.id === badgeId);
        if (badge) {
          setNewlyUnlockedBadge(badge);
          setShowConfetti(true);
        }
        // Update seen list
        const updatedSeen = [...new Set([...seenBadges, ...currentBadges])];
        localStorage.setItem(storageKey, JSON.stringify(updatedSeen));
      }
    }
  }, [profile?.badges, profile?.userId]);

  const downloadSummaryReport = () => {
    if (!profile) return;

    const approvedCount = submissions.filter(s => s.status === SubmissionStatus.APPROVED).length;
    const pendingCount = submissions.filter(s => s.status === SubmissionStatus.PENDING).length;
    const rejectedCount = submissions.filter(s => s.status === SubmissionStatus.REJECTED).length;

    const earnedBadges = BADGES.filter(badge => profile?.badges?.includes(badge.id));
    const badgesText = earnedBadges.length > 0 
      ? earnedBadges.map(badge => `* [${badge.name}] - ${badge.description}`).join('\n')
      : 'No Vows Manifested yet.';

    const submissionsText = submissions.length > 0
      ? submissions.map(s => {
          const statusStr = s.status === SubmissionStatus.APPROVED ? 'SANCTIFIED' : s.status === SubmissionStatus.REJECTED ? 'EXORCISED' : 'ANALYZING';
          const pages = s.pagesRead !== undefined ? `${s.pagesRead} pages` : 'N/A';
          return `- ${s.bookTitle} by ${s.author} (${s.category?.toUpperCase()}) [${pages}] -> ${statusStr}`;
        }).join('\n')
      : 'No submissions recorded yet.';

    const reportContent = `============================================================
              CURSED ACADEMY: SORCERER DOSSIER              
============================================================

SORCERER PROFILE:
-----------------
Name:                  ${profile.displayName || 'Anonymous Sorcerer'}
Rank:                  ${profile.role || 'GRADE 4 SORCERER'}
Cursed Energy:         ${profile.totalPoints || 0} Points
Manifested Techniques: ${profile.tomesConquered || 0} Tomes Conquered
Colony Rank:           ${globalRank ? `#${globalRank}` : 'N/A'}

BIOGRAPHY:
----------
${profile.bio ? `"${profile.bio}"` : 'No biography recorded.'}

FAVORITE GENRES:
----------------
${profile.favoriteGenres && profile.favoriteGenres.length > 0 ? profile.favoriteGenres.join(', ') : 'None listed.'}

CURSED RECORD SUMMARY:
----------------------
- Sanctified (Approved): ${approvedCount}
- Analyzing (Pending):   ${pendingCount}
- Exorcised (Rejected):  ${rejectedCount}
- Total Records:         ${submissions.length}

MANIFESTED VOWS (ACHIEVEMENTS):
-------------------------------
${badgesText}

SUBMISSIONS JOURNAL:
--------------------
${submissionsText}

============================================================
           GENERATED AT: ${new Date().toLocaleString()} UTC           
============================================================
`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(profile.displayName || 'sorcerer').toLowerCase().replace(/\s+/g, '_')}_dossier.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareBadge = (badge: typeof BADGES[number], isEarned: boolean) => {
    if (!profile) return;
    
    const userName = profile.displayName || 'An anonymous sorcerer';
    
    const text = `============================================================
           🔮 CURSED ACADEMY: ACHIEVEMENT UNLOCKED 🔮           
============================================================

Sorcerer: ${userName} (${profile.role || 'Grade 4 Sorcerer'})
Vow:      ${badge.name}
Status:   ${isEarned ? '🔥 MANIFESTED' : '⭐ ALIGNING RESONANCE'}

"${badge.description}"

Requirement: ${badge.requirement}
Cursed Energy: ${profile.totalPoints || 0} pts | Tomes Conquered: ${profile.tomesConquered || 0}

Join the sorting & conquering of cursed tomes at Cursed Academy!
============================================================`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedBadgeId(badge.id);
      setTimeout(() => {
        setCopiedBadgeId(null);
      }, 3000);
    }).catch((err) => {
      // Ignore
    });
  };

  const shareScholarlyFeatsSummary = () => {
    if (!profile) return;
    
    const userName = profile.displayName || 'An anonymous sorcerer';
    const earnedBadges = BADGES.filter(badge => profile.badges?.includes(badge.id));
    const totalBadges = BADGES.length;
    
    let achievementsList = '';
    if (earnedBadges.length === 0) {
      achievementsList = 'No accomplishments manifested yet. The path of study lies ahead.';
    } else {
      achievementsList = earnedBadges.map((badge, idx) => {
        return `[${idx + 1}] 🔮 ${badge.name}\n    "${badge.description}"\n    Requirement: ${badge.requirement}`;
      }).join('\n\n');
    }
    
    const text = `============================================================
            🔮 CURSED ACADEMY: SCHOLARLY FEATS 🔮           
============================================================

Archivist: ${userName} (${profile.role || 'Grade 4 Sorcerer'})
Academy Rank: ${globalRank ? `#${globalRank}` : 'Grade 4'}
Cursed Energy: ${profile.totalPoints || 0} pts
Tomes Sealed: ${profile.tomesConquered || 0}
Progress: ${earnedBadges.length} / ${totalBadges} Feats Unlocked

-------------------- MANIFESTED FEATS ----------------------

${achievementsList}

============================================================
       Earned & Recorded in the Sacred Archives of 
                 The Cursed Academy.
============================================================`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSummary(true);
      setTimeout(() => {
        setCopiedSummary(false);
      }, 3000);
    }).catch((err) => {
      // Ignore
    });
  };

  const totalPagesRead = submissions
    .filter(s => s.status === SubmissionStatus.APPROVED)
    .reduce((acc, s) => acc + (s.pagesRead || 0), 0);

  const stats = [
    { label: 'Cursed Energy', value: profile?.totalPoints || 0, icon: <TrendingUp className="text-primary" /> },
    { label: 'Manifested Techniques', value: profile?.tomesConquered || 0, icon: <Book className="text-primary" /> },
    { label: 'Pages Conquered', value: totalPagesRead, icon: <BookOpen className="text-primary" /> },
    { label: 'Awaiting Judgment', value: submissions.filter(s => s.status === SubmissionStatus.PENDING).length, icon: <Clock className="text-yellow-500" /> },
    { label: 'Colony Rank', value: globalRank ? `#${globalRank}` : 'N/A', icon: <Award className="text-primary" /> },
    { label: 'Daily Streak', value: profile?.dailyStreak || 0, icon: <Flame className="text-orange-500" /> },
  ];

  const getStatusBadge = (status: SubmissionStatus) => {
    switch(status) {
      case SubmissionStatus.APPROVED:
        return (
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#a3e635] font-black italic bg-[#a3e635]/5 px-3 py-1 border border-[#a3e635]/20 shadow-[0_0_15px_rgba(163,230,53,0.1)]"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CheckCircle size={14} className="drop-shadow-[0_0_3px_#a3e635]" />
            </motion.div>
            SANCTIFIED
          </motion.span>
        );
      case SubmissionStatus.REJECTED:
        return (
          <motion.span 
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-red-500 font-black italic bg-red-500/5 px-3 py-1 border border-red-500/20"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0], opacity: [1, 0.7, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              <XCircle size={14} className="drop-shadow-[0_0_3px_#ef4444]" />
            </motion.div>
            EXORCISED
          </motion.span>
        );
      default:
        return (
          <motion.span 
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-yellow-500 font-black italic bg-yellow-500/5 px-3 py-1 border border-yellow-500/20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Clock size={14} />
            </motion.div>
            ANALYZING
          </motion.span>
        );
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12 relative overflow-hidden">
      <DomainBackground />
      <CursedEnergyParticles totalPagesRead={totalPagesRead} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="relative mb-24">
          {/* Profile Banner */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-48 md:h-64 w-full relative overflow-hidden group shadow-2xl border-b border-primary/10"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 98% 100%, 2% 100%, 0% 85%)' }}
          >
            {profile?.profileBannerUrl ? (
              <img 
                src={profile.profileBannerUrl} 
                alt="Banner" 
                className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 hover:scale-105" 
              />
            ) : (
              <div className="w-full h-full bg-black/40 domain-grid-bg opacity-40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
            
            <div className="absolute bottom-10 right-10 flex flex-wrap gap-3 z-20 justify-end">
              <button 
                onClick={downloadSummaryReport}
                className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-primary/20 px-4 py-2 text-[10px] uppercase font-black tracking-widest text-primary/60 hover:text-primary hover:border-primary/40 transition-all cursor-pointer"
                style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
              >
                <Download size={14} /> Download Summary
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-primary/20 px-4 py-2 text-[10px] uppercase font-black tracking-widest text-primary/60 hover:text-primary hover:border-primary/40 transition-all"
                style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
              >
                <Pencil size={14} /> Edit Territory
              </button>
            </div>
          </motion.div>

          <header className="flex flex-col md:flex-row items-center md:items-end gap-12 border-b border-primary/20 pb-16 px-6 -mt-24 relative z-10">
            <div className="relative group">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-40 h-40 rounded-none border-4 border-primary/20 bg-surface overflow-hidden shadow-2xl relative cursed-energy-aura"
              >
                <img 
                  src={profile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
                  alt={profile?.displayName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </motion.div>
              <div className="absolute -bottom-4 right-1/2 translate-x-1/2 md:translate-x-0 md:-right-4 bg-primary text-black px-6 py-2 rounded-none text-[10px] uppercase font-black tracking-widest shadow-xl italic" style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}>
                {profile?.role || 'GRADE 4 SORCERER'}
              </div>
            </div>
            
            <div className="text-center md:text-left flex-grow">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-6xl md:text-7xl font-esports italic text-on-surface tracking-tighter uppercase digital-glow leading-none"
                >
                  {profile?.displayName}
                </motion.h2>
                {(profile?.dailyStreak ?? 0) > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 px-4 py-2 mt-2 md:mt-0 md:ml-4"
                    style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0% 100%)' }}
                  >
                    <AnimatedFlame size={20} />
                    <span className="text-orange-500 font-black italic tracking-widest text-sm">
                      {profile?.dailyStreak} DAY STREAK
                    </span>
                  </motion.div>
                )}
              </div>

              {profile?.bio && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  className="text-on-surface-variant font-bold italic mb-6 max-w-2xl leading-relaxed"
                >
                  "{profile.bio}"
                </motion.p>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
                {profile?.favoriteGenres?.map((genre, i) => (
                  <span key={i} className="px-3 py-1 bg-secondary/5 border border-secondary/10 text-[9px] uppercase tracking-widest font-black text-secondary/60 italic rounded-md">
                    {genre}
                  </span>
                ))}
              </div>

              <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.1 }}
                 className="flex flex-wrap justify-center md:justify-start gap-4"
              >
                {profile?.titles.map((title, i) => (
                  <span key={i} className="px-6 py-2 bg-primary/10 border border-primary/20 text-[10px] uppercase tracking-[0.3em] font-black text-primary italic">
                    {title}
                  </span>
                ))}
                {(!profile?.titles || profile.titles.length === 0) && (
                  <span className="text-primary/20 font-bold italic uppercase tracking-widest uppercase">Technique Manifesting...</span>
                )}
              </motion.div>
            </div>
          </header>
        </div>

        {/* Reading Goals Component */}
        <ReadingGoals submissions={submissions} />

        {/* Progress Dashboard */}
        <ProgressDashboard submissions={submissions} />

        {/* Genre Distribution Doughnut Chart */}
        <GenreDistribution submissions={submissions} />

        {/* Territory Trophies Tracker */}
        <TrophyTracker submissions={submissions} />

        {/* Scholarly Feats (Achievements) */}
        <section className="mb-24">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12 border-b border-primary/20 pb-8">
            <div>
              <h3 className="text-4xl font-esports italic text-on-surface uppercase tracking-tighter digital-glow">Scholarly Feats</h3>
              <span className="text-[10px] uppercase font-esports tracking-[0.3em] text-primary/40 font-black italic block mt-1">Archivist Achievements & Milestones</span>
            </div>
            
            <button
              onClick={shareScholarlyFeatsSummary}
              className={`flex items-center gap-2 border text-[10px] uppercase font-bold tracking-widest px-5 py-2.5 transition-all duration-300 cursor-pointer rounded-xl ${
                copiedSummary 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                  : theme === 'dark'
                    ? 'bg-primary/10 hover:bg-primary/20 border-primary/30 hover:border-primary/50 text-primary shadow-[0_0_15px_rgba(250,204,21,0.05)]'
                    : 'bg-primary/10 hover:bg-primary/20 border-primary/30 hover:border-primary/50 text-primary-dark shadow-[0_0_15px_rgba(234,179,8,0.05)]'
              }`}
              title="Copy all unlocked achievements as a styled text report to clipboard"
            >
              <Share2 size={12} className={copiedSummary ? "animate-bounce" : ""} />
              {copiedSummary ? 'SUMMARY COPIED!' : 'SHARE FEATS SUMMARY'}
            </button>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BADGES.map((badge, idx) => {
              const isEarned = profile?.badges?.includes(badge.id);
              const Icon = getBadgeIcon(badge.iconName);
              
              // Calculate progress
              let progress = 0;
              if (isEarned) {
                progress = 100;
              } else if (profile) {
                switch(badge.id) {
                  case 'first_submission':
                    progress = submissions.length > 0 ? 100 : 0;
                    break;
                  case 'books_5': {
                    const approvedCount = submissions.filter(s => s.status === SubmissionStatus.APPROVED).length;
                    progress = (approvedCount / 5) * 100;
                    break;
                  }
                  case 'points_1000':
                    progress = (profile.totalPoints / 1000) * 100;
                    break;
                  case 'tomes_10': {
                    const approvedCount = submissions.filter(s => s.status === SubmissionStatus.APPROVED).length;
                    progress = (approvedCount / 10) * 100;
                    break;
                  }
                  case 'pages_1000': {
                    const totalPages = submissions
                      .filter(s => s.status === SubmissionStatus.APPROVED)
                      .reduce((sum, s) => sum + (Number(s.pagesRead) || 0), 0);
                    progress = (totalPages / 1000) * 100;
                    break;
                  }
                  case 'high_impact': {
                    const maxImpact = Math.max(0, ...submissions.map(s => s.impactScore || 0));
                    progress = (maxImpact / 10) * 100;
                    break;
                  }
                  case 'master_reviewer': {
                    if (profile?.role === 'archivist') {
                      progress = ((profile.tomesConquered || 0) / 20) * 100;
                    } else {
                      progress = 0;
                    }
                    break;
                  }
                  default:
                    progress = 0;
                }
              }
              progress = Math.min(100, progress);

              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: idx * 0.08, 
                    type: 'spring', 
                    stiffness: 90, 
                    damping: 15 
                  }}
                  whileHover={{ 
                    y: -6,
                    scale: 1.02,
                    boxShadow: isEarned 
                      ? theme === 'dark' 
                        ? '0 12px 40px -8px rgba(250, 204, 21, 0.15), 0 0 1px 1px rgba(250, 204, 21, 0.2)' 
                        : '0 12px 40px -8px rgba(234, 179, 8, 0.25), 0 0 1px 1px rgba(234, 179, 8, 0.3)'
                      : theme === 'dark'
                        ? '0 12px 30px -8px rgba(255, 255, 255, 0.03)'
                        : '0 12px 30px -8px rgba(0, 0, 0, 0.05)',
                    transition: { duration: 0.25, ease: "easeOut" } 
                  }}
                  onClick={() => {
                    if (isEarned) {
                      setNewlyUnlockedBadge(badge);
                      setShowConfetti(false);
                      setTimeout(() => setShowConfetti(true), 50);
                    }
                  }}
                  className={`group relative p-6 backdrop-blur-md rounded-2xl flex flex-col gap-6 overflow-hidden transition-all duration-300 border ${
                    isEarned 
                      ? 'cursor-pointer border-primary/20 hover:border-primary/50' 
                      : 'border-white/5 opacity-60 hover:opacity-100'
                  } ${
                    theme === 'dark'
                      ? 'bg-white/[0.02] hover:bg-white/[0.05]'
                      : 'bg-black/[0.01] hover:bg-black/[0.03]'
                  }`}
                >
                  {/* Glass reflections & light sweeps */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-20 pointer-events-none" />
                  
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                  />

                  <div className="flex items-start gap-5 relative z-10">
                    <motion.div 
                      initial={{ scale: 0.8, rotate: isEarned ? 0 : -15 }}
                      animate={{ scale: 1, rotate: isEarned ? 12 : 0 }}
                      className={`p-3.5 backdrop-blur-sm rounded-xl border flex-shrink-0 flex items-center justify-center transition-all ${
                        isEarned 
                          ? 'bg-primary/10 border-primary/30 group-hover:bg-primary/20 group-hover:border-primary/50 shadow-[0_0_15px_rgba(250,204,21,0.05)]' 
                          : 'bg-white/5 border-white/10 opacity-30 shadow-none'
                      }`}
                    >
                      <Icon className={`${isEarned ? badge.color : 'text-on-surface-variant/40'}`} size={24} />
                    </motion.div>
                    
                    <div className="flex-grow">
                      <div className={`text-lg font-esports font-bold uppercase mb-1 tracking-wider flex items-center gap-2 ${
                        isEarned ? 'text-on-surface digital-glow' : 'text-on-surface-variant/50'
                      }`}>
                        {badge.name}
                        {isEarned && <Sparkles size={11} className="text-primary animate-pulse flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-on-surface-variant/80 font-medium leading-relaxed max-w-[220px]">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 relative z-10 mt-auto">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-primary/40 italic">
                        {isEarned ? 'UNLOCKED' : 'PROVING REQUISITES'}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-primary">
                        {Math.floor(progress)}%
                      </span>
                    </div>
                    
                    {/* Glassy Progress Track */}
                    <div className="relative h-1.5 w-full bg-white/5 dark:bg-black/30 border border-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: idx * 0.05 }}
                        className={`absolute inset-y-0 left-0 rounded-full ${
                          isEarned 
                            ? 'bg-gradient-to-r from-primary/50 via-primary to-primary shadow-[0_0_12px_#F8E71C]' 
                            : 'bg-primary/20'
                        }`}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-white/5 dark:border-white/5 border-black/5">
                      <p className="text-[10px] text-on-surface-variant/60 tracking-wide font-medium">
                        Req: {badge.requirement}
                      </p>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareBadge(badge, !!isEarned);
                        }}
                        className={`flex items-center gap-1.5 border text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 transition-all duration-300 cursor-pointer rounded-lg ${
                          theme === 'dark'
                            ? 'bg-white/[0.04] hover:bg-primary/10 border-white/10 hover:border-primary/40 text-on-surface-variant hover:text-primary'
                            : 'bg-black/[0.02] hover:bg-primary/10 border-black/10 hover:border-primary/40 text-on-surface-variant hover:text-primary-dark'
                        }`}
                        title="Copy achievement summary to clipboard"
                      >
                        <Share2 size={10} className={copiedBadgeId === badge.id ? "animate-ping" : ""} />
                        {copiedBadgeId === badge.id ? 'COPIED!' : 'SHARE'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-24">
          {stats.map((stat, i) => {
            const isCursedEnergy = stat.label === 'Cursed Energy';
            const isTechniques = stat.label === 'Manifested Techniques';
            const isPages = stat.label === 'Pages Conquered';
            const isRank = stat.label === 'Colony Rank';
            const isStreak = stat.label === 'Daily Streak';

            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="bg-black/40 border border-primary/10 p-10 relative overflow-hidden group transition-colors hover:border-primary/30"
                style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)' }}
              >
                {isCursedEnergy && (
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-primary/20 blur-[100px] pointer-events-none"
                  />
                )}
                
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
                
                <div className="mb-6 flex items-center justify-between">
                  <div className="text-primary group-hover:scale-110 transition-transform">
                    {isStreak ? (
                      <AnimatedFlame size={28} />
                    ) : (
                      React.cloneElement(stat.icon as React.ReactElement<any>, { size: 28 })
                    )}
                  </div>
                  {isCursedEnergy && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="text-primary/20" size={16} />
                    </motion.div>
                  )}
                  {isTechniques && (
                    <div className="flex gap-1">
                      {[...Array(3)].map((_, j) => (
                        <motion.div
                          key={j}
                          animate={{ 
                            y: [0, -4, 0],
                            opacity: [0.3, 1, 0.3]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            delay: j * 0.4,
                            ease: "easeInOut" 
                          }}
                          className="w-1 h-3 bg-primary/30"
                        />
                      ))}
                    </div>
                  )}
                  {isPages && (
                    <div className="flex gap-1 items-end">
                      {[...Array(4)].map((_, j) => (
                        <motion.div
                          key={j}
                          animate={{ 
                            height: [8, 16, 8],
                          }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity, 
                            delay: j * 0.25,
                            ease: "easeInOut" 
                          }}
                          className="w-1 bg-primary/30"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-5xl font-esports font-black italic text-on-surface mb-2 digital-glow flex items-baseline gap-2">
                  {typeof stat.value === 'number' ? (
                    <AnimatedNumber value={stat.value} />
                  ) : (
                    stat.value
                  )}
                  {isCursedEnergy && <span className="text-xs text-primary/40 font-black tracking-normal">CE</span>}
                </div>
                
                <div className="text-[10px] uppercase font-esports tracking-[0.2em] text-primary/40 font-bold italic mb-4">{stat.label}</div>

                {isRank && typeof globalRank === 'number' && (
                  <div className="relative h-1.5 w-full bg-primary/5 border border-primary/10 mt-4">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(10, 100 - (globalRank * 2))}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_10px_#F8E71C]"
                    />
                    <div className="absolute -top-6 right-0 text-[8px] font-black italic text-primary/40 uppercase tracking-widest">
                      Top {globalRank < 10 ? 'Elite' : 'Competitor'}
                    </div>
                  </div>
                )}

                {isCursedEnergy && (
                  <div className="mt-4 flex gap-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <motion.div
                        key={idx}
                        className="h-1 flex-grow bg-primary/10"
                        animate={{
                          backgroundColor: (profile?.totalPoints || 0) > (idx + 1) * 200 ? '#F8E71C' : 'rgba(248, 231, 28, 0.1)'
                        }}
                      />
                    ))}
                  </div>
                )}

                {isPages && (
                  <div className="mt-4 flex items-center justify-between text-[8px] font-mono font-bold text-primary/40 uppercase tracking-widest pt-2 border-t border-white/5">
                    <span>Aura Mass:</span>
                    <span className="text-primary font-black">x{(1 + (totalPagesRead || 0) / 1000).toFixed(2)}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </section>

        {/* Reading Frequency Chart Visualization */}
        <ReadingHistoryChart submissions={submissions} />

        {/* Reading Timeline Visualization */}
        <ReadingTimeline submissions={submissions} />

        {/* Submission History */}
        <section>
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-16 border-b border-primary/20 pb-10">
            <div>
              <h3 className="text-5xl font-esports italic text-on-surface uppercase tracking-tighter">Technique Archive</h3>
              <p className="text-[11px] uppercase font-esports tracking-[0.2em] text-primary/40 font-black italic mt-2">
                {submissions.length} Manifestations Recorded
              </p>
            </div>
            {submissions.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-primary/10 border border-primary/30 hover:bg-primary/20 hover:border-primary px-4 py-2 text-xs uppercase font-esports font-bold tracking-widest text-primary transition-all cursor-pointer active:scale-95"
              >
                <Download size={14} />
                Export to CSV
              </button>
            )}
          </header>

          <div className="space-y-8">
            {loading ? (
              <div className="py-24 text-center text-primary/20 italic font-black font-esports text-2xl uppercase tracking-widest animate-pulse">Scanning records...</div>
            ) : submissions.length > 0 ? (
              submissions.map((log, i) => (
                <motion.div 
                  key={log.submissionId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  onHoverStart={() => setHoveredSubmission(log)}
                  onHoverEnd={() => setHoveredSubmission(null)}
                  onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                  className={`bg-black/40 border p-8 flex flex-col md:flex-row gap-10 group cursor-pointer transition-all relative overflow-hidden shadow-xl ${
                    log.status === SubmissionStatus.APPROVED 
                      ? 'border-[#a3e635]/20 hover:border-[#a3e635]/40 hover:shadow-[#a3e635]/5 group-hover:bg-[#a3e635]/5' 
                      : log.status === SubmissionStatus.REJECTED
                      ? 'border-red-500/10 opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'
                      : 'border-primary/10 hover:border-primary/40 shadow-xl hover:shadow-primary/5'
                  }`}
                  style={{ clipPath: 'polygon(2% 0, 100% 0, 98% 100%, 0% 100%)' }}
                  onClick={() => setSelectedSubmission(log)}
                >
                   <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="flex-shrink-0 w-28 h-40 bg-black/40 rounded-none overflow-hidden self-center md:self-start border border-primary/20 shadow-xl cursed-energy-aura flex items-center justify-center">
                    {log.coverImageUrl ? (
                      <img 
                        src={log.coverImageUrl} 
                        alt={log.bookTitle} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-primary/5 opacity-40" />
                        <Book size={40} className="text-primary/20 relative z-10 transition-transform group-hover:scale-110" />
                      </>
                    )}
                  </div>
                  <div className="flex-grow">

                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-4xl font-esports italic text-on-surface group-hover:text-primary transition-colors leading-none uppercase mb-2">
                          {log.bookTitle}
                        </h4>
                        <div className="flex gap-4 items-center">
                          <span className="text-sm font-sans text-primary/40 italic uppercase tracking-widest font-bold">Sorcerer: {log.author}</span>
                          <button
                            onClick={(e) => handleGenerateSummary(e, log)}
                            disabled={generatingSummary === log.submissionId}
                            className={`flex items-center gap-2 text-[10px] uppercase font-black tracking-widest px-3 py-1 bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all ${generatingSummary === log.submissionId ? 'animate-pulse' : ''}`}
                            title="Generate AI Technique Insight"
                          >
                            {generatingSummary === log.submissionId ? (
                              <Loader2 size={12} className="animate-spin text-primary" />
                            ) : (
                              <Sparkles size={12} className="text-primary" />
                            )}
                            <span className="digital-glow">Insight</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 text-right">
                        {getStatusBadge(log.status)}
                        {log.createdAt && (
                          <span className="text-[10px] font-mono tracking-widest text-primary/20 uppercase font-black italic">
                            {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-white/60 font-sans font-bold line-clamp-2 leading-relaxed italic border-l-2 border-primary/20 pl-6">
                      "{log.synopsis}"
                    </p>

                    {log.judgeNotes && (
                      <div className="mt-8 p-6 bg-primary/5 border border-primary/10 relative">
                         <div className="absolute top-0 right-6 -translate-y-1/2 bg-surface px-3 text-[10px] uppercase font-black tracking-widest text-primary">Ref Judgment</div>
                        <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} prose-xs max-w-none prose-p:leading-relaxed prose-p:text-primary/70 prose-p:italic prose-p:font-bold`}>
                          <ReactMarkdown>
                            {log.judgeNotes}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col justify-between items-center md:items-end gap-8 min-w-[160px] pt-8 md:pt-0 border-t md:border-t-0 md:border-l border-primary/10 md:pl-10">
                    <div className="text-center md:text-right">
                       <div className="text-[10px] uppercase tracking-[0.3em] text-primary/20 font-black italic mb-2">Energy Gain</div>
                       <div className="text-5xl font-esports font-black text-primary digital-glow">+{log.pointsEarned}</div>
                    </div>
                    <div className="flex flex-col gap-3">
                      {log.impactScore && (
                        <div className="text-center md:text-right">
                           <div className="text-[10px] uppercase tracking-[0.3em] text-primary/20 font-black italic mb-2">Refinement</div>
                           <div className="text-2xl font-esports font-black text-on-surface/80 italic">{log.impactScore}</div>
                        </div>
                      )}
                      {log.status === SubmissionStatus.PENDING && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/submit?edit=${log.submissionId}`);
                          }}
                          className="mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black text-[10px] uppercase font-black tracking-widest hover:bg-white transition-all shadow-lg active:scale-95"
                          style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0% 100%)' }}
                        >
                          <Pencil size={12} /> Refine
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-40 text-center bg-black/40 border-2 border-dashed border-primary/10 relative overflow-hidden" style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}>
                 <div className="absolute inset-0 bg-domain opacity-5 pointer-events-none" />
                <p className="text-primary/20 italic font-black font-esports text-3xl mb-8 uppercase tracking-widest">Technique History Unwritten...</p>
                <button
                  onClick={() => navigate('/submit')}
                  className="px-12 py-5 bg-primary text-black font-esports font-black italic text-xl uppercase tracking-widest hover:bg-white transition-all shadow-2xl active:scale-95"
                  style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
                >
                  Initiate First Vow
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {hoveredSubmission && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{ 
              position: 'fixed',
              left: mousePos.x + 20,
              top: mousePos.y + 20,
              zIndex: 300,
              pointerEvents: 'none'
            }}
            className="w-80 bg-black/90 backdrop-blur-xl border-l-4 border-primary p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]"
          >
            <div className="text-[10px] uppercase font-black tracking-widest text-primary/40 mb-2 italic">Technique Insight</div>
            <h5 className="text-xl font-esports italic text-on-surface uppercase mb-1">{hoveredSubmission.bookTitle}</h5>
            <div className="text-[10px] text-primary/60 font-bold uppercase tracking-widest mb-4">By {hoveredSubmission.author}</div>
            <div className="h-px bg-primary/20 mb-4" />
            <p className="text-[12px] text-white/70 leading-relaxed italic line-clamp-4">
              {hoveredSubmission.synopsis}
            </p>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-[10px] font-esports text-primary italic font-black">+{hoveredSubmission.pointsEarned} CE</span>
              <span className="text-[10px] text-white/20 uppercase font-black">{hoveredSubmission.category}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiSummary && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAiSummary(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-black border-2 border-primary/20 p-12 overflow-hidden shadow-[0_0_50px_rgba(248,231,28,0.1)]"
              style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles size={120} className="text-primary" />
              </div>

              <div className="relative">
                <div className="flex justify-between items-end mb-8 border-b border-primary/20 pb-6">
                  <div>
                    <div className="text-[10px] uppercase font-black tracking-[0.5em] text-primary mb-2 italic">DOMAIN INSIGHT</div>
                    <h3 className="text-4xl font-esports italic text-on-surface uppercase tracking-tighter digital-glow">{aiSummary.bookTitle}</h3>
                  </div>
                  <button 
                    onClick={() => setAiSummary(null)}
                    className="p-3 text-primary/40 hover:text-primary transition-colors"
                  >
                    <XCircle size={24} />
                  </button>
                </div>

                <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} prose-lg max-w-none text-on-surface/80 font-sans italic leading-relaxed first-letter:text-5xl first-letter:font-esports first-letter:text-primary first-letter:mr-3 first-letter:float-left`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {aiSummary.content}
                  </ReactMarkdown>
                </div>

                <div className="mt-12 flex justify-center">
                  <button
                    onClick={() => setAiSummary(null)}
                    className="px-12 py-3 bg-primary/5 border border-primary/20 text-[10px] uppercase font-black tracking-[0.5em] text-primary hover:bg-primary/10 transition-all italic"
                    style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
                  >
                    Close Manifestation
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSubmission(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            />
            <motion.div
              layoutId={selectedSubmission.submissionId}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-black border border-primary/20 overflow-hidden shadow-[0_0_100px_rgba(248,231,28,0.1)] flex flex-col lg:flex-row"
              style={{ clipPath: 'polygon(2% 0, 98% 0, 100% 4%, 100% 96%, 98% 100%, 2% 100%, 0 96%, 0 4%)' }}
            >
              <button 
                onClick={() => setSelectedSubmission(null)}
                className="absolute top-8 right-8 z-20 bg-primary/10 backdrop-blur-md p-4 rounded-none text-primary/60 hover:text-primary transition-all transform hover:rotate-90 border border-primary/20"
              >
                <XCircle size={28} />
              </button>

              <div className="lg:w-2/5 relative h-[500px] lg:h-auto group">
                {selectedSubmission.coverImageUrl ? (
                  <img 
                    src={selectedSubmission.coverImageUrl} 
                    alt={selectedSubmission.bookTitle} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-black/40 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-primary/5 opacity-20" />
                    <Book size={160} className="text-primary/5 relative z-10" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-12 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <div className="text-[12px] uppercase font-black tracking-[0.5em] text-primary mb-4 italic backdrop-blur-sm inline-block">TECHNIQUE REGISTERED</div>
                  <h3 className="text-6xl font-esports italic text-on-surface mb-4 leading-none uppercase digital-glow">{selectedSubmission.bookTitle}</h3>
                  <p className="text-xl text-primary/60 italic font-bold uppercase tracking-widest">By Sorcerer {selectedSubmission.author}</p>
                </div>
              </div>

              <div className="lg:w-3/5 p-12 lg:p-20 overflow-y-auto max-h-[70vh] lg:max-h-none bg-black/60 relative">
                 <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Shield size={200} className="text-primary" />
                 </div>
                <div className="space-y-16 relative">
                  <div className="flex flex-wrap gap-12 items-center border-b border-primary/20 pb-12">
                    <div className="space-y-3">
                       <div className="text-[10px] uppercase font-black tracking-[0.3em] text-primary/30 italic">Status</div>
                       <div>{getStatusBadge(selectedSubmission.status)}</div>
                    </div>
                    <div className="space-y-3">
                       <div className="text-[10px] uppercase font-black tracking-[0.3em] text-primary/30 italic">Grade</div>
                       <div className="text-sm font-black text-on-surface uppercase tracking-[0.2em] bg-primary/10 px-3 py-1 border border-primary/20 italic">{selectedSubmission.category}</div>
                    </div>
                    <div className="space-y-3">
                       <div className="text-[10px] uppercase font-black tracking-[0.3em] text-primary/30 italic">Energy Reward</div>
                       <div className="text-4xl font-esports font-black text-primary digital-glow">+{selectedSubmission.pointsEarned} <span className="text-xs tracking-normal">CE</span></div>
                    </div>
                  </div>

                  <div className="grid gap-16">
                    <div className="space-y-8">
                      <h4 className="text-[12px] uppercase font-black tracking-[0.4em] text-primary/30 border-l-8 border-primary pl-6 italic">The Binding Synopsis</h4>
                      <p className="text-xl font-bold leading-relaxed text-white/70 italic bg-white/5 p-8 border-l-2 border-primary/20">
                        {selectedSubmission.synopsis}
                      </p>
                    </div>

                    <div className="space-y-8">
                      <h4 className="text-[12px] uppercase font-black tracking-[0.4em] text-primary/30 border-l-8 border-primary pl-6 italic">Refinement Technique</h4>
                      <div className="p-10 bg-primary/5 border border-primary/10 relative">
                        <div className="absolute top-0 right-10 -translate-y-1/2 flex gap-3 bg-black px-4 py-2 border border-primary/20">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Zap key={star} size={14} className={star <= selectedSubmission.rating ? 'text-primary fill-primary shadow-[0_0_8px_#F8E71C]' : 'text-primary/5'} />
                          ))}
                        </div>
                        <p className="text-xl font-bold leading-relaxed text-white/90 italic">
                           {selectedSubmission.assessment}
                        </p>
                      </div>
                    </div>

                    {selectedSubmission.judgeNotes && (
                      <div className="space-y-8">
                        <h4 className="text-[12px] uppercase font-black tracking-[0.4em] text-primary border-l-8 border-primary pl-6 italic digital-glow">Kogane's Final Verdict</h4>
                        <div className="p-12 bg-primary/10 border-2 border-primary/20 italic relative">
                           <div className="absolute -top-4 -left-4">
                              <Target size={40} className="text-primary animate-pulse" />
                           </div>
                          <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} prose-lg max-w-none prose-p:leading-relaxed prose-p:text-primary/90 prose-p:font-bold prose-p:m-0`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {selectedSubmission.judgeNotes}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
             <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-surface-charcoal border-2 border-primary/20 p-8 md:p-12 overflow-y-auto max-h-[90vh] shadow-[0_0_50px_rgba(248,231,28,0.1)]"
              style={{ clipPath: 'polygon(2% 0, 98% 0, 100% 2%, 100% 98%, 98% 100%, 2% 100%, 0 98%, 0 2%)' }}
            >
              <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                <div>
                  <div className="text-[10px] uppercase font-black tracking-[0.5em] text-primary mb-2 italic">TERRITORY MODIFICATION</div>
                  <h3 className="text-4xl font-esports italic text-on-surface uppercase tracking-tighter digital-glow">Refine Your Vows</h3>
                </div>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-white/20 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40 mb-3 block">DisplayName (Technique Alias)</label>
                  <input 
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-on-surface focus:border-primary outline-none transition-all font-serif italic text-lg"
                    placeholder="Enter Alias"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40 mb-3 block">Sorcerer Portrait URL</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 flex-shrink-0">
                      <img 
                        src={profile?.photoURL || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} 
                        className="w-full h-full object-cover" 
                        alt="Preview"
                      />
                    </div>
                    <div className="flex-grow flex flex-col gap-2">
                       <label className="flex items-center gap-2 cursor-pointer bg-primary/10 hover:bg-primary/20 border border-primary/20 px-4 py-2 text-[10px] uppercase font-black tracking-widest text-primary transition-all w-fit">
                        <Camera size={14} /> Upload Snapshot
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                      </label>
                      <span className="text-[8px] text-white/20 uppercase font-bold italic">Max size: 1MB. Aspect: 1:1</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40 mb-3 block">Territory Banner URL</label>
                  <input 
                    type="text"
                    value={editForm.profileBannerUrl}
                    onChange={(e) => setEditForm({ ...editForm, profileBannerUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-on-surface focus:border-primary outline-none transition-all font-sans text-xs"
                    placeholder="https://image-vows.com/banner.jpg"
                  />
                  {editForm.profileBannerUrl && (
                    <div className="mt-2 h-20 bg-white/5 border border-white/10 overflow-hidden">
                      <img src={editForm.profileBannerUrl} className="w-full h-full object-cover" alt="Banner Preview" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40 mb-3 block">Binding Script (Bio)</label>
                  <textarea 
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-on-surface focus:border-primary outline-none transition-all font-sans italic text-sm min-h-[100px] resize-none"
                    placeholder="Declare your intent to the colony..."
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40 mb-4 block">Resonance Affinities (Genres)</label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map(genre => (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`px-4 py-2 text-[10px] uppercase font-black tracking-widest transition-all ${
                          editForm.favoriteGenres.includes(genre)
                            ? 'bg-primary text-black'
                            : 'bg-white/5 text-white/40 border border-white/10 hover:border-primary/40'
                        }`}
                        style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex gap-4">
                  <button
                    onClick={handleSave}
                    disabled={uploading}
                    className="flex-grow bg-primary text-black font-esports font-black italic text-sm uppercase tracking-[0.3em] py-4 hover:bg-white transition-all disabled:opacity-50"
                    style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}
                  >
                    {uploading ? 'Sealing Vows...' : 'Enfocrce Changes'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-8 border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confetti Animation Layer */}
      <CursedConfetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Achievement Celebration Modal */}
      <AnimatePresence>
        {newlyUnlockedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9990] flex items-center justify-center p-6"
            onClick={() => setNewlyUnlockedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 50, rotate: -3 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.85, y: 50, rotate: 3 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-zinc-950 border-2 border-primary w-full max-w-lg p-8 relative shadow-[0_0_50px_rgba(248,231,28,0.2)] text-center"
              style={{ clipPath: 'polygon(4% 0, 100% 0, 96% 100%, 0% 100%)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gold corners */}
              <div className="absolute top-0 left-0 w-8 h-[2px] bg-primary shadow-[0_0_10px_#F8E71C]" />
              <div className="absolute top-0 left-0 w-[2px] h-8 bg-primary shadow-[0_0_10px_#F8E71C]" />
              <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-primary shadow-[0_0_10px_#F8E71C]" />
              <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-primary shadow-[0_0_10px_#F8E71C]" />

              <button
                onClick={() => setNewlyUnlockedBadge(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="mb-6 inline-flex p-6 bg-primary/10 border border-primary/30 relative">
                {React.createElement(getBadgeIcon(newlyUnlockedBadge.iconName), {
                  className: `${newlyUnlockedBadge.color} animate-pulse`,
                  size: 48
                })}
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </div>

              <span className="text-[10px] uppercase font-esports tracking-[0.4em] text-primary font-black italic block mb-2">
                Technique Manifested!
              </span>
              <h3 className="text-3xl font-esports font-black italic uppercase tracking-tight text-on-surface mb-4 digital-glow-large">
                {newlyUnlockedBadge.name}
              </h3>
              
              <p className="text-xs text-white/70 font-sans italic leading-relaxed max-w-md mx-auto mb-6">
                "{newlyUnlockedBadge.description}"
              </p>

              <div className="bg-white/[0.02] border border-white/5 p-4 mb-8">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-black mb-1">
                  Exorcism Requirement
                </p>
                <p className="text-xs font-mono font-bold text-primary uppercase">
                  {newlyUnlockedBadge.requirement}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    shareBadge(newlyUnlockedBadge, true);
                  }}
                  className="flex items-center justify-center gap-2 bg-primary text-black font-esports font-black italic text-xs uppercase tracking-widest px-6 py-3 hover:bg-white transition-all cursor-pointer"
                  style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
                >
                  <Share2 size={12} />
                  SHARE ACHIEVEMENT
                </button>
                <button
                  onClick={() => setNewlyUnlockedBadge(null)}
                  className="border border-white/10 text-white/40 font-black text-xs uppercase tracking-wider px-6 py-3 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                >
                  Close Vow
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
