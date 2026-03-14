// ABOUTME: Full chat interface tab for the Vince Chrome extension.
// ABOUTME: Merges text and voice interactions into a single message stream; renders rich payloads inline.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Link } from 'lucide-react';
import { ChatMessage, type Message } from './ChatMessage';
import { sendChatMessage } from '../services/chatService';
import type { ToolResult, VoiceState } from '../hooks/useVinceVoice';
import type { TranscriptItem } from '@/services/brand-agent/brandAgentLiveService';

// Vince always speaks in purple — never inherits the selected brand color
const PURPLE = '#8b5cf6';
const PURPLE_RGB = '139, 92, 246';

interface Props {
  brandId: string | null;
  voiceState: VoiceState;
  isMuted: boolean;
  voiceTranscript: TranscriptItem[];
  voiceToolResults: ToolResult[];
  volumeRef: React.MutableRefObject<number>;
  onStartVoice: () => void;
  onStopVoice: () => void;
  onToggleMute: () => void;
}

let messageIdCounter = 0;
function nextId() { return `msg-${++messageIdCounter}`; }

// ─── Inline Audio Bars ───────────────────────────────────────────────────────

function AudioBars({ volumeRef }: { volumeRef: React.MutableRefObject<number> }) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);
  const STAGGER = [0, 0.15, 0.05, 0.2, 0.1];

  useEffect(() => {
    let lastTime = 0;
    const animate = (time: number) => {
      if (time - lastTime < 33) { rafRef.current = requestAnimationFrame(animate); return; }
      lastTime = time;
      const vol = volumeRef.current;
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const stagger = STAGGER[i];
        let h: number;
        if (vol > 0.01) {
          h = 3 + Math.min(1, vol + stagger) * 12;
        } else {
          h = 3 + (0.3 + 0.1 * Math.sin(time / 800 + i * 0.8)) * 12 * 0.3;
        }
        bar.style.height = `${h}px`;
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [volumeRef]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '15px' }}>
      {[0,1,2,3,4].map(i => (
        <div key={i} ref={el => { barsRef.current[i] = el; }} style={{
          width: '3px', height: '3px', borderRadius: '2px', background: PURPLE,
        }} />
      ))}
    </div>
  );
}

// ─── Chat Tab ────────────────────────────────────────────────────────────────

