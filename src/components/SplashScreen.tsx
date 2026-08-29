import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'logo' | 'loading' | 'done'>('logo');

  useEffect(() => {
    // Phase 1: Logo appears (800ms)
    const logoTimer = setTimeout(() => setPhase('loading'), 800);

    // Phase 2: Progress bar runs (1800ms)
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        // Accelerate at the end
        const increment = prev < 80 ? 3 : prev < 95 ? 1.5 : 0.8;
        return Math.min(prev + increment, 100);
      });
    }, 50);

    // Phase 3: Complete (2800ms total)
    const doneTimer = setTimeout(() => {
      setPhase('done');
      setTimeout(onComplete, 400);
    }, 2800);

    return () => {
      clearTimeout(logoTimer);
      clearInterval(progressTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#080808] transition-opacity duration-400 ${
        phase === 'done' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ minHeight: '100dvh' }}
    >
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #d4ff00 0%, transparent 70%)',
            animation: 'pulse-glow 3s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #4ade80 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-20 right-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #d4ff00 0%, transparent 70%)' }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Main content */}
      <div
        className={`relative z-10 flex flex-col items-center gap-8 transition-all duration-700 ${
          phase === 'logo' ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
        }`}
      >
        {/* Logo Container */}
        <div className="relative">
          {/* Rotating ring */}
          <div
            className="absolute -inset-4 rounded-full border border-[#d4ff00]/20"
            style={{ animation: 'spin 8s linear infinite' }}
          />
          <div
            className="absolute -inset-8 rounded-full border border-[#d4ff00]/10"
            style={{ animation: 'spin 12s linear infinite reverse' }}
          />

          {/* Logo badge */}
          <div
            className="relative w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #1a1a1c 0%, #0d0d0f 100%)',
              border: '1.5px solid rgba(212, 255, 0, 0.3)',
              boxShadow: '0 0 60px rgba(212, 255, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <img
              src="/epa-logo.png"
              alt="EPA Logo"
              className="w-20 h-20 object-contain"
              style={{ filter: 'drop-shadow(0 0 16px rgba(212, 255, 0, 0.4))' }}
            />
          </div>

          {/* Verified badge */}
          <div
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-black text-xs font-black"
            style={{ background: '#d4ff00', boxShadow: '0 0 12px rgba(212, 255, 0, 0.6)' }}
          >
            ✓
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <div
            className="font-black text-3xl text-white uppercase tracking-tight"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            EPA
            <span style={{ color: '#d4ff00' }}> Portal</span>
          </div>
          <div className="text-neutral-500 text-xs font-mono uppercase tracking-widest mt-1">
            Ethiopian Psychologists' Association
          </div>
          <div className="text-neutral-600 text-[11px] font-mono mt-0.5">
            የኢትዮጵያ ሳይኮሎጂ ባለሙያዎች ማኅበር
          </div>
        </div>

        {/* Loading section */}
        <div className={`w-64 flex flex-col gap-3 transition-opacity duration-500 ${phase === 'loading' ? 'opacity-100' : 'opacity-0'}`}>
          {/* Progress bar */}
          <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #d4ff00, #a8d400)',
                boxShadow: '0 0 10px rgba(212, 255, 0, 0.6)',
              }}
            />
            {/* Shimmer */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                animation: 'shimmer 1.5s ease-in-out infinite',
              }}
            />
          </div>

          {/* Status text */}
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#d4ff00]"
                style={{ animation: 'pulse 1s ease-in-out infinite' }}
              />
              {progress < 30
                ? 'Connecting to EPA Registry...'
                : progress < 60
                ? 'Loading member data...'
                : progress < 90
                ? 'Syncing credentials...'
                : 'Ready'}
            </span>
            <span className="text-[#d4ff00]">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Badge row */}
        <div className="flex items-center gap-3 mt-2">
          {['FDRE REG. NO. 0492', 'EST. 1999', 'SECURE'].map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 px-2.5 py-1 rounded-full border border-white/5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Inline animations */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
