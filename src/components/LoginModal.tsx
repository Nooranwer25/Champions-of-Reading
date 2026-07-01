import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, ShieldCheck, Sword, Zap, BookOpen } from 'lucide-react';
import { signInWithGoogle, signInAsGuest } from '../services/firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (error: any) {
      console.error("Google login failed", error);
      alert(error.message || 'Authentication failed. Please try opening in a new tab.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    try {
      await signInAsGuest();
      onClose();
    } catch (e) {
      console.error("Guest login failed", e);
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-surface-charcoal border border-primary/20 w-full max-w-4xl relative overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)' }}
          >
            {/* Left side: Benefits */}
            <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-primary/10 relative overflow-hidden bg-gradient-to-br from-surface to-surface-charcoal">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="text-[10px] uppercase font-mono tracking-[0.5em] text-primary/60 mb-2">The Reading Colony</div>
                <h2 className="text-4xl md:text-5xl font-esports italic text-on-surface mb-8 uppercase tracking-tighter">
                  Why Join <br /><span className="text-primary">The Tournament?</span>
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-sm border border-primary/20">
                      <Trophy className="text-primary w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface uppercase tracking-wide mb-1">Climb the Leaderboards</h3>
                      <p className="text-sm text-on-surface-variant font-medium">Earn points for every tome you conquer. Prove your mastery against other champions in real-time rankings.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-sm border border-primary/20">
                      <Sword className="text-primary w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface uppercase tracking-wide mb-1">Unlock Achievements</h3>
                      <p className="text-sm text-on-surface-variant font-medium">Complete daily missions and claim exclusive titles as you refine your reading technique.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-sm border border-primary/20">
                      <BookOpen className="text-primary w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface uppercase tracking-wide mb-1">Track Your Library</h3>
                      <p className="text-sm text-on-surface-variant font-medium">Build your permanent archive of conquered tomes and watch your cursed energy reserves grow.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Login Options */}
            <div className="w-full md:w-96 p-8 md:p-12 flex flex-col justify-center relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-on-surface-variant/50 hover:text-primary transition-colors p-2"
              >
                <X size={20} />
              </button>
              
              <div className="text-center mb-10">
                <div className="w-16 h-16 mx-auto bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 rotate-45">
                  <Zap className="text-primary w-6 h-6 -rotate-45" />
                </div>
                <h3 className="text-2xl font-esports uppercase tracking-widest text-on-surface italic">Enter Domain</h3>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="w-full relative group bg-white hover:bg-gray-50 text-black px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden shadow-lg disabled:opacity-50"
                  style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}
                >
                  <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.58c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.58-2.77c-.98.66-2.23 1.06-3.7 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="relative z-10">{isGoogleLoading ? 'Authenticating...' : 'Sign In with Google'}</span>
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-primary/10"></div>
                  <span className="flex-shrink-0 mx-4 text-[10px] text-on-surface-variant/50 uppercase tracking-widest">or</span>
                  <div className="flex-grow border-t border-primary/10"></div>
                </div>

                <button
                  onClick={handleGuestLogin}
                  disabled={isGuestLoading}
                  className="w-full relative group bg-surface-charcoal border border-primary/30 hover:border-primary text-primary px-6 py-4 text-xs font-black italic uppercase tracking-widest transition-all duration-300 flex items-center justify-center overflow-hidden disabled:opacity-50"
                  style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}
                >
                  <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative z-10 group-hover:text-black transition-colors duration-300">
                    {isGuestLoading ? 'Loading...' : 'Guest Access'}
                  </span>
                </button>
              </div>

              <p className="mt-8 text-center text-[10px] text-on-surface-variant/40 font-mono">
                By entering the domain, you agree to the Binding Vows and Culling Statutes.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
