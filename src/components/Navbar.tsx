import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { signInWithGoogle, auth, db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Settings, LogOut, User as UserIcon, Scroll, Sun, Moon } from 'lucide-react';
import { LeagueRules } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../services/ThemeContext';
import { LoginModal } from './LoginModal';

import Logo from './Logo';

const Navbar: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [hasNewRule, setHasNewRule] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const lastSeen = Number(localStorage.getItem('lastSeenRuleTime') || '0');
    
    const unsubscribe = onSnapshot(doc(db, 'config', 'league_rules'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as LeagueRules;
        const updateTime = data.lastUpdated?.toMillis() || 0;
        if (updateTime > lastSeen) {
          setHasNewRule(true);
        }
      }
    }, (error) => {
      // Ignore
    });

    return () => unsubscribe();
  }, [location.pathname]); // Re-check on navigation

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error?.message) alert(error.message);
    }
  };

  const handleLogout = () => auth.signOut();

  const navLinks = [
    { name: 'Rankings', path: '/arena' },
    { name: 'Techniques', path: '/submit' },
    { name: 'Profile', path: '/profile' },
    { name: 'Statutes', path: '/rules' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface-glass backdrop-blur-xl border-b border-primary/20 h-24 px-6 md:px-12 flex items-center justify-between">
      <Link to="/" className="hover:scale-105 transition-transform active:scale-95">
        <Logo />
      </Link>

      <nav className="hidden md:flex items-center gap-12 font-esports">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`text-xl uppercase tracking-widest font-black transition-all duration-300 hover:text-primary relative group italic ${
              location.pathname === link.path ? 'text-primary digital-glow' : 'text-on-surface-variant'
            }`}
          >
            {link.name}
            <span className="absolute -bottom-1 left-0 w-0 h-[4px] bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-6">
        {/* Dynamic Dual-State Theme Switch */}
        <div 
          className="relative flex items-center bg-neutral-950/60 border border-primary/20 rounded-full p-1 w-20 h-9 select-none transition-colors duration-300"
          title={theme === 'dark' ? "Switch to Scholar's Light Mode" : "Switch to Obsidian Dark Mode"}
        >
          {/* Obsidian / Dark side */}
          <button
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={`absolute left-1 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 ${
              theme === 'dark' ? 'text-primary' : 'text-on-surface-variant/40 hover:text-on-surface-variant'
            }`}
          >
            <Moon size={14} className={theme === 'dark' ? 'digital-glow' : ''} />
          </button>

          {/* Light / Scholar side */}
          <button
            onClick={() => theme !== 'light' && toggleTheme()}
            className={`absolute right-1 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 ${
              theme === 'light' ? 'text-primary' : 'text-on-surface-variant/40 hover:text-on-surface-variant'
            }`}
          >
            <Sun size={14} className={theme === 'light' ? 'digital-glow' : ''} />
          </button>

          {/* Slider bubble */}
          <motion.div
            className="w-7 h-7 rounded-full bg-primary/10 border border-primary shadow-[0_0_12px_rgba(250,204,21,0.35)] cursor-pointer"
            onClick={toggleTheme}
            layout
            animate={{
              x: theme === 'dark' ? 0 : 42
            }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 28
            }}
          />
        </div>
        <Link 
          to="/" 
          className="relative text-primary/40 hover:text-primary transition-all group"
        >
          <Scroll size={24} className="group-hover:rotate-12 transition-transform" />
          {hasNewRule && (
            <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center">
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute w-5 h-5 bg-primary/40 rounded-full animate-ping"
              />
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative w-3 h-3 bg-primary rounded-full border border-white/20 shadow-[0_0_15px_#F8E71C]"
              />
            </div>
          )}
        </Link>
        {user ? (
          <>
            {isAdmin && (
              <Link to="/oracle" className="text-primary/40 hover:text-primary transition-all">
                <Settings size={22} />
              </Link>
            )}
            <div className="group relative">
              <button className="w-12 h-12 rounded-none border-2 border-primary/20 overflow-hidden hover:scale-105 transition-transform flex items-center justify-center bg-black/40 cursed-energy-aura">
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Profile" className="w-full h-full object-cover" />
              </button>
              <div className="absolute right-0 mt-4 w-56 bg-black/90 backdrop-blur-2xl rounded-none shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all border border-primary/20 p-2" style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)' }}>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-4 text-xs uppercase tracking-[0.2em] font-black italic text-primary/60 hover:text-primary hover:bg-primary/5 transition-all">
                  <LogOut size={14} /> Sever Vows
                </button>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-primary text-black px-8 py-3 rounded-none font-esports font-black italic uppercase tracking-widest hover:bg-white hover:scale-105 hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all active:scale-95 shadow-[0_0_20px_rgba(248,231,28,0.3)]"
            style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
          >
            Manifest
          </button>
        )}
      </div>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </header>
  );
};

export default Navbar;
