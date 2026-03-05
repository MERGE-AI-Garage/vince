// ABOUTME: Compact 5-bar audio level indicator for voice mode headers
// ABOUTME: Reacts to volumeRef in real time, shows speaking/listening/idle states

import React, { useEffect, useRef } from 'react';

interface CompactAudioIndicatorProps {
  volumeRef: React.MutableRefObject<number>;
  isModelSpeaking: boolean;
  isUserSpeaking: boolean;
  theme?: 'dark' | 'light';
}

const BAR_COUNT = 5;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const MAX_HEIGHT = 20;
const MIN_HEIGHT = 3;
// Stagger offsets so bars don't all move in unison
const STAGGER = [0, 0.15, 0.05, 0.2, 0.1];

export const CompactAudioIndicator: React.FC<CompactAudioIndicatorProps> = ({
  volumeRef,
  isModelSpeaking,
  isUserSpeaking,
  theme = 'dark',
}) => {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);

  const isLight = theme === 'light';

  useEffect(() => {
    let lastTime = 0;
    const animate = (time: number) => {
      // Throttle to ~30fps for efficiency
      if (time - lastTime < 33) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = time;

      const vol = volumeRef.current;
      const isSpeaking = isModelSpeaking || isUserSpeaking;

      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const stagger = STAGGER[i];

        let height: number;
        if (isSpeaking && vol > 0.01) {
          // Active audio: bars respond to volume with stagger
          const adjustedVol = Math.min(1, vol + stagger);
          height = MIN_HEIGHT + adjustedVol * (MAX_HEIGHT - MIN_HEIGHT);
        } else {
          // Idle: gentle breathing pulse
          const pulse = 0.3 + 0.1 * Math.sin(time / 800 + i * 0.8);
          height = MIN_HEIGHT + pulse * (MAX_HEIGHT - MIN_HEIGHT) * 0.3;
        }

        bar.style.height = `${height}px`;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [volumeRef, isModelSpeaking, isUserSpeaking]);

  // Color: emerald for model, cyan for user, muted when idle
  let barColor: string;
  if (isModelSpeaking) {
    barColor = isLight ? 'bg-emerald-600' : 'bg-emerald-400';
  } else if (isUserSpeaking) {
    barColor = isLight ? 'bg-cyan-600' : 'bg-cyan-400';
  } else {
    barColor = isLight ? 'bg-gray-400' : 'bg-white/40';
  }

  const totalWidth = BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * BAR_GAP;

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: totalWidth, height: MAX_HEIGHT }}
      aria-label="Audio level indicator"
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
          className={`rounded-full transition-colors duration-200 ${barColor}`}
          style={{
            width: BAR_WIDTH,
            height: MIN_HEIGHT,
            marginLeft: i > 0 ? BAR_GAP : 0,
          }}
        />
      ))}
    </div>
  );
};
