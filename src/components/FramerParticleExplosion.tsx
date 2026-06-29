import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Star, Flame, Award, Zap } from 'lucide-react';

interface Particle {
  id: string;
  x: number;
  y: number;
  scale: number;
  rotate: number;
  color: string;
  delay: number;
  duration: number;
  type: 'spark' | 'ring' | 'star' | 'emoji' | 'aura';
  emoji?: string;
  glow: boolean;
}

interface FramerParticleExplosionProps {
  active: boolean;
  type: 'badge' | 'rank' | 'both';
  onComplete?: () => void;
}

export const FramerParticleExplosion: React.FC<FramerParticleExplosionProps> = ({
  active,
  type,
  onComplete,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Determine colors based on the trigger type
    const badgeColors = [
      '#FFDF00', // Gold
      '#FF9F00', // Amber
      '#FF5E00', // Dark Orange
      '#FFD700', // Bright Gold
      '#FFEAA7', // Light Gold
    ];

    const rankColors = [
      '#a855f7', // Purple/Aura
      '#ec4899', // Pink
      '#3b82f6', // Cyan/Blue
      '#10b981', // Emerald
      '#f43f5e', // Rose
    ];

    const colors = type === 'badge' ? badgeColors : type === 'rank' ? rankColors : [...badgeColors, ...rankColors];
    const particleTypes: ('spark' | 'ring' | 'star' | 'aura')[] = ['spark', 'ring', 'star', 'aura'];
    const emojis = type === 'badge' ? ['🏆', '✨', '👑', '🥇', '🔮'] : ['⚡', '🔥', '⚔️', '🔮', '✨'];

    const newParticles: Particle[] = [];
    const count = type === 'both' ? 60 : 45;

    for (let i = 0; i < count; i++) {
      // Create random radial vectors
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 220; // Explosion radius
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - (Math.random() * 50); // slight upward float

      const sizeVal = Math.random();
      const pType = sizeVal < 0.4 ? 'spark' : sizeVal < 0.6 ? 'star' : sizeVal < 0.85 ? 'ring' : 'aura';
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      newParticles.push({
        id: `framer-p-${i}-${Math.random()}`,
        x,
        y,
        scale: Math.random() * 1.2 + 0.4,
        rotate: Math.random() * 360 + (Math.random() > 0.5 ? 360 : -360),
        color,
        delay: Math.random() * 0.25, // Staggered release
        duration: 0.8 + Math.random() * 0.9,
        type: pType,
        glow: Math.random() > 0.3,
      });
    }

    // Add a few custom emoji particles for extra celebration
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 150;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 20;

      newParticles.push({
        id: `framer-emoji-${i}-${Math.random()}`,
        x,
        y,
        scale: Math.random() * 0.8 + 0.6,
        rotate: (Math.random() - 0.5) * 90,
        color: '',
        delay: 0.05 + Math.random() * 0.2,
        duration: 1.2 + Math.random() * 0.6,
        type: 'emoji',
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        glow: false,
      });
    }

    setParticles(newParticles);

    // Auto-clean after execution completes
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [active, type, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <div 
      id="framer-particle-explosion-container"
      className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center overflow-hidden"
    >
      {/* Central Flash Effect */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: [1, 15], opacity: [0.8, 0] }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`absolute w-8 h-8 rounded-full ${
          type === 'badge' ? 'bg-amber-400/40' : 'bg-primary/40'
        } blur-md pointer-events-none`}
      />

      {/* Radial particle field */}
      <div className="relative w-0 h-0">
        <AnimatePresence>
          {particles.map((p) => {
            return (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  scale: [0, p.scale, p.scale * 0.7, 0],
                  opacity: [1, 1, 0.8, 0],
                  rotate: p.rotate,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: [0.1, 0.8, 0.3, 1], // customized decelerating slide
                }}
                style={{
                  position: 'absolute',
                  transform: 'translate(-50%, -50%)',
                }}
                className="pointer-events-none"
              >
                {/* Specific shape renders */}
                {p.type === 'spark' && (
                  <div
                    className="rounded-full"
                    style={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: p.color,
                      boxShadow: p.glow ? `0 0 12px ${p.color}, 0 0 4px ${p.color}` : 'none',
                    }}
                  />
                )}

                {p.type === 'star' && (
                  <Star
                    size={14}
                    fill={p.color}
                    stroke={p.color}
                    style={{
                      filter: p.glow ? `drop-shadow(0 0 6px ${p.color})` : 'none',
                    }}
                  />
                )}

                {p.type === 'ring' && (
                  <div
                    className="rounded-full border border-current bg-transparent"
                    style={{
                      width: '12px',
                      height: '12px',
                      color: p.color,
                      boxShadow: p.glow ? `inset 0 0 6px ${p.color}, 0 0 6px ${p.color}` : 'none',
                    }}
                  />
                )}

                {p.type === 'aura' && (
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="rounded-full opacity-60 filter blur-[2px]"
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: p.color,
                      boxShadow: `0 0 16px ${p.color}`,
                    }}
                  />
                )}

                {p.type === 'emoji' && (
                  <span className="text-xl select-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                    {p.emoji}
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
