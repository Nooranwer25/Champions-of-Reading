import React from 'react';
import { motion } from 'motion/react';

interface Particle {
  id: number;
  color: string;
  size: number;
  shape: 'rect' | 'circle' | 'triangle' | 'star';
  startX: string;
  startY: string;
  physics: {
    x: number[];
    y: number[];
    rotate: number[];
    scale: number[];
    opacity: number[];
  };
  duration: number;
  delay: number;
}

interface CelebrationConfettiProps {
  active: boolean;
}

const COLORS = [
  '#F8E71C', // Bright Neon Yellow / Gold
  '#A855F7', // Cursed Purple
  '#3B82F6', // Cerulean Blue
  '#EC4899', // Resonance Pink
  '#10B981', // Sorcery Green
  '#F97316', // Energy Orange
];

const SHAPES: ('rect' | 'circle' | 'triangle' | 'star')[] = ['rect', 'circle', 'triangle', 'star'];

const generateParticles = (count: number): Particle[] => {
  const particles: Particle[] = [];
  
  for (let i = 0; i < count; i++) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const size = Math.random() * 12 + 8; // 8px to 20px
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    
    // Choose starting location (33% bottom-left, 33% bottom-right, 34% bottom-center)
    const spawnRoll = Math.random();
    let startX = '50%';
    let startY = '100%';
    let targetXDist = 0;
    let targetYUp = 0;

    if (spawnRoll < 0.35) {
      // Bottom left corner shooting up-right
      startX = '5%';
      startY = '95%';
      targetXDist = Math.random() * 400 + 150; // travel right
      targetYUp = -(Math.random() * 500 + 350); // shoot up
    } else if (spawnRoll < 0.70) {
      // Bottom right corner shooting up-left
      startX = '95%';
      startY = '95%';
      targetXDist = -(Math.random() * 400 + 150); // travel left
      targetYUp = -(Math.random() * 500 + 350); // shoot up
    } else {
      // Bottom center radiating outward
      startX = '50%';
      startY = '95%';
      targetXDist = (Math.random() - 0.5) * 500; // radiate left/right
      targetYUp = -(Math.random() * 600 + 400); // shoot high
    }

    // Motion keyframes
    const physics = {
      x: [0, targetXDist * 0.4, targetXDist, targetXDist * 1.1],
      y: [0, targetYUp, targetYUp + (Math.random() * 150 + 100), targetYUp + 350],
      rotate: [0, Math.random() * 720 - 360, Math.random() * 1440 - 720, Math.random() * 2160 - 1080],
      scale: [0, 1.2, 1, 0.4],
      opacity: [0, 1, 0.9, 0],
    };

    const duration = Math.random() * 1.8 + 2.2; // 2.2s to 4s
    const delay = Math.random() * 0.4; // staggered starts

    particles.push({
      id: i,
      color,
      size,
      shape,
      startX,
      startY,
      physics,
      duration,
      delay,
    });
  }

  return particles;
};

export const CelebrationConfetti: React.FC<CelebrationConfettiProps> = ({ active }) => {
  if (!active) return null;

  // Generate 120 unique, vibrant particles for a grand, celebratory feel
  const particles = React.useMemo(() => generateParticles(120), []);

  return (
    <div className="fixed inset-0 w-screen h-screen pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p) => {
        const shapeStyle: React.CSSProperties = {
          width: `${p.size}px`,
          height: `${p.size}px`,
          backgroundColor: p.shape !== 'triangle' && p.shape !== 'star' ? p.color : undefined,
          boxShadow: p.color === '#F8E71C' ? '0 0 12px #F8E71C' : undefined,
        };

        return (
          <motion.div
            key={p.id}
            initial={{ 
              opacity: 0, 
              scale: 0, 
              x: 0, 
              y: 0,
              left: p.startX,
              top: p.startY
            }}
            animate={{
              x: p.physics.x,
              y: p.physics.y,
              rotate: p.physics.rotate,
              scale: p.physics.scale,
              opacity: p.physics.opacity,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.1, 0.6, 0.25, 1], // beautiful custom easing curve for gravity & deceleration
              times: [0, 0.25, 0.75, 1],
            }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
          >
            {p.shape === 'circle' && (
              <div style={shapeStyle} className="rounded-full" />
            )}
            {p.shape === 'rect' && (
              <div style={shapeStyle} className="rounded-sm" />
            )}
            {p.shape === 'triangle' && (
              <div 
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: `${p.size / 2}px solid transparent`,
                  borderRight: `${p.size / 2}px solid transparent`,
                  borderBottom: `${p.size}px solid ${p.color}`,
                  filter: p.color === '#F8E71C' ? 'drop-shadow(0 0 6px #F8E71C)' : undefined,
                }} 
              />
            )}
            {p.shape === 'star' && (
              <svg
                width={p.size}
                height={p.size}
                viewBox="0 0 24 24"
                fill={p.color}
                style={{
                  filter: p.color === '#F8E71C' ? 'drop-shadow(0 0 6px #F8E71C)' : undefined,
                }}
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
