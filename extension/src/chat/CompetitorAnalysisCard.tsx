// ABOUTME: Displays competitor video analysis results in the extension chat.
// ABOUTME: Shows competitor summary, weaknesses, and 3 clickable campaign direction boxes.

import React from 'react';
import { Target, ChevronRight, AlertTriangle } from 'lucide-react';

interface CampaignDirection {
  title: string;
  description?: string;
  key_message?: string;
  visual_approach?: string;
  differentiator?: string;
}

interface Props {
  data: Record<string, unknown>;
  onSelectDirection?: (direction: CampaignDirection, index: number) => void;
}

export function CompetitorAnalysisCard({ data, onSelectDirection }: Props) {
  const summary = data.competitor_summary as string | undefined;
  const weaknesses = (data.weaknesses as string[] | undefined) || [];
  const directions = (data.campaign_directions as CampaignDirection[] | undefined) || [];

  if (!directions.length && !summary) return null;

  return (
    <div style={{ fontFamily: 'Epilogue, system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingBottom: '8px', borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
        <Target size={11} style={{ color: '#a78bfa', flexShrink: 0 }} />
        <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a78bfa' }}>Competitor Analysis</span>
      </div>

      {/* Summary */}
      {summary && (
        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(224,222,217,0.8)', lineHeight: 1.5 }}>{summary}</p>
      )}

      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <div style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '6px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <AlertTriangle size={10} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24' }}>Weaknesses to exploit</span>
          </div>
          {weaknesses.slice(0, 3).map((w, i) => (
            <p key={i} style={{ margin: 0, fontSize: '10px', color: 'rgba(224,222,217,0.7)', lineHeight: 1.4 }}>· {w}</p>
          ))}
        </div>
      )}

      {/* Campaign Directions */}
      {directions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a78bfa' }}>3 Campaign Directions</span>
          {directions.map((dir, i) => (
            <button
              key={i}
              onClick={() => onSelectDirection?.(dir, i)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '10px 12px',
                background: 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: '8px',
                cursor: onSelectDirection ? 'pointer' : 'default',
                textAlign: 'left',
                fontFamily: 'Epilogue, system-ui, sans-serif',
                transition: 'background 0.15s ease, border-color 0.15s ease',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (onSelectDirection) {
                  e.currentTarget.style.background = 'rgba(139,92,246,0.12)';
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(139,92,246,0.06)';
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)';
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#a78bfa', background: 'rgba(139,92,246,0.2)', borderRadius: '3px', padding: '1px 5px', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#e0ded9', lineHeight: 1.3 }}>{dir.title}</span>
                </div>
                {dir.description && (
                  <p style={{ margin: 0, fontSize: '10px', color: 'rgba(224,222,217,0.6)', lineHeight: 1.4 }}>{dir.description}</p>
                )}
                {dir.key_message && (
                  <p style={{ margin: '4px 0 0', fontSize: '9px', fontStyle: 'italic', color: '#a78bfa' }}>"{dir.key_message}"</p>
                )}
              </div>
              {onSelectDirection && (
                <ChevronRight size={12} style={{ color: 'rgba(139,92,246,0.5)', flexShrink: 0, marginTop: '2px' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
