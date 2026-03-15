// ABOUTME: Campaign archive panel for the extension ChatTab.
// ABOUTME: Lists past brand generations; clicking one pastes its prompt into the chat input.

import React from 'react';
import { useCreations } from '../hooks/useCreations';

const PURPLE = '#8b5cf6';
const PURPLE_RGB = '139, 92, 246';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TYPE_LABELS: Record<string, string> = {
  text_to_image: 'Image',
  creative_package: 'Campaign',
  text_to_video: 'Video',
  brand_card: 'Brand Card',
};

interface Props {
  brandId: string | null;
  onSelectPrompt: (prompt: string) => void;
}

export function CampaignHistoryPanel({ brandId, onSelectPrompt }: Props) {
  const { items, isLoading } = useCreations(brandId);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      fontFamily: 'Epilogue, system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 12px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(224,222,217,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Campaign Archive
        </span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
        {isLoading && (
          <div style={{ padding: '32px 12px', textAlign: 'center', color: 'rgba(224,222,217,0.3)', fontSize: '11px' }}>
            Loading…
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div style={{ padding: '32px 12px', textAlign: 'center', color: 'rgba(224,222,217,0.3)', fontSize: '11px' }}>
            No campaigns yet
          </div>
        )}
        {items.map(item => {
          const thumbs = (item.output_urls || []).filter(u => /\.(jpg|jpeg|png|webp|gif)/i.test(u)).slice(0, 3);
          const label = TYPE_LABELS[item.generation_type] ?? item.generation_type.replace(/_/g, ' ');
          return (
            <button
              key={item.id}
              onClick={() => item.prompt_text && onSelectPrompt(item.prompt_text)}
              disabled={!item.prompt_text}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: item.prompt_text ? 'pointer' : 'default',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `rgba(${PURPLE_RGB}, 0.06)`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              {/* Thumbnails */}
              {thumbs.length > 0 && (
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                  {thumbs.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, background: '#1a1a1a' }}
                    />
                  ))}
                </div>
              )}

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, color: PURPLE,
                    background: `rgba(${PURPLE_RGB}, 0.12)`,
                    border: `1px solid rgba(${PURPLE_RGB}, 0.25)`,
                    padding: '1px 5px', borderRadius: '3px', flexShrink: 0,
                  }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '9px', color: 'rgba(224,222,217,0.3)', flexShrink: 0 }}>
                    {relativeTime(item.created_at)}
                  </span>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '10px',
                  color: item.prompt_text ? 'rgba(224,222,217,0.7)' : 'rgba(224,222,217,0.3)',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {item.prompt_text || '(no prompt)'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