export function ChatTab({ brandId, voiceState, isMuted, voiceTranscript, voiceToolResults, volumeRef, onStartVoice, onStopVoice, onToggleMute }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedUrl, setAttachedUrl] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Track what we've already synced from the voice session
  const syncedTranscriptIds = useRef(new Set<string>());
  const shownVoiceResultsCount = useRef(0);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset voice sync state when voice session ends
  useEffect(() => {
    if (voiceState === 'idle') {
      syncedTranscriptIds.current.clear();
      shownVoiceResultsCount.current = 0;
    }
  }, [voiceState]);

  // Sync voice transcript into chat messages as they stream in
  useEffect(() => {
    if (!voiceTranscript.length) return;

    setMessages(prev => {
      const updated = [...prev];
      let changed = false;

      for (const item of voiceTranscript) {
        if (!item.text) continue;
        const role = item.role === 'user' ? 'voice-user' as const : 'voice-assistant' as const;
        const existingIdx = updated.findIndex(m => m.id === `voice-${item.id}`);

        if (existingIdx >= 0) {
          // Update existing voice message (streaming update)
          if (updated[existingIdx].text !== item.text || updated[existingIdx].isFinal !== item.isFinal) {
            updated[existingIdx] = { ...updated[existingIdx], text: item.text, isFinal: item.isFinal };
            changed = true;
          }
        } else {
          // New voice message
          updated.push({ id: `voice-${item.id}`, role, text: item.text, isFinal: item.isFinal });
          changed = true;
        }
      }

      return changed ? updated : prev;
    });
  }, [voiceTranscript]);

  // Sync voice tool results into the last assistant message
  useEffect(() => {
    const newResults = voiceToolResults.slice(shownVoiceResultsCount.current);
    if (!newResults.length) return;
    shownVoiceResultsCount.current = voiceToolResults.length;

    setMessages(prev => {
      const lastAssistant = [...prev].reverse().find(m => m.role === 'assistant' || m.role === 'voice-assistant');
      if (lastAssistant) {
        return prev.map(m => m.id === lastAssistant.id
          ? { ...m, toolResults: [...(m.toolResults || []), ...newResults] }
          : m
        );
      }
      return [...prev, { id: nextId(), role: 'voice-assistant', text: '', toolResults: newResults, isFinal: true }];
    });
  }, [voiceToolResults]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const url = attachedUrl.trim();
    const fullText = url ? `${trimmed}\n\n[Reference: ${url}]` : trimmed;
    const displayText = url ? `${trimmed} 🔗` : trimmed;

    const userMsg: Message = { id: nextId(), role: 'user', text: displayText };
    const loadingMsg: Message = { id: nextId(), role: 'assistant', text: '', isLoading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setAttachedUrl('');
    setShowUrlInput(false);
    setIsSending(true);

    try {
      const response = await sendChatMessage(fullText, brandId);
      setMessages(prev => prev.map(m => m.id === loadingMsg.id
        ? { ...m, text: response.message, isLoading: false, toolResults: response.toolResults }
        : m
      ));
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Something went wrong';
      setMessages(prev => prev.map(m => m.id === loadingMsg.id
        ? { ...m, text: `Error: ${errorText}`, isLoading: false }
        : m
      ));
    } finally {
      setIsSending(false);
    }
  }, [brandId, isSending, attachedUrl]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleCampaignDirection = useCallback((text: string) => {
    setInput(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const isVoiceActive = voiceState !== 'idle';
  const isVoiceConnecting = voiceState === 'connecting';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '0', fontFamily: 'Epilogue, system-ui, sans-serif' }}>

      {/* Message list */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.08) transparent',
        }}
      >
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '48px', gap: '6px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(224,222,217,0.4)', textAlign: 'center', lineHeight: 1.6, maxWidth: '220px' }}>
              Ask Vince to generate a campaign, analyze a competitor, or create brand assets.
            </p>
          </div>
        )}
        {messages.map(msg => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onSelectCampaignDirection={handleCampaignDirection}
          />
        ))}
      </div>

      {/* Voice status bar — only shown when voice is active */}
      {isVoiceActive && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderTop: `1px solid rgba(${PURPLE_RGB}, 0.15)`,
          background: `rgba(${PURPLE_RGB}, 0.05)`,
        }}>
          {/* Status dot */}
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: isVoiceConnecting ? '#f59e0b' : isMuted ? 'rgba(224,222,217,0.3)' : PURPLE,
            boxShadow: isVoiceConnecting || isMuted ? undefined : `0 0 5px ${PURPLE}`,
            animation: isVoiceConnecting ? 'vinceChatStripPulse 1.2s ease-in-out infinite' : undefined,
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(224,222,217,0.8)', letterSpacing: '0.02em' }}>
            {isVoiceConnecting ? 'Connecting…' : isMuted ? 'Muted' : 'Vince Live'}
          </span>
          {voiceState === 'active' && !isMuted && <AudioBars volumeRef={volumeRef} />}
          <div style={{ flex: 1 }} />
          {/* Mute toggle */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute' : 'Mute mic'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '24px', height: '24px', borderRadius: '50%',
              border: isMuted ? '1px solid rgba(239,68,68,0.4)' : `1px solid rgba(${PURPLE_RGB}, 0.3)`,
              background: isMuted ? 'rgba(239,68,68,0.1)' : `rgba(${PURPLE_RGB}, 0.1)`,
              cursor: 'pointer',
            }}
          >
            {isMuted
              ? <MicOff size={11} style={{ color: '#fca5a5' }} />
              : <Mic size={11} style={{ color: PURPLE }} />
            }
          </button>
          <button
            onClick={onStopVoice}
            style={{
              padding: '2px 9px', fontSize: '10px', fontWeight: 600,
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: '4px', color: '#fca5a5', cursor: 'pointer',
              fontFamily: 'Epilogue, system-ui, sans-serif',
            }}
          >
            End
          </button>
        </div>
      )}

      {/* URL attachment — always visible, paste a reference image or video URL */}
      <div style={{
        padding: '5px 10px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.08)',
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
      }}>
        <Link size={10} style={{ color: attachedUrl ? PURPLE : 'rgba(224,222,217,0.25)', flexShrink: 0 }} />
        <input
          type="url"
          value={attachedUrl}
          onChange={e => setAttachedUrl(e.target.value)}
          placeholder="Paste reference image or video URL…"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            fontSize: '10px', color: attachedUrl ? '#e0ded9' : 'rgba(224,222,217,0.35)',
            fontFamily: 'Epilogue, system-ui, sans-serif',
          }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); inputRef.current?.focus(); } }}
        />
        {attachedUrl && (
          <button onClick={() => setAttachedUrl('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(224,222,217,0.3)', fontSize: '13px', lineHeight: 1, padding: '0 2px' }}>×</button>
        )}
      </div>

      {/* Input row */}
      <div style={{
        padding: '8px 10px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(0,0,0,0.15)',
        display: 'flex',
        gap: '6px',
        alignItems: 'flex-end',
      }}>
        {/* Mic toggle */}
        <button
          onClick={isVoiceActive ? onStopVoice : onStartVoice}
          title={isVoiceActive ? 'End voice session' : 'Talk to Vince'}
          style={{
            flexShrink: 0,
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            border: isVoiceActive ? `1.5px solid ${PURPLE}` : '1.5px solid rgba(234,232,227,0.2)',
            background: isVoiceActive ? `rgba(${PURPLE_RGB}, 0.18)` : 'rgba(234,232,227,0.06)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            animation: voiceState === 'active' ? 'vinceChatMicPulse 2s ease-in-out infinite' : undefined,
          }}
        >
          {isVoiceActive
            ? <MicOff size={13} style={{ color: PURPLE }} />
            : <Mic size={13} style={{ color: 'rgba(234,232,227,0.5)' }} />
          }
        </button>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isVoiceActive ? 'Type to follow up…' : 'Ask Vince anything…'}
          rows={1}
          disabled={isSending}
          style={{
            flex: 1,
            resize: 'none',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${attachedUrl ? `rgba(${PURPLE_RGB}, 0.35)` : 'rgba(255,255,255,0.09)'}`,
            borderRadius: '8px',
            padding: '7px 10px',
            fontSize: '12px',
            color: '#e0ded9',
            fontFamily: 'Epilogue, system-ui, sans-serif',
            lineHeight: 1.5,
            outline: 'none',
            maxHeight: '80px',
            overflowY: 'auto',
            opacity: isSending ? 0.6 : 1,
          }}
          onInput={e => {
            const t = e.currentTarget;
            t.style.height = 'auto';
            t.style.height = `${Math.min(t.scrollHeight, 80)}px`;
          }}
          onFocus={e => { e.currentTarget.style.borderColor = `rgba(${PURPLE_RGB}, 0.45)`; }}
          onBlur={e => { e.currentTarget.style.borderColor = attachedUrl ? `rgba(${PURPLE_RGB}, 0.35)` : 'rgba(255,255,255,0.09)'; }}
        />

        {/* Send button */}
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isSending}
          style={{
            flexShrink: 0,
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            border: 'none',
            background: input.trim() && !isSending ? PURPLE : 'rgba(255,255,255,0.07)',
            cursor: input.trim() && !isSending ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s ease',
          }}
        >
          <Send size={13} style={{ color: input.trim() && !isSending ? '#fff' : 'rgba(224,222,217,0.25)' }} />
        </button>
      </div>

      <style>{`
        @keyframes vinceChatMicPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(${PURPLE_RGB},0.3); }
          50% { box-shadow: 0 0 0 4px rgba(${PURPLE_RGB},0); }
        }
        @keyframes vinceChatStripPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
