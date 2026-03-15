// ABOUTME: Voice lifecycle hook for Vince in the Chrome extension side panel
// ABOUTME: Manages Gemini Live connection, API key, transcript, and volume state

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  connectVinceLiveSession,
  setApiKey as setLiveApiKey,
  forceCleanup,
  type TranscriptItem,
  type LiveSessionControl,
} from '@/services/brand-agent/brandAgentLiveService';
import type { UserContext } from '@/services/brand-agent/brandAgentGeminiService';

export type VoiceState = 'idle' | 'connecting' | 'active' | 'error';

export interface GenerationRecord {
  id: string;
  output_urls: string[];
  prompt_text: string | null;
  model_used: string;
  generation_type: string;
  created_at: string;
}

export type ToolResult =
  | { type: 'creative_package'; data: Record<string, unknown> }
  | { type: 'generated_images'; data: { image_urls: string[] } }
  | { type: 'generated_videos'; data: { video_urls: string[] } }
  | { type: 'competitor_analysis'; data: Record<string, unknown> }
  | { type: 'generation_history'; data: { generations: GenerationRecord[] } };

export interface UseVinceVoice {
  voiceState: VoiceState;
  isReady: boolean;
  isMuted: boolean;
  transcript: TranscriptItem[];
  toolResults: ToolResult[];
  volumeRef: React.MutableRefObject<number>;
  startVoice: () => Promise<void>;
  stopVoice: () => void;
  toggleMute: () => void;
  errorMessage: string | null;
}

// Chrome side panels can't render the getUserMedia permission prompt properly.
// Opens a popup window (with external JS — inline scripts blocked by MV3 CSP)
// that requests mic access. The popup sends MIC_PERMISSION_GRANTED via chrome.runtime.
// Matches the proven pattern from the Axel extension.
async function ensureMicPermission(): Promise<boolean> {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    if (result.state === 'granted') return true;
    if (result.state === 'denied') return false;

    // state === 'prompt' — open a popup window to grant permission
    return new Promise((resolve) => {
      // Listen for the grant message from the popup
      function onMessage(msg: { type?: string }) {
        if (msg.type === 'MIC_PERMISSION_GRANTED') {
          chrome.runtime.onMessage.removeListener(onMessage);
          resolve(true);
        }
      }
      chrome.runtime.onMessage.addListener(onMessage);

      // Also watch the permission status directly (belt and suspenders)
      result.addEventListener('change', () => {
        if (result.state === 'granted') {
          chrome.runtime.onMessage.removeListener(onMessage);
          resolve(true);
        }
      });

      chrome.windows.create({
        url: chrome.runtime.getURL('mic-permission.html'),
        type: 'popup',
        width: 500,
        height: 400,
        focused: true,
      });
    });
  } catch {
    // permissions.query not supported — try getUserMedia directly
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch {
      return false;
    }
  }
}

export function useVinceVoice(brandId: string | null): UseVinceVoice {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const volumeRef = useRef(0);
  const sessionRef = useRef<LiveSessionControl | null>(null);
  const userContextRef = useRef<UserContext | null>(null);

  // Fetch API key and user context on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // User context — fetch from profiles table for richer personalization
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !cancelled) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, first_name, last_name, full_name, title, department')
            .eq('id', user.id)
            .single();

          userContextRef.current = {
            id: user.id,
            email: profile?.email || user.email || '',
            name: profile?.full_name || profile?.first_name || user.email?.split('@')[0] || 'there',
            title: profile?.title,
            department: profile?.department,
          };
        }

        // API key
        const { data: apiKey, error } = await supabase.rpc('get_secret', {
          secret_name: 'GEMINI_API_KEY',
        });
        if (error) {
          console.warn('[Vince Ext] Failed to fetch GEMINI_API_KEY:', error.message);
          return;
        }
        if (apiKey && !cancelled) {
          setLiveApiKey(apiKey);
          setIsReady(true);
        }
      } catch (err) {
        console.warn('[Vince Ext] Init failed:', err);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const stopVoice = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.disconnect();
      sessionRef.current = null;
    }
    forceCleanup();
    volumeRef.current = 0;
    setVoiceState('idle');
    setIsMuted(false);
    setTranscript([]);
    setToolResults([]);
    setErrorMessage(null);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      sessionRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const startVoice = useCallback(async () => {
    if (voiceState === 'connecting' || voiceState === 'active') return;

    setVoiceState('connecting');
    setTranscript([]);
    setErrorMessage(null);

    // Ensure mic permission is granted before connecting
    const hasPermission = await ensureMicPermission();
    if (!hasPermission) {
      setVoiceState('error');
      setErrorMessage('Microphone access is required for voice mode');
      return;
    }

    const session = await connectVinceLiveSession(
      {
        onClose: () => {
          sessionRef.current = null;
          setVoiceState('idle');
        },
        onError: (error) => {
          console.error('[Vince Ext] Voice error:', error);
          setErrorMessage(error.message);
          setVoiceState('error');
          sessionRef.current = null;
        },
        onVolumeUpdate: (vol) => {
          volumeRef.current = vol;
        },
        onTranscriptUpdate: (item) => {
          setTranscript(prev => {
            const filtered = prev.filter(t => t.id !== item.id);
            return [...filtered, item];
          });
        },
        onToolResult: (toolName, result) => {
          if (toolName === 'generate_creative_package') {
            setToolResults(prev => [...prev, { type: 'creative_package', data: result }]);
          } else if (toolName === 'generate_image') {
            const urls = (result as Record<string, unknown>).image_urls as string[] | undefined;
            if (urls?.length) {
              setToolResults(prev => [...prev, { type: 'generated_images', data: { image_urls: urls } }]);
            }
          } else if (toolName === 'generate_video') {
            const urls = (result as Record<string, unknown>).video_urls as string[] | undefined;
            if (urls?.length) {
              setToolResults(prev => [...prev, { type: 'generated_videos', data: { video_urls: urls } }]);
            }
          } else if (toolName === 'analyze_competitor_content') {
            setToolResults(prev => [...prev, { type: 'competitor_analysis', data: result }]);
          }
        },
      },
      userContextRef.current || undefined,
      brandId,
    );

    if (session) {
      sessionRef.current = session;
      setVoiceState('active');
    } else {
      setVoiceState('error');
      setErrorMessage('Failed to connect voice session');
    }
  }, [voiceState, brandId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.disconnect();
        sessionRef.current = null;
      }
      forceCleanup();
    };
  }, []);

  return { voiceState, isReady, isMuted, transcript, toolResults, volumeRef, startVoice, stopVoice, toggleMute, errorMessage };
}
