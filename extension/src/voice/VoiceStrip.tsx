// ABOUTME: Compact bottom-docked voice UI for Vince in the Chrome extension
// ABOUTME: Shows audio bars, live transcript, and end button during voice sessions

import React, { useEffect, useRef } from 'react';
import type { VoiceState } from '../hooks/useVinceVoice';
import type { TranscriptItem } from '@/services/brand-agent/brandAgentLiveService';

interface VoiceStripProps {
  voiceState: VoiceState;
  transcript: TranscriptItem[];
  volumeRef: React.MutableRefObject<number>;
  onStop: () => void;
  accent: string;
  headerBg: string;
}

// ─── Inline Audio Bars ──────────────────────────────────────────────

const BAR_COUNT = 5;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const MAX_HEIGHT = 18;
const MIN_HEIGHT = 3;
const STAGGER = [0, 0.15, 0.05, 0.2, 0.1];

function AudioBars({ volumeRef, accent }: { volumeRef: React.MutableRefObject<number>; accent: string }) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    let lastTime = 0;
    const animate = (time: number) => {
      if (time - lastTime < 33) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = time;

      const vol = volumeRef.current;
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const stagger = STAGGER[i];

        let height: number;
        if (vol > 0.01) {
          const adjustedVol = Math.min(1, vol + stagger);
          height = MIN_HEIGHT + adjustedVol * (MAX_HEIGHT - MIN_HEIGHT);
        } else {
          const pulse = 0.3 + 0.1 * Math.sin(time / 800 + i * 0.8);
          height = MIN_HEIGHT + pulse * (MAX_HEIGHT - MIN_HEIGHT) * 0.3;
        }

        bar.style.height = `${height}px`;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [volumeRef]);

  const totalWidth = BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * BAR_GAP;

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: totalWidth, height: MAX_HEIGHT }}
      aria-label="Audio level indicator"
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { barsRef.current[i] = el; }}
          style={{
            width: BAR_WIDTH,
            height: MIN_HEIGHT,
            marginLeft: i > 0 ? BAR_GAP : 0,
            borderRadius: 2,
            background: accent,
            transition: 'background 0.2s ease',
          }}
        />
      ))}
    </div>
  );
}

// ─── Voice Strip ────────────────────────────────────────────────────

export const VoiceStrip: React.FC<VoiceStripProps> = ({
  voiceState,
  transcript,
  volumeRef,
  onStop,
  accent,
  headerBg,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript to bottom as new items arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Filter to items with text content
  const visibleTranscript = transcript.filter(t => t.text);

  const isConnecting = voiceState === 'connecting';
  const isError = voiceState === 'error';

  const statusDotColor = isError ? '#ef4444' : isConnecting ? '#f59e0b' : accent;
  const statusLabel = isError ? 'Error' : isConnecting ? 'Connecting...' : 'Vince Live';

  return (
    <div style={{
      position: 'sticky',
      bottom: 0,
      zIndex: 30,
      background: headerBg,
      borderTop: `1px solid rgba(255,255,255,0.1)`,
      padding: '10px 12px',
      fontFamily: 'Epilogue, system-ui, sans-serif',
    }}>
      {/* Top row: status + audio bars + end button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: visibleTranscript.length > 0 ? '6px' : 0,
      }}>
        {/* Status indicator */}
        <div style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: statusDotColor,
          flexShrink: 0,
          animation: isConnecting ? 'vinceStripPulse 1.2s ease-in-out infinite' : undefined,
          boxShadow: !isConnecting && !isError ? `0 0 6px ${accent}` : undefined,
        }} />
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          color: '#EAE8E3',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}>
          {statusLabel}
        </span>

        {/* Audio bars */}
        {voiceState === 'active' && (
          <AudioBars volumeRef={volumeRef} accent={accent} />
        )}

        <div style={{ flex: 1 }} />

        {/* End button */}
        <button
          onClick={onStop}
          style={{
            padding: '3px 10px',
            borderRadius: '4px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#fca5a5',
            fontSize: '10px',
            fontWeight: 600,
            fontFamily: 'Epilogue, system-ui, sans-serif',
            cursor: 'pointer',
            letterSpacing: '0.02em',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
          }}
        >
          End
        </button>
      </div>

      {/* Scrolling transcript feed */}
      {visibleTranscript.length > 0 && (
        <div ref={scrollRef} style={{
          maxHeight: '120px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.15) transparent',
        }}>
          {visibleTranscript.map((item) => (
            <p key={item.id} style={{
              margin: 0,
              fontSize: item.role === 'model' ? '11px' : '10px',
              color: item.role === 'model'
                ? 'rgba(234, 232, 227, 0.85)'
                : 'rgba(234, 232, 227, 0.5)',
              fontStyle: item.role === 'user' ? 'italic' : 'normal',
              lineHeight: 1.4,
              opacity: item.isFinal ? 1 : 0.7,
              borderLeft: item.role === 'model'
                ? `2px solid ${accent}`
                : '2px solid rgba(234, 232, 227, 0.2)',
              paddingLeft: '8px',
            }}>
              {item.text}
            </p>
          ))}
        </div>
      )}

      {/* Pulse animation for connecting state */}
      <style>{`
        @keyframes vinceStripPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};
