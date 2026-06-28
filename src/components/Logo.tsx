import React from 'react';
import { motion } from 'motion/react';

const Logo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({ className = "", size = 'md' }) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  
  return (
    <div className={`flex items-center gap-3 ${className}`} id="site-header-logo">
      <div className="relative flex items-center justify-center">
        {/* Pulsing neon radial glow aura behind the animated logo */}
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-125 animate-pulse"></div>
        
        <motion.div 
          className={`relative ${isSm ? 'w-10 h-10' : isLg ? 'w-32 h-32' : 'w-16 h-16'} flex items-center justify-center group`}
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          whileHover={{
            scale: 1.12,
            rotate: 3,
            transition: { duration: 0.3 }
          }}
          whileTap={{
            scale: 0.95,
            rotate: -2
          }}
        >
          <img 
            src="/logo.png" 
            alt="Champions of Reading Books" 
            className="absolute inset-0 w-full h-full object-contain z-10 filter drop-shadow-[0_0_15px_rgba(248,231,28,0.35)]"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>
      {!isSm && (
        <div className="flex flex-col">
          <span className={`${isLg ? 'text-4xl' : 'text-xl'} font-esports font-black text-primary italic tracking-tighter uppercase leading-none digital-glow`}>
            Champions
          </span>
          <span className={`${isLg ? 'text-[10px]' : 'text-[8px]'} uppercase tracking-[2px] text-on-surface-variant font-black leading-none mt-1 whitespace-nowrap`}>
            Of Reading Books
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
