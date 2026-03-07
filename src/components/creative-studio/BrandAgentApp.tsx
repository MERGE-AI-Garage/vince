// ABOUTME: Vince creative director interface with blended voice+chat
// ABOUTME: Text chat with brand context, structured prompts, and inline voice bar overlay

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Camera, Sparkles, Copy, Check, CheckCircle2, AlertCircle, Mic, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatMessage, InputArea, type Message, type Attachment } from '@/components/shared-chat';
import { type TranscriptItem } from '@/components/shared-chat/VoiceOverlay';
import { CompactAudioIndicator } from '@/components/shared-chat/CompactAudioIndicator';
import { supabase } from '@/integrations/supabase/client';
import {
  generateBrandAgentGreeting,
  sendMessageToBrandAgent,
  createBrandAgentConversation,
  fetchBrandContext,
  deriveBrandContextPrompts,
  type UserContext,
  type BrandContext,
  type ToolAction,
  type GeneratedImage,
} from '@/services/brand-agent/brandAgentGeminiService';
import {
  connectVinceLiveSession,
  setApiKey as setLiveApiKey,
  type LiveSessionControl,
} from '@/services/brand-agent/brandAgentLiveService';
import {
  getBrandAgentSettings,
  DEFAULT_QUICK_PROMPTS,
} from '@/services/brand-agent/brandAgentSettings';
import type { CameraPreset } from '@/types/creative-studio';
import { CreativePackageDisplay, type PackagePart } from './CreativePackageDisplay';

function formatToolAction(action: ToolAction): string {
  const result = action.result as Record<string, unknown> | undefined;
  switch (action.toolName) {
    case 'save_prompt_template':
      return action.success
        ? `Saved "${(result?.name as string) || 'template'}" to prompt library${result?.category ? ` (${result.category})` : ''}`
        : `Failed to save template: ${action.error}`;
    case 'search_prompt_library':
      return action.success
        ? `Found ${(result?.count as number) || 0} matching template(s)`
        : `Search failed: ${action.error}`;
    case 'analyze_brand_image':
      return action.success
        ? (result?.message as string) || 'Image analysis complete'
        : action.error || 'Image analysis failed';
    case 'get_brand_profile':
      return action.success
        ? (result?.exists ? `Brand profile loaded (${(result?.total_images_analyzed as number) || 0} images)` : 'No brand profile exists yet')
        : `Profile lookup failed: ${action.error}`;
    case 'generate_image':
      return action.success
        ? `Generated ${(result?.image_count as number) || 0} image(s) in ${(((result?.generation_time_ms as number) || 0) / 1000).toFixed(1)}s`
        : `Generation failed: ${action.error}`;
    case 'generate_creative_package':
      return action.success
        ? `Creative package: ${(result?.image_urls as string[])?.length || 0} images in ${(((result?.latency_ms as number) || 0) / 1000).toFixed(1)}s`
        : `Package generation failed: ${action.error}`;
    case 'list_available_models':
      return action.success
        ? `Found ${(result?.count as number) || 0} available model(s)`
        : `Model lookup failed: ${action.error}`;
    case 'check_generation_quota':
      return action.success
        ? `Quota: ${(result?.remaining as number) ?? '?'} remaining of ${(result?.limit as number) || '?'}`
        : `Quota check failed: ${action.error}`;
    default:
      return action.success ? `${action.toolName} completed` : `${action.toolName} failed: ${action.error}`;
  }
}


interface BrandAgentAppProps {
  brandId: string | null;
  brandName: string;
  onApplyPrompt?: (prompt: string) => void;
  onApplyCameraPreset?: (preset: CameraPreset) => void;
  onApplyModel?: (modelId: string) => void;
  onGenerate?: () => void;
  onClose?: () => void;
  onBrandCreated?: (brandId: string) => void;
}

interface CreativePackageResult {
  parts: PackagePart[];
  image_urls: string[];
  latency_ms: number;
  model: string;
  brand_name: string;
}

interface AgentResponse {
  prompt?: string;
  camera_preset?: CameraPreset;
  recommended_model?: string;
  tool_actions?: ToolAction[];
  generated_images?: GeneratedImage[];
  creative_package?: CreativePackageResult;
}

