// ABOUTME: Animated launch screen for the Vince iOS app
// ABOUTME: Plays a 2-second branded intro (camera lens pulse, text reveal) then fades out

import { useState, useEffect } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';

interface MobileSplashProps {
  onComplete: () => void;
}

export function MobileSplash({ onComplete }: MobileSplashProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    // Hide the native Capacitor splash now that our web splash is mounted
    SplashScreen.hide();

    // Phase timing: enter (0ms) -> hold (800ms) -> exit (2000ms) -> done (2500ms)
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
      background: 'radial-gradient(ellipse at 50% 40%, #1a0e30 0%, #0f0a1e 60%, #080510 100%)',
      opacity: phase === 'exit' ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes blSplashLensPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes blSplashLensGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.3), 0 0 80px rgba(168, 85, 247, 0.1); }
          50% { box-shadow: 0 0 60px rgba(168, 85, 247, 0.5), 0 0 120px rgba(168, 85, 247, 0.2); }
        }
        @keyframes blSplashRingExpand {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes blSplashFadeUp {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes blSplashLineDraw {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes blSplashSubtitleFade {
          0% { opacity: 0; letter-spacing: 6px; }
          100% { opacity: 0.6; letter-spacing: 4px; }
        }
        @keyframes blSplashParticleFloat {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          20% { opacity: 0.2; }
          80% { opacity: 0.2; }
          100% { transform: translateY(-200px) rotate(40deg); opacity: 0; }
        }
      `}</style>

      {/* Floating particles */}
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 6 + i * 2,
          height: 6 + i * 2,
          borderRadius: '50%',
          background: '#a855f7',
          bottom: -20,
          left: `${15 + i * 17}%`,
          animation: `blSplashParticleFloat ${3 + i * 0.5}s ease-out ${i * 0.3}s forwards`,
        }} />
      ))}

      {/* Lens orb */}
      <div style={{ position: 'relative', marginBottom: 40 }}>
        {/* Expanding ring */}
        <div style={{
          position: 'absolute',
          inset: -10,
          borderRadius: '50%',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          animation: 'blSplashRingExpand 2s ease-out 0.3s infinite',
        }} />

        {/* Glowing lens */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #c084fc, #a855f7, #7c3aed)',
          animation: 'blSplashLensPulse 2s ease-in-out infinite, blSplashLensGlow 2s ease-in-out infinite',
        }}>
          {/* Camera lens icon inside */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.4)',
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                transform: 'translate(-50%, -50%)',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* App name */}
      <div style={{
        fontSize: 36,
        fontWeight: 700,
        color: '#ffffff',
        letterSpacing: 8,
        animation: 'blSplashFadeUp 0.6s ease-out 0.2s both',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        BRAND LENS
      </div>

      {/* Accent line */}
      <div style={{
        width: 120,
        height: 1,
        background: 'linear-gradient(90deg, transparent, #a855f7, transparent)',
        margin: '16px 0',
        transformOrigin: 'center',
        animation: 'blSplashLineDraw 0.8s ease-out 0.6s both',
      }} />

      {/* Subtitle */}
      <div style={{
        fontSize: 11,
        fontWeight: 500,
        color: '#a855f7',
        textTransform: 'uppercase' as const,
        animation: 'blSplashSubtitleFade 0.8s ease-out 0.9s both',
      }}>
        Creative Director
      </div>

      {/* Loading dots */}
      <div style={{
        position: 'absolute',
        bottom: 'max(env(safe-area-inset-bottom, 20px), 40px)',
        display: 'flex',
        gap: 6,
        animation: 'blSplashFadeUp 0.5s ease-out 1.2s both',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#a855f7',
            opacity: 0.4,
            animation: `blSplashLensPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
