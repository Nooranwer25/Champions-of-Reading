import React, { useEffect, useRef } from 'react';

interface CursedConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'talisman';
  sway: number;
  swaySpeed: number;
}

export const CursedConfetti: React.FC<CursedConfettiProps> = ({ active, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    const particles: ConfettiParticle[] = [];
    const colors = [
      '#F8E71C', // Bright neon yellow
      '#9333EA', // Deep purple
      '#3B82F6', // Cursed blue
      '#EC4899', // Resonance pink
      '#10B981', // Emerald green energy
    ];

    const shapes: ('rect' | 'circle' | 'talisman')[] = ['rect', 'circle', 'talisman'];

    // Create a particle burst from both bottom corners or center
    const createParticle = (side: 'left' | 'right' | 'center'): ConfettiParticle => {
      let x = canvas.width / 2;
      let y = canvas.height + 20;
      let vx = (Math.random() - 0.5) * 15;
      let vy = -(Math.random() * 20 + 15);

      if (side === 'left') {
        x = 50;
        vx = Math.random() * 15 + 5;
        vy = -(Math.random() * 18 + 12);
      } else if (side === 'right') {
        x = canvas.width - 50;
        vx = -(Math.random() * 15 + 5);
        vy = -(Math.random() * 18 + 12);
      }

      const size = Math.random() * 6 + 4;
      const shape = shapes[Math.floor(Math.random() * shapes.length)];

      return {
        x,
        y,
        vx,
        vy,
        size,
        width: shape === 'talisman' ? size * 0.7 : size,
        height: shape === 'talisman' ? size * 1.8 : size,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        opacity: 1,
        shape,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.08 + 0.02,
      };
    };

    // Initial burst from sides and center
    for (let i = 0; i < 70; i++) {
      particles.push(createParticle('left'));
      particles.push(createParticle('right'));
    }
    for (let i = 0; i < 60; i++) {
      particles.push(createParticle('center'));
    }

    const gravity = 0.35;
    const drag = 0.985;
    let duration = 300; // frames (~5 seconds at 60fps)
    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        // Physics
        p.vy += gravity;
        p.vx *= drag;
        p.vy *= drag;

        p.x += p.vx + Math.sin(p.sway) * 0.5;
        p.y += p.vy;

        p.rotation += p.rotationSpeed;
        p.sway += p.swaySpeed;

        // Fade out near the end
        if (duration < 60) {
          p.opacity = duration / 60;
        }

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        // Custom shadow bloom for primary gold color to match magical look
        if (p.color === '#F8E71C') {
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#F8E71C';
        }

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'talisman') {
          // Talisman slips (Jujutsu themed)
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
          // Add a subtle middle line to look like cursed talisman scribbles
          ctx.fillStyle = '#000000';
          ctx.globalAlpha = p.opacity * 0.3;
          ctx.fillRect(-1, -p.height / 2 + 2, 2, p.height - 4);
        } else {
          // Standard rect confetti
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }

        ctx.restore();

        // Recycle or keep updated inside screenspace
        if (p.y > canvas.height + 40) {
          p.opacity = 0; // mark for deletion / fade
        }
      });

      duration--;

      if (duration > 0 && particles.some((p) => p.opacity > 0)) {
        animationId = requestAnimationFrame(animate);
      } else {
        if (onComplete) {
          onComplete();
        }
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      id="cursed-confetti-canvas"
      className="fixed inset-0 w-screen h-screen pointer-events-none z-[9999]"
    />
  );
};
