// ABOUTME: Collapsible prompt history stored in chrome.storage.local
// ABOUTME: Shows recent generated prompts with timestamps, copy, and reuse actions

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Copy, Check, Clock, Trash2 } from 'lucide-react';

export interface SavedPrompt {
  id: string;
  prompt: string;
  category: string;
  description: string;
  timestamp: number;
  historyId?: string | null;
}

const STORAGE_KEY = 'brand_prompt_history';
const MAX_HISTORY = 20;

function getStorage(): typeof chrome.storage.local | null {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return chrome.storage.local;
  }
  return null;
}

export function usePromptHistory() {
  const [history, setHistory] = useState<SavedPrompt[]>([]);

  useEffect(() => {
    const storage = getStorage();
    if (storage) {
      storage.get(STORAGE_KEY, (result) => {
        setHistory(result[STORAGE_KEY] || []);
      });
    }
  }, []);

  const savePrompt = useCallback((prompt: string, category: string, description: string, historyId?: string | null) => {
    const entry: SavedPrompt = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      prompt,
      category,
      description,
      timestamp: Date.now(),
      historyId: historyId || null,
    };

    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, MAX_HISTORY);
      const storage = getStorage();
      if (storage) {
        storage.set({ [STORAGE_KEY]: updated });
      }
      return updated;
    });
  }, []);

  const removePrompt = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter(p => p.id !== id);
      const storage = getStorage();
      if (storage) {
        storage.set({ [STORAGE_KEY]: updated });
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    const storage = getStorage();
    if (storage) {
      storage.set({ [STORAGE_KEY]: [] });
    }
  }, []);

  return { history, savePrompt, removePrompt, clearHistory };
}

interface PromptHistoryProps {
  history: SavedPrompt[];
  onReuse: (prompt: SavedPrompt) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CATEGORY_LABELS: Record<string, string> = {
  image: 'Visual',
  text: 'Copy',
  presentation: 'Deck',
  general: 'General',
};

export function PromptHistory({ history, onReuse, onRemove, onClear }: PromptHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (history.length === 0) return null;

  const handleCopy = (entry: SavedPrompt, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(entry.prompt);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{
      borderRadius: '12px',
      border: '1px solid rgba(19, 59, 52, 0.08)',
      background: '#1a3a32',
      overflow: 'hidden',
    }}>
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'Epilogue, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={12} style={{ color: '#8fa89e' }} />
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#8fa89e',
          }}>
            Recent prompts
          </span>
          <span style={{
            fontSize: '9px',
            fontWeight: 600,
            color: '#00856C',
            background: 'rgba(0, 133, 108, 0.08)',
            padding: '1px 6px',
            borderRadius: '8px',
          }}>
            {history.length}
          </span>
        </div>
        <ChevronDown size={12} style={{
          color: '#8fa89e',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s ease',
        }} />
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(19, 59, 52, 0.06)' }}>
          {history.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid rgba(19, 59, 52, 0.04)',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onClick={() => onReuse(entry)}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 133, 108, 0.02)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    color: '#00856C',
                    background: 'rgba(0, 133, 108, 0.06)',
                    padding: '1px 6px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                  }}>
                    {CATEGORY_LABELS[entry.category] || entry.category}
                  </span>
                  <span style={{ fontSize: '9px', color: '#8fa89e', opacity: 0.7 }}>
                    {formatRelativeTime(entry.timestamp)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={(e) => handleCopy(entry, e)}
                    style={{
                      padding: '2px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: copiedId === entry.id ? '#1ED75F' : '#636466',
                      opacity: copiedId === entry.id ? 1 : 0.4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {copiedId === entry.id ? <Check size={11} /> : <Copy size={11} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
                    style={{
                      padding: '2px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#8fa89e',
                      opacity: 0.3,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.3'; e.currentTarget.style.color = '#636466'; }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
              <div style={{
                fontSize: '11px',
                color: '#e0ded9',
                fontWeight: 500,
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {entry.description}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#8fa89e',
                lineHeight: 1.4,
                marginTop: '2px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {entry.prompt.slice(0, 120)}...
              </div>
            </div>
          ))}

          {/* Clear all */}
          <button
            onClick={onClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              width: '100%',
              padding: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 500,
              fontFamily: 'Epilogue, system-ui, sans-serif',
              color: '#8fa89e',
              opacity: 0.5,
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
          >
            <Trash2 size={10} />
            Clear history
          </button>
        </div>
      )}
    </div>
  );
}