export function BrandAgentApp({
  brandId,
  brandName,
  onApplyPrompt,
  onApplyCameraPreset,
  onApplyModel,
  onGenerate,
  onClose,
  onBrandCreated,
}: BrandAgentAppProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<UserContext | undefined>(undefined);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | undefined>(undefined);
  const [liveApiKeyReady, setLiveApiKeyReady] = useState(false);
  const [brandCtx, setBrandCtx] = useState<BrandContext | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Map message IDs to structured agent responses
  const [agentResponses, setAgentResponses] = useState<Record<string, AgentResponse>>({});

  // Voice state
  const voiceVolumeRef = useRef(0);
  const [voiceTranscript, setVoiceTranscript] = useState<TranscriptItem[]>([]);
  const liveControlRef = useRef<LiveSessionControl | null>(null);
  const addedTranscriptIdsRef = useRef<Set<string>>(new Set());
  // Token-based guard: each connection attempt gets a unique token;
  // handleCloseVoice resets it to -1 so pending connections self-abort.
  const activeConnectionTokenRef = useRef<number>(0);
  const voiceAutoStartedRef = useRef(false);

  // Settings state
  const [quickPrompts, setQuickPrompts] = useState<string[]>(DEFAULT_QUICK_PROMPTS);
  const [promptOffset, setPromptOffset] = useState(0);
  const [enableImageUpload, setEnableImageUpload] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastFailedMessageRef = useRef<string | null>(null);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      setMessages([{
        id: uuidv4(),
        role: 'model',
        content: 'Vince online. Loading brand profile...',
        timestamp: new Date(),
      }]);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('[Vince] No authenticated user');
          return;
        }

        setUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('email, first_name, last_name, full_name, title, department, avatar_url')
          .eq('id', user.id)
          .single();

        if (profile?.avatar_url) setUserAvatarUrl(profile.avatar_url);

        const context: UserContext = {
          id: user.id,
          email: profile?.email || user.email || '',
          name: profile?.full_name || profile?.first_name || user.email?.split('@')[0] || 'there',
          title: profile?.title,
          department: profile?.department,
        };
        setUserContext(context);

        // Create conversation record
        try {
          const convId = await createBrandAgentConversation(user.id);
          setConversationId(convId);
        } catch (convError) {
          console.warn('[Vince] Conversation creation failed, using fallback:', convError);
          setConversationId(uuidv4());
        }

        // Load settings
        try {
          const settings = await getBrandAgentSettings();
          setQuickPrompts(settings.quick_prompts || DEFAULT_QUICK_PROMPTS);
          setPromptOffset(Math.floor(Math.random() * (settings.quick_prompts?.length || 12)));
          setEnableImageUpload(settings.enable_image_upload);
        } catch {
          console.warn('[Vince] Settings fetch failed, using defaults');
        }

        // Fetch API key for voice mode
        try {
          const { data: apiKey, error: keyError } = await supabase.rpc('get_secret', {
            secret_name: 'GEMINI_API_KEY',
          });
          if (keyError) {
            console.warn('[Vince] Failed to fetch GEMINI_API_KEY:', keyError.message);
          } else if (apiKey) {
            setLiveApiKey(apiKey);
            setLiveApiKeyReady(true);
          }
        } catch (keyError) {
          console.warn('[Vince] API key unavailable, voice mode disabled:', keyError);
        }

        // Load brand context
        let loadedBrandCtx: BrandContext | null = null;
        if (brandId) {
          loadedBrandCtx = await fetchBrandContext(brandId);
          setBrandCtx(loadedBrandCtx);
        }

        // Generate greeting
        const greetingText = await generateBrandAgentGreeting(context, loadedBrandCtx || undefined);
        setMessages([{
          id: uuidv4(),
          role: 'model',
          content: greetingText,
          timestamp: new Date(),
        }]);

        // Build quick prompts: brand-specific > context-derived > global defaults
        if (loadedBrandCtx) {
          const brandQuickPrompts = loadedBrandCtx.brand?.quick_prompts
            ?.map(qp => qp.prompt)
            .filter(Boolean) || [];
          const contextPrompts = deriveBrandContextPrompts(loadedBrandCtx);

          if (brandQuickPrompts.length > 0) {
            // Brand has custom quick prompts — use those, prepend any context hints
            const merged = [...contextPrompts, ...brandQuickPrompts.filter(p => !contextPrompts.includes(p))];
            setQuickPrompts(merged);
            setPromptOffset(Math.floor(Math.random() * merged.length));
          } else if (contextPrompts.length > 0) {
            // No brand prompts, but we have context-derived ones — prepend to global defaults
            setQuickPrompts(prev => {
              const merged = [...contextPrompts, ...prev.filter(p => !contextPrompts.includes(p))];
              return merged;
            });
          }
        }
      } catch (error) {
        console.error('[Vince] Initialization error:', error);
      }
    };

    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (messages.length > 1) {
      const container = messagesEndRef.current?.parentElement;
      if (container) container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Auto-start voice when API key becomes ready (voice-first mode)
  useEffect(() => {
    if (liveApiKeyReady && !voiceAutoStartedRef.current) {
      voiceAutoStartedRef.current = true;
      handleStartVoice();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveApiKeyReady]);

  // Cleanup on unmount — disconnect voice but preserve conversation
  useEffect(() => {
    return () => {
      if (liveControlRef.current) {
        liveControlRef.current.disconnect();
        liveControlRef.current = null;
      }
    };
  }, []);

  const handleSendMessage = async (text: string, attachments: Attachment[]) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: text,
      attachments: attachments.length > 0 ? attachments : undefined,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const agentMsgId = uuidv4();
    const agentMsg: Message = {
      id: agentMsgId,
      role: 'model',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, agentMsg]);

    try {
      let accumulatedContent = '';

      const response = await sendMessageToBrandAgent(
        text,
        conversationId,
        userId,
        brandId,
        (chunk) => {
          accumulatedContent += chunk;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === agentMsgId ? { ...msg, content: accumulatedContent } : msg
            )
          );
        },
        userContext,
        attachments.length > 0 ? attachments : undefined
      );

      setMessages(prev =>
        prev.map(msg =>
          msg.id === agentMsgId ? { ...msg, isStreaming: false } : msg
        )
      );

      // Extract creative package from tool actions if present
      let creativePackage: CreativePackageResult | undefined;
      const packageAction = response.tool_actions?.find(
        (a: ToolAction) => a.toolName === 'generate_creative_package' && a.success
      );
      if (packageAction?.result) {
        const r = packageAction.result as Record<string, unknown>;
        if (r.parts && Array.isArray(r.parts)) {
          creativePackage = {
            parts: r.parts as PackagePart[],
            image_urls: (r.image_urls as string[]) || [],
            latency_ms: (r.latency_ms as number) || 0,
            model: (r.model as string) || 'gemini-3.1-flash-image-preview',
            brand_name: brandName,
          };
        }
      }

      // Store structured response data alongside the message
      if (response.prompt || response.camera_preset || response.recommended_model || response.tool_actions?.length || response.generated_images?.length || creativePackage) {
        setAgentResponses(prev => ({
          ...prev,
          [agentMsgId]: {
            prompt: response.prompt,
            camera_preset: response.camera_preset as CameraPreset | undefined,
            recommended_model: response.recommended_model,
            tool_actions: response.tool_actions,
            generated_images: response.generated_images,
            creative_package: creativePackage,
          },
        }));
      }

      // If a brand was created, notify the parent so it can switch to the new brand
      const createAction = response.tool_actions?.find(
        (a: ToolAction) => a.toolName === 'create_brand' && a.success
      );
      if (createAction?.result && onBrandCreated) {
        const newBrandId = (createAction.result as Record<string, unknown>).brand_id as string;
        if (newBrandId) onBrandCreated(newBrandId);
      }

      // Auto-apply prompt, camera preset, and model to Creative Studio
      const shouldApply = response.generated_images?.length || response.generation_requested;
      if (shouldApply) {
        if (response.prompt && onApplyPrompt) onApplyPrompt(response.prompt);
        if (response.camera_preset && onApplyCameraPreset) onApplyCameraPreset(response.camera_preset as CameraPreset);
        if (response.recommended_model && onApplyModel) onApplyModel(response.recommended_model);
      }

      // Trigger generation through the UI pipeline when Vince requested it but images weren't generated server-side
      if (response.generation_requested && !response.generated_images?.length && response.prompt && onGenerate) {
        // Let React flush the state updates from onApplyPrompt/onApplyCameraPreset/onApplyModel before triggering
        setTimeout(() => onGenerate(), 100);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Vince] Message error:', errorMsg, error);
      lastFailedMessageRef.current = text;

      let displayMsg: string;
      if (errorMsg.includes('brand_id') || errorMsg.includes('required')) {
        displayMsg = 'Select a brand first — Vince needs brand context to generate prompts.';
      } else if (errorMsg.includes('Not authenticated') || errorMsg.includes('401')) {
        displayMsg = 'Session expired — please refresh the page and try again.';
      } else if (errorMsg.includes('Stream ended without')) {
        displayMsg = "Vince didn't respond — please try again.";
      } else {
        displayMsg = `Something went wrong: ${errorMsg}`;
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === agentMsgId
            ? { ...msg, content: displayMsg, isStreaming: false, isError: true }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Track reconnection attempts
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 2;

  const connectVoice = async (resumeHandle?: string) => {
    const token = Date.now();
    activeConnectionTokenRef.current = token;
    try {
      const control = await connectVinceLiveSession(
        {
          onClose: () => {
            const handle = liveControlRef.current?.getResumeHandle?.();
            liveControlRef.current = null;

            // Try auto-reconnect with resume handle
            if (handle && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
              reconnectAttemptsRef.current++;
              console.log(`[Vince] Session closed, reconnecting (attempt ${reconnectAttemptsRef.current})...`);
              setMessages(prev => [...prev, {
                id: uuidv4(),
                role: 'model' as const,
                content: 'Reconnecting voice...',
                timestamp: new Date(),
                isVoice: true,
              }]);
              connectVoice(handle);
            } else {
              setIsVoiceMode(false);
              setMessages(prev => [...prev, {
                id: uuidv4(),
                role: 'model' as const,
                content: 'Voice session ended.',
                timestamp: new Date(),
              }]);
            }
          },
          onError: (err) => {
            console.error('[Vince] Voice error:', err);
            liveControlRef.current = null;
            setIsVoiceMode(false);
            setMessages(prev => [...prev, {
              id: uuidv4(),
              role: 'model',
              content: 'Voice connection lost. Chat mode active.',
              timestamp: new Date(),
            }]);
          },
          onVolumeUpdate: (vol) => {
            voiceVolumeRef.current = vol;
          },
          onTranscriptUpdate: (item) => {
            setVoiceTranscript(prev => {
              const filtered = prev.filter(t => t.id !== item.id);
              return [...filtered, item];
            });
            // Push final transcripts into the chat thread in real time
            if (item.isFinal && item.text && !addedTranscriptIdsRef.current.has(item.id)) {
              addedTranscriptIdsRef.current.add(item.id);
              setMessages(prev => [...prev, {
                id: uuidv4(),
                role: item.role === 'user' ? 'user' as const : 'model' as const,
                content: item.text,
                timestamp: new Date(),
                isVoice: true,
              }]);
            }
          },
          onToolResult: (toolName, result) => {
            if (toolName === 'generate_image' && result.output_urls) {
              const images = (result.output_urls as string[]).map(url => ({
                url,
                generation_id: result.generation_id as string | undefined,
              }));
              const imgMsgId = uuidv4();
              setMessages(prev => [...prev, {
                id: imgMsgId,
                role: 'model' as const,
                content: `Generated ${images.length} image(s) via voice`,
                timestamp: new Date(),
              }]);
              setAgentResponses(prev => ({
                ...prev,
                [imgMsgId]: { generated_images: images },
              }));
            }
          },
        },
        userContext,
        brandId,
        resumeHandle,
      );

      // If the user exited voice mode while we were connecting, abandon this session
      if (activeConnectionTokenRef.current !== token) {
        control?.disconnect?.();
        return;
      }

      if (control) {
        liveControlRef.current = control;
        if (resumeHandle) {
          console.log('[Vince] Reconnected successfully');
        }
      } else {
        setIsVoiceMode(false);
        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'model',
          content: 'Voice mode unavailable. Using chat instead.',
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('[Vince] Voice connection failed:', error);
      setIsVoiceMode(false);
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'model',
        content: 'Voice mode failed to start. Chat is available.',
        timestamp: new Date(),
      }]);
    }
  };

  const handleStartVoice = async () => {
    setIsVoiceMode(true);
    setVoiceTranscript([]);
    voiceVolumeRef.current = 0;
    addedTranscriptIdsRef.current.clear();
    reconnectAttemptsRef.current = 0;
    activeConnectionTokenRef.current = 0; // reset so new connection isn't blocked
    connectVoice();
  };

  const handleCloseVoice = () => {
    // Prevent auto-reconnect when user manually closes
    reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS;
    // Invalidate any pending connection attempt
    activeConnectionTokenRef.current = -1;
    if (liveControlRef.current) {
      liveControlRef.current.disconnect();
      liveControlRef.current = null;
    }
    setIsVoiceMode(false);
    setVoiceTranscript([]);
    addedTranscriptIdsRef.current.clear();
  };


  const copyPrompt = (prompt: string, msgId: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(messages.findIndex(m => m.id === msgId));
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Derive current transcript text for the voice bar
  const currentModelTranscript = voiceTranscript.find(t => t.id === 'current-model')?.text || '';
  const currentUserTranscript = voiceTranscript.find(t => t.id === 'current-user')?.text || '';
  const isModelSpeaking = currentModelTranscript.length > 0;
  const isUserSpeaking = currentUserTranscript.length > 0;
  const liveTranscriptText = isUserSpeaking ? currentUserTranscript : currentModelTranscript;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with brand context, upload, and voice toggle */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1 border-purple-500/30 text-purple-400">
            <Camera className="w-2.5 h-2.5" />
            {brandName || 'No Brand'}
          </Badge>
          {brandCtx && brandCtx.sourcesAnalyzed > 0 && (
            <Badge variant="secondary" className="text-[9px]">
              {brandCtx.sourcesAnalyzed} sources
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {enableImageUpload && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-purple-500 hover:text-purple-600 hover:bg-purple-50"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload image"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          )}
          {liveApiKeyReady && !isVoiceMode && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-purple-500 hover:text-purple-600 hover:bg-purple-50"
              onClick={handleStartVoice}
              aria-label="Start voice conversation"
            >
              <Mic className="w-4 h-4" />
            </Button>
          )}
          {isVoiceMode && (
            <Badge variant="outline" className="text-[9px] gap-1.5 border-red-500/40 text-red-400 animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              LIVE
            </Badge>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                if (ev.target?.result) {
                  const base64 = (ev.target.result as string).split(',')[1];
                  if (isVoiceMode && liveControlRef.current?.sendFile) {
                    liveControlRef.current.sendFile({
                      name: file.name,
                      mimeType: file.type,
                      data: base64,
                    }).catch(err => console.error('[Vince] Voice file upload failed:', err));
                  } else {
                    handleSendMessage(`[Uploaded: ${file.name}]`, [{
                      name: file.name,
                      mimeType: file.type,
                      data: base64,
                    }]);
                  }
                }
              };
              reader.readAsDataURL(file);
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          accept="image/*,application/pdf,text/plain"
        />
      </div>

      {/* Messages — always visible */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-1 scroll-smooth">
        {messages.map((message, idx) => (
          <React.Fragment key={message.id}>
            <ChatMessage
              message={message}
              agentName="Vince"
              agentIcon={Camera}
              userAvatarUrl={userAvatarUrl}
              compact
              onRetry={message.isError ? () => {
                const failedText = lastFailedMessageRef.current;
                if (failedText) {
                  lastFailedMessageRef.current = null;
                  setMessages(prev => prev.filter(m => m.id !== message.id));
                  handleSendMessage(failedText, []);
                }
              } : undefined}
            />

            {/* Structured Response Card — prompt, camera preset, model recommendation */}
            {message.role === 'model' && agentResponses[message.id] && (
              <div className="ml-2 mb-3 space-y-2">
                {/* Generated Prompt */}
                {agentResponses[message.id].prompt && (
                  <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                    <p className="text-[10px] font-medium text-purple-400 mb-1.5">Generated Prompt</p>
                    <p className="text-xs font-mono leading-relaxed text-foreground">
                      {agentResponses[message.id].prompt}
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      {onApplyPrompt && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onApplyPrompt(agentResponses[message.id].prompt!)}
                          className="h-6 text-[9px] gap-1 bg-purple-600 hover:bg-purple-700"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          Use Prompt
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyPrompt(agentResponses[message.id].prompt!, message.id)}
                        className="h-6 text-[9px] gap-1"
                      >
                        {copiedIndex === idx ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                        {copiedIndex === idx ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Camera Preset */}
                {agentResponses[message.id].camera_preset && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border">
                    <Camera className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-[10px] text-muted-foreground flex-1">
                      f/{agentResponses[message.id].camera_preset!.aperture} | {agentResponses[message.id].camera_preset!.focal_length}mm | {agentResponses[message.id].camera_preset!.lighting_setup?.replace(/_/g, ' ')}
                    </span>
                    {onApplyCameraPreset && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onApplyCameraPreset(agentResponses[message.id].camera_preset!)}
                        className="h-5 text-[9px] px-2 text-purple-400 hover:text-purple-300"
                      >
                        Apply Camera
                      </Button>
                    )}
                  </div>
                )}

                {/* Model Recommendation */}
                {agentResponses[message.id].recommended_model && onApplyModel && (
                  <button
                    onClick={() => onApplyModel(agentResponses[message.id].recommended_model!)}
                    className="text-[10px] text-purple-400 hover:text-purple-300 hover:underline px-3"
                  >
                    Recommended model: {agentResponses[message.id].recommended_model}
                  </button>
                )}

                {/* Tool Actions */}
                {agentResponses[message.id].tool_actions?.map((action, actionIdx) => (
                  <div
                    key={actionIdx}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                      action.success
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    {action.success ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatToolAction(action)}
                    </span>
                  </div>
                ))}

                {/* Creative Package (interleaved text + images) */}
                {agentResponses[message.id].creative_package && (
                  <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                    <CreativePackageDisplay
                      parts={agentResponses[message.id].creative_package!.parts}
                      imageUrls={agentResponses[message.id].creative_package!.image_urls}
                      latencyMs={agentResponses[message.id].creative_package!.latency_ms}
                      brandName={agentResponses[message.id].creative_package!.brand_name}
                      model={agentResponses[message.id].creative_package!.model}
                    />
                  </div>
                )}

                {/* Generated Images (single tool) */}
                {!agentResponses[message.id].creative_package && agentResponses[message.id].generated_images && agentResponses[message.id].generated_images!.length > 0 && (
                  <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                    <p className="text-[10px] font-medium text-purple-400 mb-2">Generated Images</p>
                    <div className={`grid gap-2 ${
                      agentResponses[message.id].generated_images!.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                    }`}>
                      {agentResponses[message.id].generated_images!.map((img, imgIdx) => (
                        <div key={imgIdx} className="relative group rounded-lg overflow-hidden border border-border/50">
                          <img
                            src={img.url}
                            alt={`Generated image ${imgIdx + 1}`}
                            className="w-full h-auto object-cover"
                            loading="lazy"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] text-white/80 hover:text-white"
                            >
                              Open full size
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        ))}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'model' && !messages[messages.length - 1].content && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <div className="flex items-center gap-1.5 bg-purple-500/10 rounded-full px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts — pinned above input, hidden during voice mode */}
      {!isVoiceMode && !isLoading && quickPrompts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-t bg-muted/20 flex-shrink-0">
          {quickPrompts
            .slice(promptOffset, promptOffset + 3)
            .concat(
              promptOffset + 3 > quickPrompts.length
                ? quickPrompts.slice(0, (promptOffset + 3) % quickPrompts.length)
                : []
            )
            .slice(0, 3)
            .map((prompt, idx) => (
              <Button
                key={`${promptOffset}-${idx}`}
                variant="outline"
                size="sm"
                className="text-[11px] h-auto py-1 px-2 bg-background"
                onClick={() => handleSendMessage(prompt, [])}
                disabled={isLoading}
              >
                {prompt}
              </Button>
            ))}
          {quickPrompts.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-[10px] text-muted-foreground hover:text-foreground px-1.5"
              onClick={() => setPromptOffset(prev => (prev + 3) % quickPrompts.length)}
            >
              More
            </Button>
          )}
        </div>
      )}

      {/* Voice bar — replaces input area during voice mode */}
      {isVoiceMode && (
        <div className="flex-shrink-0 border-t bg-muted/40 px-3 py-2.5">
          {/* Current transcript */}
          {liveTranscriptText && (
            <p className={`text-xs leading-relaxed mb-2 truncate ${
              isUserSpeaking ? 'text-cyan-400 italic' : 'text-foreground'
            }`}>
              {liveTranscriptText}
            </p>
          )}
          {/* Controls row */}
          <div className="flex items-center gap-3">
            <CompactAudioIndicator
              volumeRef={voiceVolumeRef}
              isModelSpeaking={isModelSpeaking}
              isUserSpeaking={isUserSpeaking}
            />
            <span className="text-[10px] text-muted-foreground flex-1">
              {!liveControlRef.current ? 'Reconnecting...' : isModelSpeaking ? 'Vince is speaking...' : isUserSpeaking ? 'Listening...' : 'Waiting...'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1 text-[10px]"
              onClick={handleCloseVoice}
              aria-label="Switch to chat"
            >
              <X className="w-3.5 h-3.5" />
              Chat
            </Button>
          </div>
        </div>
      )}

      {/* Text input — hidden during voice mode */}
      {!isVoiceMode && (
        <InputArea
          onSendMessage={handleSendMessage}
          onStartVoice={handleStartVoice}
          isLoading={isLoading}
          showVoiceButton={false}
          showDriveButton={false}
          showAttachButton={false}
          placeholder={`Describe your ${brandName || 'brand'} shot...`}
          disclaimer=""
          compact
        />
      )}
    </div>
  );
}
