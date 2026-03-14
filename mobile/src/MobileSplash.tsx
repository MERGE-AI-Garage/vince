// ABOUTME: Animated launch screen for the Vince iOS app
// ABOUTME: Plays a 2.5s branded intro (geometric V mark, letter reveal, double-ring pulse) then fades out

import { useState, useEffect } from 'react';

interface MobileSplashProps {
  onComplete: () => void;
}

const LETTERS = ['V', 'I', 'N', 'C', 'E'];

export function MobileSplash({ onComplete }: MobileSplashProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('hold'), 800);
    const exitTimer = setTimeout(() => setPhase('exit'), 2000);
    const doneTimer = setTimeout(onComplete, 2500);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 38%, #2d1158 0%, #1a0840 25%, #0f0a1e 55%, #080510 100%)',
      opacity: phase === 'exit' ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes vinceOrbPulse {
          0%, 100% { transform: scale(1); opacity: 0.75; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        @keyframes vinceOrbGlow {
          0%, 100% {
            box-shadow:
              0 0 30px rgba(168, 85, 247, 0.4),
              0 0 60px rgba(168, 85, 247, 0.15),
              0 0 100px rgba(124, 58, 237, 0.08);
          }
          50% {
            box-shadow:
              0 0 50px rgba(192, 132, 252, 0.6),
              0 0 90px rgba(168, 85, 247, 0.25),
              0 0 140px rgba(124, 58, 237, 0.12);
          }
        }
        @keyframes vinceRingA {
          0% { transform: scale(0.85); opacity: 0.5; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes vinceRingB {
          0% { transform: scale(0.85); opacity: 0.3; }
          100% { transform: scale(2.0); opacity: 0; }
        }
        @keyframes vinceFadeUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes vinceLetterIn {
          0% { opacity: 0; transform: translateY(16px) scale(0.8); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes vinceLine {
          0% { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes vinceSubtitle {
          0% { opacity: 0; letter-spacing: 8px; }
          100% { opacity: 0.55; letter-spacing: 5px; }
        }
        @keyframes vinceParticle {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          15% { opacity: 1; transform: translateY(-20px) scale(1); }
          85% { opacity: 0.6; }
          100% { transform: translateY(-220px) scale(0.3); opacity: 0; }
        }
        @keyframes vinceDot {
          0%, 100% { transform: scale(0.6); opacity: 0.3; }
          50% { transform: scale(1); opacity: 0.8; }
        }
        @keyframes vinceSparkPulse {
          0%, 100% { r: 2.5; opacity: 0.8; }
          50% { r: 3.5; opacity: 1; }
        }
      `}</style>

      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(109, 40, 217, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Floating particles — varied purple hues */}
      {[
        { size: 5, color: '#c084fc', left: '12%', dur: 3.2, delay: 0 },
        { size: 8, color: '#a855f7', left: '25%', dur: 3.8, delay: 0.3 },
        { size: 4, color: '#7c3aed', left: '40%', dur: 3.0, delay: 0.6 },
        { size: 9, color: '#a855f7', left: '55%', dur: 4.0, delay: 0.1 },
        { size: 5, color: '#c084fc', left: '68%', dur: 3.5, delay: 0.4 },
        { size: 6, color: '#8b5cf6', left: '80%', dur: 3.3, delay: 0.7 },
        { size: 4, color: '#7c3aed', left: '20%', dur: 3.6, delay: 0.9 },
        { size: 7, color: '#c084fc', left: '72%', dur: 3.1, delay: 0.2 },
      ].map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          background: p.color,
          bottom: -10,
          left: p.left,
          boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          animation: `vinceParticle ${p.dur}s ease-out ${p.delay}s forwards`,
        }} />
      ))}

      {/* Orb container */}
      <div style={{ position: 'relative', marginBottom: 44 }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute',
          inset: -12,
          borderRadius: '50%',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          animation: 'vinceRingA 2.2s ease-out 0.2s infinite',
        }} />
        {/* Inner ring — offset phase */}
        <div style={{
          position: 'absolute',
          inset: -12,
          borderRadius: '50%',
          border: '1px solid rgba(192, 132, 252, 0.2)',
          animation: 'vinceRingB 2.2s ease-out 1.1s infinite',
        }} />

        {/* Glowing orb */}
        <div style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 33% 30%, #d8b4fe, #a855f7 45%, #6d28d9)',
          animation: 'vinceOrbPulse 2.4s ease-in-out infinite, vinceOrbGlow 2.4s ease-in-out infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* V mark SVG */}
          <svg width="42" height="38" viewBox="0 0 42 38" fill="none">
            {/* Left arm */}
            <path
              d="M 5 4 L 21 34"
              stroke="rgba(255,255,255,0.92)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Right arm */}
            <path
              d="M 37 4 L 21 34"
              stroke="rgba(255,255,255,0.92)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Spark at vertex */}
            <circle cx="21" cy="34" r="3" fill="white" opacity="1" />
            {/* Small spark rays */}
            <line x1="21" y1="34" x2="21" y2="38" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="21" y1="34" x2="17.5" y2="37.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="21" y1="34" x2="24.5" y2="37.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeLinecap="round" />
            {/* Subtle top horizontal tie — viewfinder reference */}
            <line x1="5" y1="4" x2="37" y2="4" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Letter-by-letter VINCE reveal */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 0,
      }}>
        {LETTERS.map((letter, i) => (
          <span key={letter} style={{
            fontSize: 46,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: 2,
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: 1,
            opacity: 0,
            animation: `vinceLetterIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.15 + i * 0.07}s both`,
          }}>
            {letter}
          </span>
        ))}
      </div>

      {/* Accent line */}
      <div style={{
        width: 100,
        height: 1,
        background: 'linear-gradient(90deg, transparent, #c084fc, #a855f7, transparent)',
        margin: '18px 0 14px',
        transformOrigin: 'center',
        animation: 'vinceLine 0.7s ease-out 0.65s both',
      }} />

      {/* Subtitle */}
      <div style={{
        fontSize: 10,
        fontWeight: 500,
        color: '#c084fc',
        textTransform: 'uppercase' as const,
        animation: 'vinceSubtitle 0.8s ease-out 0.85s both',
      }}>
        Creative Director
      </div>

      {/* Loading dots */}
      <div style={{
        position: 'absolute',
        bottom: 'max(env(safe-area-inset-bottom, 20px), 44px)',
        display: 'flex',
        gap: 7,
        animation: 'vinceFadeUp 0.5s ease-out 1.3s both',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#a855f7',
            boxShadow: '0 0 6px rgba(168, 85, 247, 0.6)',
            animation: `vinceDot 1.2s ease-in-out ${i * 0.22}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
