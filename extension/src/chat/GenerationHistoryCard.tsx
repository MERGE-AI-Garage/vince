// ABOUTME: Renders a grid of past generation thumbnails from a list_generations tool result.
// ABOUTME: Shows image/video thumbnails with prompt text and date labels.

import React, { useState } from 'react';
import type { GenerationRecord } from '../hooks/useVinceVoice';

interface Props {
  generations: GenerationRecord[];
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function GenerationHistoryCard({ generations }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <p style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: 600, color: 'rgba(224,222,217,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Past Generations ({generations.length})
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {generations.map(gen => {
          const thumbUrl = gen.output_urls?.[0];
          const isVideo = gen.generation_type === 'video' || thumbUrl?.match(/\.(mp4|webm|mov)/i);
          const isExpanded = expanded === gen.id;

          return (
            <div
              key={gen.id}
              onClick={() => setExpanded(isExpanded ? null : gen.id)}
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              title={gen.prompt_text || gen.generation_type}
            >
              {thumbUrl ? (
                isVideo ? (
                  <video
                    src={thumbUrl}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                    muted
                    playsInline
                    loop={isExpanded}
                    autoPlay={isExpanded}
                  />
                ) : (
                  <img
                    src={thumbUrl}
                    alt={gen.prompt_text || gen.generation_type}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                  />
                )
              ) : (
                <div style={{ width: '100%', aspectRatio: '1', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '18px', opacity: 0.3 }}>🎬</span>
                </div>
              )}
              <div style={{ padding: '5px 6px' }}>
                <div style={{ fontSize: '9px', color: 'rgba(224,222,217,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                  {gen.prompt_text ? gen.prompt_text.slice(0, 60) : gen.generation_type}
                </div>
                <div style={{ fontSize: '8px', color: 'rgba(224,222,217,0.3)', marginTop: '2px' }}>
                  {timeAgo(gen.created_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
