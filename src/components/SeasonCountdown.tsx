import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface TimeLeft {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

const SeasonCountdown: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  const getTargetDate = () => {
    const now = new Date();
    // End of current month
    const target = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    return target.getTime();
  };

  useEffect(() => {
    const targetDate = getTargetDate();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          days: d.toString().padStart(2, '0'),
          hours: h.toString().padStart(2, '0'),
          minutes: m.toString().padStart(2, '0'),
          seconds: s.toString().padStart(2, '0')
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const DigitBox = ({ value, label }: { value: string; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-primary/20 blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
        <div className="relative bg-[#0a0a0a] border border-white/5 rounded-lg px-3 py-4 min-w-[3.5rem] flex items-center justify-center shadow-2xl">
          <span className="text-4xl font-mono font-black text-white italic tracking-tighter digital-glow">
            {value}
          </span>
        </div>
      </div>
      <span className="text-[10px] uppercase font-esports font-bold tracking-[0.3em] text-white/30 mt-3">
        {label}
      </span>
    </div>
  );

  const Separator = () => (
    <div className="flex items-start pt-5 px-1">
      <span className="text-2xl font-mono font-black text-primary animate-pulse">:</span>
    </div>
  );

  return (
    <div className={`flex flex-col items-center md:items-start ${className}`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
        <span className="text-xs font-esports font-black text-white uppercase tracking-[0.4em] italic">
          Season Remaining
        </span>
      </div>
      
      <div className="flex gap-2">
        <DigitBox value={timeLeft.days} label="Days" />
        <Separator />
        <DigitBox value={timeLeft.hours} label="Hours" />
        <Separator />
        <DigitBox value={timeLeft.minutes} label="Mins" />
        <Separator />
        <DigitBox value={timeLeft.seconds} label="Secs" />
      </div>
    </div>
  );
};

export default SeasonCountdown;
