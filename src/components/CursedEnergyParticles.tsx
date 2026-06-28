import React, { useEffect, useRef } from 'react';

interface CursedEnergyParticlesProps {
  totalPagesRead: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  alpha: number;
  color: string;
  pulseSpeed: number;
  angle: number;
  angleSpeed: number;
}

export const CursedEnergyParticles: React.FC<CursedEnergyParticlesProps> = ({ totalPagesRead }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute intensity variables based on total pages read
  // Base is 1.0; scales up to 4.0 for heavy readers (e.g., 3000+ pages)
  const intensityMultiplier = Math.min(1.0 + totalPagesRead / 800, 4.0);
  const maxParticles = Math.min(25 + Math.floor(totalPagesRead / 30), 150);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];

    // Setup canvas dimensions based on container bounding box
    const handleResize = () => {
      if (container && canvas) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width || window.innerWidth;
        canvas.height = rect.height || window.innerHeight;
      }
    };

    // Use ResizeObserver for accurate sizing
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    handleResize();

    const colors = [
      'rgba(248, 231, 28, ', // Yellow/amber (primary theme)
      'rgba(147, 51, 234, ', // Purple (cursed essence)
      'rgba(59, 130, 246, ', // Blue (sorcerer energy)
      'rgba(236, 72, 153, ', // Magenta (resonance)
    ];

    const createParticle = (initY = false): Particle => {
      const size = Math.random() * 3.5 + 1;
      const chosenColor = colors[Math.floor(Math.random() * colors.length)];
      
      return {
        x: Math.random() * canvas.width,
        y: initY ? Math.random() * canvas.height : canvas.height + 20,
        size,
        speedY: -(Math.random() * 0.8 + 0.3) * intensityMultiplier,
        speedX: (Math.random() * 0.6 - 0.3) * (intensityMultiplier * 0.7),
        alpha: Math.random() * 0.4 + 0.1,
        color: chosenColor,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: (Math.random() * 0.02 - 0.01) * intensityMultiplier,
      };
    };

    // Initialize initial batch of particles distributed on screen
    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle(true));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dynamic ambient fog/glow effect in the background
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 10,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
      );
      grad.addColorStop(0, 'rgba(10, 10, 12, 0)');
      // Glow shifts from subtle dark purple to bright golden based on pages read
      const pulseColor = `rgba(${Math.min(20 + Math.floor(totalPagesRead / 5), 60)}, 10, ${Math.min(30 + Math.floor(totalPagesRead / 8), 90)}, 0.03)`;
      grad.addColorStop(1, pulseColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render and update particles
      particles.forEach((p, idx) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.angle) * 0.2;
        p.angle += p.angleSpeed;

        // Pulse transparency
        p.alpha += p.pulseSpeed;
        if (p.alpha > 0.7 || p.alpha < 0.1) {
          p.pulseSpeed = -p.pulseSpeed;
        }

        // Draw particle with outer bloom glow if intensity is high
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        
        if (intensityMultiplier > 2.0) {
          ctx.shadowBlur = p.size * 2.5;
          ctx.shadowColor = p.color.replace(', ', ')');
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow for performance

        // Recycle offscreen particles
        if (p.y < -20 || p.x < -20 || p.x > canvas.width + 20) {
          particles[idx] = createParticle(false);
        }
      });

      // Maintain dynamic particle count
      if (particles.length < maxParticles) {
        particles.push(createParticle(false));
      } else if (particles.length > maxParticles) {
        particles.pop();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [totalPagesRead, intensityMultiplier, maxParticles]);

  return (
    <div 
      ref={containerRef} 
      id="cursed-particles-container"
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0"
    >
      <canvas 
        ref={canvasRef} 
        id="cursed-particles-canvas"
        className="w-full h-full opacity-60 mix-blend-screen" 
      />
    </div>
  );
};
