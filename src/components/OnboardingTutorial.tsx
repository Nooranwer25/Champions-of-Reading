import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Zap, Trophy, BookOpen } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  targetId?: string;
  icon: React.ReactNode;
}

const steps: TutorialStep[] = [
  {
    title: "Welcome to the Colony",
    description: "A battleground of intellect and spirit. Here, your reading progress manifests as Cursed Energy. Let us guide you through the protocols.",
    icon: <Zap className="text-primary" size={32} />,
  },
  {
    targetId: "tour-submit-btn",
    title: "Manifest Your Vows",
    description: "Every tome you conquer must be reported here. Kogane will judge your comprehension and grant you Cursed Energy based on the depth of your insight.",
    icon: <BookOpen className="text-secondary" size={32} />,
  },
  {
    targetId: "tour-rankings-btn",
    title: "Ascend the Arena",
    description: "Check the global rankings to see your position among other Sorcerers. Only the most disciplined will reach the Special Grade status.",
    icon: <Trophy className="text-accent" size={32} />,
  },
  {
    title: "Refine Your Technique",
    description: "Consistency is your greatest weapon. Enter 'Black Flash' states by reading daily and expanding your domain. The game has begun.",
    icon: <Zap className="text-primary" size={32} />,
  }
];

export const OnboardingTutorial: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
    if (!hasSeenTour) {
      // Delay it slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const targetId = steps[currentStep].targetId;
    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenOnboardingTour', 'true');
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] pointer-events-none">
        {/* Dark Backdrop with hole */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
          style={{
            maskImage: targetRect 
              ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 1.5}px, black 0%)`
              : 'none',
            WebkitMaskImage: targetRect 
              ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 1.5}px, black 0%)`
              : 'none'
          }}
          onClick={handleComplete}
        />

        {/* Content Box */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: targetRect ? (targetRect.top > window.innerHeight / 2 ? -250 : 250) : 0,
              x: 0
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-surface-charcoal border-2 border-primary/40 p-8 max-w-md w-full relative pointer-events-auto shadow-[0_0_50px_rgba(248,231,28,0.2)]"
            style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)' }}
          >
            <button 
              onClick={handleComplete}
              className="absolute top-4 right-6 text-white/20 hover:text-primary transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rotate-45">
                <div className="-rotate-45">
                  {currentStepData.icon}
                </div>
              </div>

              <div className="text-[10px] uppercase font-esports tracking-[0.3em] text-primary/40 mb-2">
                Step {currentStep + 1} of {steps.length}
              </div>
              
              <h3 className="text-3xl font-esports italic text-on-surface uppercase mb-4 tracking-tighter digital-glow">
                {currentStepData.title}
              </h3>
              
              <p className="text-on-surface-variant font-bold leading-relaxed mb-8 italic">
                {currentStepData.description}
              </p>

              <div className="flex justify-between w-full items-center">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 text-xs uppercase tracking-widest font-black transition-colors ${currentStep === 0 ? 'text-white/10' : 'text-white/40 hover:text-white'}`}
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 w-4 transition-all ${i === currentStep ? 'bg-primary' : 'bg-white/10'}`} 
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 text-xs uppercase tracking-widest font-black text-primary hover:text-white transition-colors"
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={16} />
                </button>
              </div>
            </div>
            
            {/* Decorative Corner */}
            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-primary/40" />
            <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-primary/40" />
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
