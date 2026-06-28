import React from 'react';
import { motion } from 'motion/react';
import { Flame } from 'lucide-react';

interface AnimatedFlameProps {
  size?: number;
}

export const AnimatedFlame: React.FC<AnimatedFlameProps> = ({ size = 20 }) => {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Flame Particle 1 (Red Accent) */}
      <motion.div
        className="absolute rounded-full bg-red-600/70 blur-[3px]"
        style={{ width: size * 0.5, height: size * 0.5 }}
        animate={{
          y: [0, -size * 0.65, 0],
          scale: [1, 1.3, 0.5],
          opacity: [0, 0.8, 0],
        }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
      {/* Flame Particle 2 (Orange Accent) */}
      <motion.div
        className="absolute rounded-full bg-orange-500/80 blur-[2px]"
        style={{ width: size * 0.45, height: size * 0.45 }}
        animate={{
          y: [0, -size * 0.8, 0],
          scale: [0.9, 1.25, 0.4],
          opacity: [0, 0.9, 0],
        }}
        transition={{
          duration: 1.7,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.35,
        }}
      />
      {/* Flame Particle 3 (Yellow Core) */}
      <motion.div
        className="absolute rounded-full bg-yellow-400/95 blur-[1.5px]"
        style={{ width: size * 0.4, height: size * 0.4 }}
        animate={{
          y: [0, -size * 0.95, 0],
          scale: [0.8, 1.2, 0.3],
          opacity: [0, 0.95, 0],
        }}
        transition={{
          duration: 1.1,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.7,
        }}
      />
      {/* Base Fire Glow */}
      <motion.div
        className="absolute rounded-full bg-orange-600 blur-[6px] opacity-40 pointer-events-none"
        style={{ width: size * 0.8, height: size * 0.8 }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Dynamic Main SVG Icon with custom styles */}
      <Flame 
        className="text-orange-500 relative z-10 filter drop-shadow-[0_2px_10px_rgba(249,115,22,0.7)]" 
        size={size} 
      />
    </div>
  );
};
