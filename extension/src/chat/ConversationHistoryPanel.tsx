// ABOUTME: History panel overlay for ChatTab — shows past Vince conversations with thumbnails.
// ABOUTME: Loads from chatbot_conversations; cross-device (shows extension, web app, and voice sessions).

import React, { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import type { Message } from './ChatMessage';
import {
  fetchRecentConversations,
  loadConversation,
  type ConversationSummary,
} from '../services/conversationHistoryService';

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

interface Props {
  onRestoreConversation: (id: string, messages: Message[]) => void;
  onNewChat: () => void;
}

export function ConversationHistoryPanel({ onRestoreConversation, onNewChat }: Props) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentConversations(25)
      .then(setConversations)
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (conv: ConversationSummary) => {
    setLoadingId(conv.id);
    try {
      const messages = await loadConversation(conv.id);
      onRestoreConversation(conv.id, messages);
    } finally {
      setLoadingId(null);
    }
  };

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
        justifyContent: 'space-between',
        padding: '10px 12px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(224,222,217,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Chat History
        </span>
        <button
          onClick={onNewChat}
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: PURPLE,
            background: `rgba(${PURPLE_RGB}, 0.1)`,
            border: `1px solid rgba(${PURPLE_RGB}, 0.3)`,
            borderRadius: '5px',
            padding: '3px 9px',
            cursor: 'pointer',
            fontFamily: 'Epilogue, system-ui, sans-serif',
          }}
        >
          + New chat
        </button>
      </div>

      {/* List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.08) transparent',
      }}>
        {loading && (
          <div style={{ padding: '32px 12px', textAlign: 'center', color: 'rgba(224,222,217,0.3)', fontSize: '12px' }}>
            Loading…
          </div>
        )}
        {!loading && conversations.length === 0 && (
          <div style={{ padding: '32px 12px', textAlign: 'center', color: 'rgba(224,222,217,0.3)', fontSize: '12px' }}>
            No past conversations yet.
          </div>
        )}
        {conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => handleSelect(conv)}
            disabled={loadingId === conv.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              padding: '9px 12px',
              gap: '6px',
              background: loadingId === conv.id ? 'rgba(255,255,255,0.04)' : 'none',
              border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'Epilogue, system-ui, sans-serif',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = loadingId === conv.id ? 'rgba(255,255,255,0.04)' : 'none'; }}
          >
            {/* Top row: text + time */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', width: '100%' }}>
              <span style={{
                flex: 1,
                fontSize: '12px',
                color: 'rgba(224,222,217,0.85)',
                lineHeight: 1.4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {conv.firstUserMessage}
              </span>
              <span style={{ fontSize: '10px', color: 'rgba(224,222,217,0.3)', flexShrink: 0, paddingTop: '1px' }}>
                {relativeTime(conv.updatedAt)}
              </span>
            </div>

            {/* Bottom row: thumbnails + package badge */}
            {(conv.thumbnails.length > 0 || conv.hasCreativePackage) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {conv.thumbnails.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '4px',
                      objectFit: 'cover',
                      border: '1px solid rgba(255,255,255,0.08)',
                      flexShrink: 0,
                    }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ))}
                {conv.hasCreativePackage && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '9px',
                    fontWeight: 600,
                    color: `rgba(${PURPLE_RGB}, 0.9)`,
                    background: `rgba(${PURPLE_RGB}, 0.1)`,
                    border: `1px solid rgba(${PURPLE_RGB}, 0.2)`,
                    borderRadius: '4px',
                    padding: '2px 5px',
                    letterSpacing: '0.03em',
                  }}>
                    <Layers size={8} />
                    Package
                  </span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
