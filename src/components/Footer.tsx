import React from 'react';

import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface-charcoal text-on-surface pt-24 pb-12 font-serif px-6 md:px-8">
      <div className="max-w-7xl mx-auto border-t border-on-surface/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="flex flex-col gap-4 text-center md:text-left">
          <Logo size="sm" />
          <p className="max-w-xs text-sm text-on-surface-variant font-sans opacity-70">
            A grand arena for champions of literature to log, compete, and master the art of reading.
          </p>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-2 text-xs font-sans text-on-surface-variant uppercase tracking-[0.2em] opacity-50 font-semibold">
           <span className="hover:text-primary cursor-pointer transition-all">Sacred Codex</span>
           <span className="hover:text-primary cursor-pointer transition-all">Tournament Logistics</span>
           <span className="hover:text-primary cursor-pointer transition-all">Champions Hall</span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-24 text-center text-[10px] uppercase font-sans tracking-[0.4em] opacity-20">
        © 2024 OBSIDIAN ARCHIVE • ALL RIGHTS RESERVED
      </div>
    </footer>
  );
};

export default Footer;
