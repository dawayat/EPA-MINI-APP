import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'loading' | 'done'>('intro');

  useEffect(() => {
    // Intro text fades in
    const introTimer = setTimeout(() => setPhase('loading'), 600);

    // Smooth subtle progress
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return Math.min(prev + (prev < 80 ? 2.5 : 1), 100);
      });
    }, 40);

    // Complete phase
    const doneTimer = setTimeout(() => {
      setPhase('done');
      setTimeout(onComplete, 600);
    }, 2400);

    return () => {
      clearTimeout(introTimer);
      clearInterval(progressTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#080808] transition-opacity duration-700 ease-in-out ${
        phase === 'done' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ minHeight: '100dvh' }}
    >
      <div className="relative z-10 flex flex-col items-center justify-center">
        
        {/* Minimalist Logo / Typography */}
        <div className={`overflow-hidden transition-all duration-1000 ease-out transform ${
          phase === 'intro' ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
        }`}>
          <h1 className="text-4xl sm:text-5xl font-black font-syne tracking-tight text-gray-900 dark:text-white uppercase flex items-center gap-3">
            EPA <span className="w-1.5 h-1.5 rounded-full bg-green-700 dark:bg-[#d4ff00]"></span> Portal
          </h1>
        </div>
        
        <div className={`mt-3 overflow-hidden transition-all duration-1000 delay-200 ease-out transform ${
          phase === 'intro' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
        }`}>
          <p className="text-xs sm:text-sm font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Ethiopian Psychologists' Association
          </p>
        </div>

        {/* Simplistic Progress Line */}
        <div className={`mt-12 w-48 transition-all duration-700 delay-300 ${
          phase === 'intro' ? 'opacity-0' : 'opacity-100'
        }`}>
          <div className="h-[2px] w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gray-900 dark:bg-[#d4ff00] rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
