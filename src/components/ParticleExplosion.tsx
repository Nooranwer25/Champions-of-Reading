import React, { useEffect, useRef } from 'react';

interface ParticleExplosionProps {
  active: boolean;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape: 'circle' | 'star' | 'square' | 'ring';
  rotation: number;
  rotationSpeed: number;
  glow: boolean;
  gravity: number;
}

export const ParticleExplosion: React.FC<ParticleExplosionProps> = ({ active, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Define fixed dimension for the explosion stage
    const size = 800;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;

    const particles: Particle[] = [];
    const colors = [
      '#FFDF00', // Golden Yellow
      '#FFB800', // Rich Gold
      '#F59E0B', // Yellow-Orange
      '#FBBF24', // Light Gold
      '#FEF08A', // Pale Yellow
      '#FFFFFF', // Pure Light Spark
    ];

    const shapes: ('circle' | 'star' | 'square' | 'ring')[] = ['circle', 'star', 'square', 'ring'];

    // Spawn burst
    const particleCount = 100;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      // High velocity blast
      const speed = Math.random() * 14 + 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      const pSize = Math.random() * 6 + 2;
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      particles.push({
        x: centerX,
        y: centerY,
        vx,
        vy,
        size: pSize,
        color,
        alpha: 1.0,
        // Fade rate between 0.015 and 0.035
        decay: Math.random() * 0.02 + 0.015,
        shape,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        glow: color !== '#FFFFFF' || Math.random() > 0.4,
        gravity: (Math.random() * 0.1) - 0.02, // very slight gravity or upward draft
      });
    }

    let animationId: number;
    const friction = 0.95; // slows down outward movement

    const drawStar = (c: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      c.stroke();
      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, size, size);

      let alive = false;

      particles.forEach((p) => {
        if (p.alpha <= 0) return;

        alive = true;

        // Physics updates
        p.vx *= friction;
        p.vy *= friction;
        p.vy += p.gravity;

        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.rotation += p.rotationSpeed;

        if (p.alpha < 0) p.alpha = 0;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;

        // Apply neon glow blur to golden and purple particles
        if (p.glow) {
          ctx.shadowBlur = p.size * 2.5;
          ctx.shadowColor = p.color;
        }

        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Draw different shapes
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          drawStar(ctx, 0, 0, 5, p.size * 1.5, p.size * 0.6);
        } else if (p.shape === 'square') {
          ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
        } else if (p.shape === 'ring') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 1.2, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      });

      if (alive) {
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
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      id="button-particle-explosion"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none z-50 select-none mix-blend-screen"
    />
  );
};
