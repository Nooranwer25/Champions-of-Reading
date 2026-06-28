import React from 'react';
import { motion } from 'motion/react';

interface KoganeProps {
  size?: number;
  className?: string;
  speech?: string;
}

const Kogane: React.FC<KoganeProps> = ({ size = 100, className = "", speech }) => {
  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {speech && (
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute -top-20 bg-primary text-surface px-4 py-2 rounded-2xl rounded-bl-none font-esports font-bold italic text-sm shadow-xl z-20 whitespace-nowrap"
        >
          {speech}
          <div className="absolute -bottom-2 left-0 w-4 h-4 bg-primary transform rotate-45 -z-10"></div>
        </motion.div>
      )}
      <motion.div 
        className="kogane-float"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
          {/* Wings */}
          <motion.path 
            d="M20 50 Q 5 40 10 30 M80 50 Q 95 40 90 30" 
            fill="none" 
            stroke="#facc15" 
            strokeWidth="4" 
            strokeLinecap="round"
            animate={{ rotate: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          />
          {/* Body */}
          <circle cx="50" cy="50" r="30" fill="#facc15" />
          {/* Eye */}
          <circle cx="50" cy="50" r="15" fill="white" />
          <circle cx="50" cy="50" r="8" fill="black" />
          <motion.circle 
            cx="52" cy="48" r="3" fill="white" 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          {/* Glow effects */}
          <circle cx="50" cy="50" r="28" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" className="animate-spin-slow" />
        </svg>
      </motion.div>
    </div>
  );
};

export default Kogane;
