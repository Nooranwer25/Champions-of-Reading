import React, { useState, useEffect, useMemo } from 'react';
import { Submission, SubmissionStatus, BookCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../services/AuthContext';
import { 
  Map, 
  Layers, 
  Compass, 
  Radio, 
  Sparkles, 
  Activity, 
  Eye, 
  Maximize2, 
  BookOpen, 
  Terminal,
  Grid,
  TrendingUp,
  Info
} from 'lucide-react';
import { playPageFlip } from '../services/audioService';

// Predefined Legendary Tome Records to guarantee a majestic density display right away
const DUMMY_MAP_TOMES = [
  {
    id: 'legend-1',
    bookTitle: 'Limitless Core Mechanics',
    author: 'Satoru Gojo',
    category: BookCategory.NON_FICTION,
    pagesRead: 640,
    sector: 'Citadel - Alpha Node',
    description: 'An exhaustive empirical breakdown of space convergence and divergent aura mechanics.',
    coordinate: { x: 1, y: 5 }
  },
  {
    id: 'legend-2',
    bookTitle: 'Echoes of the Six Paths',
    author: 'Ancient Sorcerer',
    category: BookCategory.POETRY,
    pagesRead: 120,
    sector: 'Spire - Pinnacle',
    description: 'A poetic manual comprising rhythmic verbal seals and continuous vocal triggers.',
    coordinate: { x: 5, y: 1 }
  },
  {
    id: 'legend-3',
    bookTitle: 'The Seven-to-Three Equilibrium',
    author: 'Kento Nanami',
    category: BookCategory.NON_FICTION,
    pagesRead: 450,
    sector: 'Citadel - Ratio Sector',
    description: 'A critical structural study on finding systemic vulnerabilities in corporate or cursed organizations.',
    coordinate: { x: 2, y: 4 }
  },
  {
    id: 'legend-4',
    bookTitle: 'Saga of the Divine General',
    author: 'Megumi Fushiguro',
    category: BookCategory.NOVEL,
    pagesRead: 810,
    sector: 'Lore - Western Valley',
    description: 'An epic tragedy narrating the endless cycle of the Ten Shadows ritual combatants.',
    coordinate: { x: 2, y: 2 }
  },
  {
    id: 'legend-5',
    bookTitle: 'Shadow Play & Puppetry',
    author: 'Kokichi Muta',
    category: BookCategory.NOVEL,
    pagesRead: 530,
    sector: 'Lore - Central Vault',
    description: 'A delicate sci-fi narrative detailing remote control consciousness transfer through heavenly restrictions.',
    coordinate: { x: 0, y: 2 }
  },
  {
    id: 'legend-6',
    bookTitle: 'Cursed Corpse Genesis',
    author: 'Masamichi Yaga',
    category: BookCategory.NON_FICTION,
    pagesRead: 310,
    sector: 'Citadel - South Gate',
    description: 'Technical notes on embedding three self-sufficient souls inside a static organic frame.',
    coordinate: { x: 0, y: 6 }
  },
  {
    id: 'legend-7',
    bookTitle: 'Crimson Hymns',
    author: 'Noritoshi Kamo',
    category: BookCategory.POETRY,
    pagesRead: 90,
    sector: 'Spire - Red Crypt',
    description: 'Vocal chants utilized to manipulate fluid circulation and pressure matrices.',
    coordinate: { x: 6, y: 2 }
  },
  {
    id: 'legend-8',
    bookTitle: 'Whispers from the Shadow Basin',
    author: 'Suguru Geto',
    category: BookCategory.NOVEL,
    pagesRead: 950,
    sector: 'Lore - Northern Border',
    description: 'A chilling anthology of logs capturing the collection and digestion of low-tier curses.',
    coordinate: { x: 1, y: 0 }
  }
];

// Map grid dimensions: 7x7 (0 to 6)
const GRID_SIZE = 7;

interface MapNode {
  x: number;
  y: number;
  category: BookCategory | 'wilderness';
  tomes: Array<{
    title: string;
    author: string;
    pages: number;
    isLegendary: boolean;
    description?: string;
  }>;
  totalPages: number;
  sectorName: string;
}

export const LibraryMap: React.FC = () => {
  const { user } = useAuth();
  const [liveSubmissions, setLiveSubmissions] = useState<Submission[]>([]);
  const [useDummyOnly, setUseDummyOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'flat' | 'isometric'>('isometric');
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [showScanlines, setShowScanlines] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [hoveredCell, setHoveredCell] = useState<MapNode | null>(null);

  // 1. Fetch Real Approved Submissions for current user
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'submissions'),
      where('userId', '==', user.uid),
      where('status', '==', SubmissionStatus.APPROVED)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs: Submission[] = [];
      snapshot.forEach((doc) => {
        subs.push({ submissionId: doc.id, ...doc.data() } as Submission);
      });
      setLiveSubmissions(subs);
    }, (err) => {
      console.error("Error loading approved submissions for Library Map:", err);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Hash function to map any book into a unique coordinate inside its respective territory
  const getHashCoords = (title: string, category: BookCategory): { x: number; y: number } => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);

    // Coordinate ranges for each territory
    if (category === BookCategory.NOVEL) {
      // Lore Dominion: X [0..3], Y [0..3]
      return {
        x: absHash % 4,
        y: absHash % 4
      };
    } else if (category === BookCategory.POETRY) {
      // Whispering Spires: X [4..6], Y [0..3]
      return {
        x: 4 + (absHash % 3),
        y: absHash % 4
      };
    } else {
      // Citadel of Truth: X [0..3], Y [4..6]
      return {
        x: absHash % 4,
        y: 4 + (absHash % 3)
      };
    }
  };

  // 3. Construct the 7x7 Geographic Library Map Matrix
  const mapGrid = useMemo(() => {
    // Initialize 7x7 empty grid
    const grid: MapNode[][] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[x] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        // Determine natural sector category
        let category: BookCategory | 'wilderness' = 'wilderness';
        let sectorName = '';

        if (x <= 3 && y <= 3) {
          category = BookCategory.NOVEL;
          sectorName = `Lore Sector [L-${x}${y}]`;
        } else if (x >= 4 && y <= 3) {
          category = BookCategory.POETRY;
          sectorName = `Spire Sector [S-${x}${y}]`;
        } else if (x <= 3 && y >= 4) {
          category = BookCategory.NON_FICTION;
          sectorName = `Citadel Sector [C-${x}${y}]`;
        } else {
          category = 'wilderness';
          sectorName = `Forbidden Fringe [F-${x}${y}]`;
        }

        grid[x][y] = {
          x,
          y,
          category,
          tomes: [],
          totalPages: 0,
          sectorName
        };
      }
    }

    // A. Add pre-loaded legendary files
    DUMMY_MAP_TOMES.forEach((dummy) => {
      const { x, y } = dummy.coordinate;
      if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        grid[x][y].tomes.push({
          title: dummy.bookTitle,
          author: dummy.author,
          pages: dummy.pagesRead,
          isLegendary: true,
          description: dummy.description
        });
        grid[x][y].totalPages += dummy.pagesRead;
      }
    });

    // B. Add live user submissions if not toggled off and they exist
    if (!useDummyOnly && liveSubmissions.length > 0) {
      liveSubmissions.forEach((sub) => {
        const { x, y } = getHashCoords(sub.bookTitle, sub.category);
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
          grid[x][y].tomes.push({
            title: sub.bookTitle,
            author: sub.author,
            pages: sub.pagesRead || 20,
            isLegendary: false,
            description: sub.synopsis || 'Manifested via culling game logs.'
          });
          grid[x][y].totalPages += sub.pagesRead || 20;
        }
      });
    }

    return grid;
  }, [liveSubmissions, useDummyOnly]);

  // Handle click on sector
  const handleCellClick = (x: number, y: number) => {
    playPageFlip();
    setSelectedCell(selectedCell?.x === x && selectedCell?.y === y ? null : { x, y });
  };

  const selectedNodeData = useMemo(() => {
    if (!selectedCell) return null;
    return mapGrid[selectedCell.x][selectedCell.y];
  }, [selectedCell, mapGrid]);

  // Overall statistics for the map
  const mapStats = useMemo(() => {
    let totalTomesCount = 0;
    let totalPagesCount = 0;
    let maxDensity = 0;

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const node = mapGrid[x][y];
        totalTomesCount += node.tomes.length;
        totalPagesCount += node.totalPages;
        if (node.totalPages > maxDensity) {
          maxDensity = node.totalPages;
        }
      }
    }

    return {
      totalTomesCount,
      totalPagesCount,
      maxDensity: maxDensity || 1
    };
  }, [mapGrid]);

  return (
    <div 
      id="library-activity-map"
      className="w-full bg-neutral-950/60 backdrop-blur-xl border border-primary/20 p-6 md:p-8 relative text-white"
      style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
    >
      {/* Absolute Scanlines layer */}
      {showScanlines && (
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-40 z-10" />
      )}

      {/* Futuristic Background Accents */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Panel */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 mb-8 border-b border-white/10 relative z-20">
        <div>
          <div className="flex items-center gap-3">
            <Map className="text-primary" size={22} />
            <span className="text-[10px] uppercase font-esports tracking-[0.4em] text-primary font-black italic block">
              Cartographic Interface
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl font-esports italic font-black uppercase text-on-surface tracking-tight mt-1">
            Library Density Map
          </h3>
          <p className="text-[10px] font-mono text-white/50 uppercase tracking-widest mt-1">
            Geographic grid visualization of reading frequency. Nodes intensify based on accumulated energy volume (pages read).
          </p>
        </div>

        {/* Map Control Cluster */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Flat vs Isometric Selector */}
          <div className="flex bg-black/40 border border-white/5 p-1 rounded">
            <button
              onClick={() => { playPageFlip(); setViewMode('isometric'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest transition-all cursor-pointer ${
                viewMode === 'isometric'
                  ? 'bg-primary text-black font-black'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Layers size={11} />
              Isometric 3D
            </button>
            <button
              onClick={() => { playPageFlip(); setViewMode('flat'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest transition-all cursor-pointer ${
                viewMode === 'flat'
                  ? 'bg-primary text-black font-black'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Grid size={11} />
              Flat HUD
            </button>
          </div>

          {/* Toggle Scanlines and Aura Vectors */}
          <button
            onClick={() => setShowScanlines(!showScanlines)}
            className={`p-2 border rounded transition-all cursor-pointer ${
              showScanlines ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-black/40 border-white/5 text-white/40 hover:text-white'
            }`}
            title="Toggle Scanning Grid Lines"
          >
            <Terminal size={14} />
          </button>

          <button
            onClick={() => setShowVectors(!showVectors)}
            className={`p-2 border rounded transition-all cursor-pointer ${
              showVectors ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-black/40 border-white/5 text-white/40 hover:text-white'
            }`}
            title="Toggle Aura Flow Vectors"
          >
            <Activity size={14} />
          </button>

          {/* Dummy vs Live Toggle */}
          {user && (
            <button
              onClick={() => { playPageFlip(); setUseDummyOnly(!useDummyOnly); }}
              className={`px-3 py-2 text-[9px] font-mono uppercase tracking-widest transition-all border cursor-pointer ${
                !useDummyOnly 
                  ? 'bg-secondary/15 border-secondary/40 text-secondary-light font-black' 
                  : 'bg-black/40 border-white/5 text-white/40 hover:text-white'
              }`}
            >
              {useDummyOnly ? "Show Live Log" : "Mute Live Log"}
            </button>
          )}

        </div>
      </div>

      {/* Main Container: Map Grid & Holographic Reading Sidepanel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start relative z-20">
        
        {/* Left Side: The Interactive Visual Grid (Col span 7) */}
        <div className="xl:col-span-7 flex flex-col items-center justify-center bg-black/40 border border-white/5 p-6 md:p-10 rounded-xl relative overflow-hidden select-none">
          
          {/* Compass Rose Backdrop overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Compass size={380} className="animate-[spin_120s_linear_infinite]" />
          </div>

          {/* Dynamic Map Legend Overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 text-[8px] font-mono text-white/40 uppercase bg-black/60 p-2.5 border border-white/5 rounded">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-primary shadow-[0_0_5px_#F8E71C]" />
              <span>Lore Dominion (Novel)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-purple-500 shadow-[0_0_5px_#a855f7]" />
              <span>Whispering Spire (Poetry)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-blue-500 shadow-[0_0_5px_#3b82f6]" />
              <span>Citadel of Truth (Non-Fiction)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-neutral-800" />
              <span>Forbidden Fringe (Empty)</span>
            </div>
          </div>

          {/* Interactive Cartesian Grid */}
          <div 
            className="w-full flex justify-center items-center py-6 perspective-[1000px]"
            style={{ perspective: '1200px' }}
          >
            <motion.div
              animate={{ 
                rotateX: viewMode === 'isometric' ? 52 : 0, 
                rotateZ: viewMode === 'isometric' ? -38 : 0,
                scale: viewMode === 'isometric' ? 0.95 : 1,
                y: viewMode === 'isometric' ? 10 : 0
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-7 gap-1.5 sm:gap-2.5 p-4 bg-neutral-900/30 border border-white/10 rounded-xl relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              
              {/* Outer grid boundary glows */}
              <div className="absolute inset-0 border border-primary/20 pointer-events-none rounded-xl animate-pulse" />

              {/* Vector flow lines overlay */}
              {showVectors && (
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent animate-[pulse_2s_infinite]" />
                  <div className="absolute top-3/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-secondary to-transparent animate-[pulse_3s_infinite]" />
                  <div className="absolute top-0 left-1/3 w-[1px] h-full bg-gradient-to-b from-transparent via-blue-500 to-transparent animate-[pulse_2.5s_infinite]" />
                </div>
              )}

              {/* Grid Cells Generation */}
              {mapGrid.map((column, x) => 
                column.map((node, y) => {
                  const isSelected = selectedCell?.x === x && selectedCell?.y === y;
                  const hasTomes = node.tomes.length > 0;
                  
                  // Calculate dynamic node opacity based on page count density
                  const densityRatio = node.totalPages / mapStats.maxDensity;
                  const bgOpacityClass = hasTomes
                    ? Math.max(0.15, Math.min(0.9, densityRatio))
                    : 0.02;

                  // Find natural styling based on category
                  let nodeColor = 'border-white/5 hover:border-white/20';
                  let activeGlow = '';
                  let baseBg = 'bg-white/[0.02]';

                  if (hasTomes) {
                    if (node.category === BookCategory.NOVEL) {
                      nodeColor = 'border-primary/40 hover:border-primary';
                      activeGlow = 'shadow-[0_0_12px_rgba(248,231,28,0.4)]';
                      baseBg = `bg-primary`;
                    } else if (node.category === BookCategory.POETRY) {
                      nodeColor = 'border-purple-500/40 hover:border-purple-400';
                      activeGlow = 'shadow-[0_0_12px_rgba(168,85,247,0.4)]';
                      baseBg = `bg-purple-500`;
                    } else if (node.category === BookCategory.NON_FICTION) {
                      nodeColor = 'border-blue-500/40 hover:border-blue-400';
                      activeGlow = 'shadow-[0_0_12px_rgba(59,130,246,0.4)]';
                      baseBg = `bg-blue-500`;
                    }
                  }

                  return (
                    <motion.div
                      key={`${x}-${y}`}
                      onClick={() => handleCellClick(x, y)}
                      onMouseEnter={() => setHoveredCell(node)}
                      onMouseLeave={() => setHoveredCell(null)}
                      whileHover={{ 
                        scale: 1.15, 
                        z: viewMode === 'isometric' ? 15 : 0,
                      }}
                      className={`
                        w-8 h-8 sm:w-11 sm:h-11 rounded flex items-center justify-center relative cursor-pointer border transition-all duration-300
                        ${nodeColor} ${isSelected ? 'border-white z-40 bg-white/20 scale-110' : ''}
                      `}
                      style={{ 
                        transformStyle: 'preserve-3d',
                        transform: isSelected ? 'translateZ(10px)' : 'translateZ(0px)'
                      }}
                    >
                      {/* Active density colored backing */}
                      {hasTomes && (
                        <div 
                          className={`absolute inset-0 rounded transition-all duration-500 ${activeGlow}`}
                          style={{ 
                            backgroundColor: node.category === BookCategory.NOVEL ? '#F8E71C' : node.category === BookCategory.POETRY ? '#a855f7' : '#3b82f6',
                            opacity: bgOpacityClass 
                          }}
                        />
                      )}

                      {/* Internal Coordinates or Symbols */}
                      <span className="text-[7px] font-mono font-bold tracking-tight text-white/30 relative z-10 select-none">
                        {x},{y}
                      </span>

                      {/* Pulse circle for highly dense zones */}
                      {hasTomes && densityRatio > 0.6 && (
                        <span className="absolute flex h-2 w-2 top-0.5 right-0.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                      )}

                      {/* Floating isometric bar graph height indicators if in isometric view */}
                      {viewMode === 'isometric' && hasTomes && (
                        <div 
                          className="absolute bottom-full left-1/2 -translate-x-1/2 w-1 sm:w-1.5 transition-all duration-700 pointer-events-none"
                          style={{
                            height: `${Math.max(8, densityRatio * 32)}px`,
                            backgroundColor: node.category === BookCategory.NOVEL ? '#F8E71C' : node.category === BookCategory.POETRY ? '#a855f7' : '#3b82f6',
                            transform: 'rotateX(-90deg) rotateY(45deg)',
                            transformOrigin: 'bottom center',
                            boxShadow: '0 0 8px rgba(255,255,255,0.2)'
                          }}
                        />
                      )}
                    </motion.div>
                  );
                })
              )}

            </motion.div>
          </div>

          {/* Quick HUD Hover Card */}
          <div className="w-full mt-4 h-6 text-center">
            <AnimatePresence mode="wait">
              {hoveredCell ? (
                <motion.div
                  key="hovered"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-[9px] font-mono uppercase tracking-widest text-primary font-black"
                >
                  📡 scanning {hoveredCell.sectorName} — {hoveredCell.tomes.length} documents identified ({hoveredCell.totalPages} Pages)
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  className="text-[9px] font-mono uppercase tracking-widest text-white/30"
                >
                  🛰️ Click sector coordinates to engage deep holographic readouts
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Right Side: Informative Scans / HUD (Col span 5) */}
        <div className="xl:col-span-5 flex flex-col h-full gap-6">
          
          {/* Detailed Selected Sector readouts */}
          <div 
            className="bg-black/30 border border-white/5 rounded-xl p-6 relative overflow-hidden"
            style={{ minHeight: '310px' }}
          >
            {/* Corner Bracket decorations */}
            <div className="absolute top-0 left-0 w-3 h-[1px] bg-white/20" />
            <div className="absolute top-0 left-0 w-[1px] h-3 bg-white/20" />
            <div className="absolute bottom-0 right-0 w-3 h-[1px] bg-white/20" />
            <div className="absolute bottom-0 right-0 w-[1px] h-3 bg-white/20" />

            <AnimatePresence mode="wait">
              {selectedNodeData ? (
                <motion.div
                  key={`selected-${selectedNodeData.x}-${selectedNodeData.y}`}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  className="space-y-6"
                >
                  {/* Title Header */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-primary uppercase tracking-widest block font-black">
                        Coordinate Location [{selectedNodeData.x}, {selectedNodeData.y}]
                      </span>
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded border ${
                        selectedNodeData.category === BookCategory.NOVEL ? 'bg-primary/10 border-primary/30 text-primary' :
                        selectedNodeData.category === BookCategory.POETRY ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                        selectedNodeData.category === BookCategory.NON_FICTION ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                        'bg-neutral-800 border-white/10 text-white/40'
                      }`}>
                        {selectedNodeData.category.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="text-xl font-esports font-black italic uppercase tracking-tight text-white mt-1">
                      {selectedNodeData.sectorName}
                    </h4>
                  </div>

                  {/* Sector Summary stats */}
                  <div className="grid grid-cols-2 gap-4 bg-white/[0.02] p-3 border border-white/5 rounded font-mono">
                    <div>
                      <span className="text-[8px] text-white/40 block">CONSTRUCT VOLUME</span>
                      <span className="text-lg font-bold text-white block">
                        {selectedNodeData.tomes.length} Documents
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] text-white/40 block">DENSITY COEFFICIENT</span>
                      <span className="text-lg font-bold text-primary block">
                        {selectedNodeData.totalPages} Pages
                      </span>
                    </div>
                  </div>

                  {/* Document Records in Sector */}
                  <div>
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mb-3">
                      Manifested Tome Archives
                    </span>

                    {selectedNodeData.tomes.length === 0 ? (
                      <div className="py-8 text-center text-white/30 border border-dashed border-white/5 rounded text-xs font-mono">
                        No material manifested in this region yet.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {selectedNodeData.tomes.map((tome, idx) => (
                          <div 
                            key={idx} 
                            className="bg-black/40 border border-white/5 p-3 rounded hover:border-white/10 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-esports font-bold uppercase tracking-wide text-white">
                                  {tome.title}
                                </h5>
                                <span className="text-[9px] font-mono text-white/40">By {tome.author}</span>
                              </div>
                              <span className="text-[10px] font-mono text-primary font-black whitespace-nowrap bg-primary/10 border border-primary/20 px-1.5 py-0.5">
                                {tome.pages}p
                              </span>
                            </div>
                            {tome.description && (
                              <p className="text-[10px] text-white/60 italic leading-relaxed mt-2 border-t border-white/5 pt-2">
                                "{tome.description}"
                              </p>
                            )}
                            {tome.isLegendary && (
                              <span className="text-[7px] font-mono bg-amber-500/25 border border-amber-500/50 text-amber-300 px-1 py-0.5 rounded uppercase tracking-widest mt-2 inline-block">
                                Legendary Artifact
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </motion.div>
              ) : (
                <motion.div
                  key="no-selected"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center text-white/40 py-16"
                >
                  <Compass size={40} className="text-white/20 animate-pulse mb-3" />
                  <p className="text-xs font-mono uppercase tracking-widest">
                    Aura Radar Disengaged
                  </p>
                  <p className="text-[10px] font-mono text-white/20 mt-1 max-w-xs">
                    Please select coordinates on the map grid to decode archived manifests.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Informational Guide & Summary statistics */}
          <div className="bg-black/20 border border-white/5 rounded-xl p-5 space-y-4">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">
              Overall Sector Registry Logs
            </span>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/[0.01] border border-white/5 p-3 rounded">
                <span className="text-[8px] font-mono text-white/30 block mb-1">TOTAL MAP SECTORS</span>
                <span className="text-xl font-bold font-esports italic text-white">49</span>
              </div>
              <div className="bg-white/[0.01] border border-white/5 p-3 rounded">
                <span className="text-[8px] font-mono text-white/30 block mb-1">RECORDED ARCHIVES</span>
                <span className="text-xl font-bold font-esports italic text-primary">{mapStats.totalTomesCount}</span>
              </div>
              <div className="bg-white/[0.01] border border-white/5 p-3 rounded">
                <span className="text-[8px] font-mono text-white/30 block mb-1">MAX NODE DENSITY</span>
                <span className="text-xl font-bold font-esports italic text-secondary-light">{mapStats.maxDensity}p</span>
              </div>
            </div>

            <div className="flex gap-2.5 items-start text-[10px] text-white/50 bg-white/[0.02] p-3 border border-white/5 rounded">
              <Info size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                As users log newly conquered volumes, their book titles are run through a cryptographic title-hashing routine mapping them to static localized sectors. Over-saturation in one sector unlocks elevated comprehension points!
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
