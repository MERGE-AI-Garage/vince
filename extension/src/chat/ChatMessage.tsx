// ABOUTME: Renders a single chat message with optional tool result payload.
// ABOUTME: User messages appear right-aligned; assistant messages left-aligned with result cards below.

import React from 'react';
import type { ToolResult } from '../hooks/useVinceVoice';
import { ToolResultRenderer } from './ToolResultRenderer';

const PURPLE = '#8b5cf6';
const PURPLE_RGB = '139, 92, 246';

function hexToRgb(hex: string): string {
  const c = hex.replace('#', '');
  const n = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
  return `${(n >> 16) & 0xff}, ${(n >> 8) & 0xff}, ${n & 0xff}`;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'voice-user' | 'voice-assistant';
  text: string;
  toolResults?: ToolResult[];
  isLoading?: boolean;
  isFinal?: boolean;
}

interface Props {
  message: Message;
  onSelectCampaignDirection?: (text: string) => void;
  brandColor?: string;
}

export function ChatMessage({ message, onSelectCampaignDirection, brandColor }: Props) {
  const isUser = message.role === 'user' || message.role === 'voice-user';
  const isVoice = message.role === 'voice-user' || message.role === 'voice-assistant';
  const accentRgb = brandColor ? hexToRgb(brandColor) : PURPLE_RGB;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: '4px' }}>
      {/* Bubble */}
      {(message.text || message.isLoading) && (
        <div style={{
          maxWidth: '88%',
          padding: '8px 11px',
          borderRadius: isUser ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
          background: isUser
            ? `rgba(${accentRgb}, 0.14)`
            : isVoice
            ? 'rgba(0,0,0,0.03)'
            : '#ffffff',
          border: `1px solid ${isUser ? `rgba(${accentRgb}, 0.35)` : 'rgba(0,0,0,0.08)'}`,
          fontSize: '12px',
          color: '#111111',
          lineHeight: 1.5,
          fontFamily: 'Epilogue, system-ui, sans-serif',
          opacity: isVoice && !message.isFinal ? 0.65 : 1,
          borderLeft: !isUser && isVoice ? `2px solid rgba(${PURPLE_RGB}, 0.5)` : undefined,
        }}>
          {message.isLoading ? (
            <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: PURPLE,
                  animation: `vinceDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                  display: 'inline-block',
                }} />
              ))}
              <style>{`
                @keyframes vinceDot {
                  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
                  40% { opacity: 1; transform: scale(1); }
                }
              `}</style>
            </span>
          ) : (
            <span style={{ whiteSpace: 'pre-wrap' }}>{message.text}</span>
          )}
        </div>
      )}

      {/* Tool result cards */}
      {!isUser && message.toolResults?.map((result, i) => (
        <div key={i} style={{ width: '100%', maxWidth: '100%' }}>
          <ToolResultRenderer result={result} onSelectCampaignDirection={onSelectCampaignDirection} />
        </div>
      ))}
    </div>
  );
}
