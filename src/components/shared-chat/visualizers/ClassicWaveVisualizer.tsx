// ABOUTME: Classic wave visualizer with 3-wave sine animation in circular orb
// ABOUTME: Original Scout voice mode visualization with configurable waveforms

import React, { useEffect, useRef } from 'react';
import { VisualizerProps, ClassicWaveSettings } from './types';

interface ClassicWaveVisualizerProps extends VisualizerProps {
  settings?: Partial<ClassicWaveSettings>;
}

const DEFAULT_SETTINGS: ClassicWaveSettings = {
  color1: null,
  color2: null,
  color3: null,
  speed: 1.0,
  amplitude: 1.0,
  lineWidth1: 2.0,
  lineWidth2: 1.5,
  lineWidth3: 1.0,
  backgroundColor: '#000000',
  showTexture: true,
  textureOpacity: 0.1,
  frequency1: 0.02,
  frequency2: 0.04,
  frequency3: 0.06,
};

export const ClassicWaveVisualizer: React.FC<ClassicWaveVisualizerProps> = ({
  isActive,
  volumeRef,
  isUserSpeaking,
  className = '',
  settings = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);

  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Handle High DPI displays
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * window.devicePixelRatio || canvas.height !== rect.height * window.devicePixelRatio) {
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }

      const width = rect.width;
      const height = rect.height;
      const centerY = height / 2;

      // Clear with transparency
      ctx.clearRect(0, 0, width, height);

      // Base speed multiplied by settings speed
      timeRef.current += 0.08 * mergedSettings.speed;

      // Configuration for the 3 waves - use custom colors if provided, otherwise theme colors
      const rootStyles = getComputedStyle(document.documentElement);
      const getThemeColor = (varName: string) => `hsl(${rootStyles.getPropertyValue(varName).trim()})`;

      const waves = [
        {
          color: mergedSettings.color1 || getThemeColor('--success'),
          speed: 0.1,
          frequency: mergedSettings.frequency1,
          amplitudeScale: 1.0,
          lineWidth: mergedSettings.lineWidth1
        }, // Bass (Main)
        {
          color: mergedSettings.color2 || getThemeColor('--primary'),
          speed: 0.15,
          frequency: mergedSettings.frequency2,
          amplitudeScale: 0.7,
          lineWidth: mergedSettings.lineWidth2
        }, // Mids
        {
          color: mergedSettings.color3 || getThemeColor('--foreground'),
          speed: 0.2,
          frequency: mergedSettings.frequency3,
          amplitudeScale: 0.4,
          lineWidth: mergedSettings.lineWidth3
        }  // Treble (Detail)
      ];

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const currentVol = Math.max(0.05, volumeRef.current);

        for (let x = 0; x <= width; x += 2) {
          const normalizedX = (x / width) * 2 - 1;
          const windowFunc = Math.exp(-4 * normalizedX * normalizedX);
          // Apply amplitude multiplier from settings
          const currentAmplitude = (currentVol * 60 * mergedSettings.amplitude) * wave.amplitudeScale;
          const y = centerY + Math.sin(x * wave.frequency + timeRef.current * wave.speed) * currentAmplitude * windowFunc;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, volumeRef, mergedSettings]);

  return (
    <div className={`relative flex-shrink-0 my-4 ${className}`}>
      {/* Core Orb Container */}
      <div
        className={`relative h-64 w-64 rounded-full border transition-all duration-300 ${isUserSpeaking ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.2)]' : 'border-accent/30 shadow-[0_0_30px_hsl(var(--accent)/0.2)]'} flex items-center justify-center z-10 overflow-hidden`}
        style={{ backgroundColor: mergedSettings.backgroundColor }}
      >
        {mergedSettings.showTexture && (
          <div
            className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"
            style={{ opacity: mergedSettings.textureOpacity }}
          />
        )}

        {/* Canvas Layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-20"
        />

        {/* Spinning Rings Overlay */}
        <div className="absolute inset-0 border-t border-transparent border-l border-white/10 rounded-full animate-spin-slow pointer-events-none z-30"></div>
        <div className="absolute inset-6 border-b border-transparent border-r border-white/5 rounded-full animate-reverse-spin pointer-events-none z-30"></div>
      </div>
    </div>
  );
};
