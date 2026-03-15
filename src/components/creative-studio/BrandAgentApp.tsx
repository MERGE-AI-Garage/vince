// ABOUTME: Vince creative director interface with blended voice+chat
// ABOUTME: Text chat with brand context, structured prompts, and inline voice bar overlay

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Camera, Sparkles, Copy, Check, CheckCircle2, AlertCircle, Mic, MicOff, PhoneOff, Paperclip, X, Link, Target, History, Layers } from 'lucide-react';
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
  saveVoiceConversation,
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
} from '@/services/brand-agent/brandAgentSettings';
import type { CameraPreset } from '@/types/creative-studio';
import { CreativePackageDisplay, type PackagePart } from './CreativePackageDisplay';
import { useInvalidateGenerations } from '@/hooks/useCreativeStudioGenerations';
import type { GenerationWithDetails } from '@/types/creative-studio';
import {
  fetchRecentConversations,
  loadConversationMessages,
  type ConversationSummary,
} from '@/services/vinceConversationHistory';

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
    case 'analyze_competitor_content':
      return action.success
        ? `Competitor analyzed — ${(result?.weaknesses as string[])?.length || 0} strategic openings found`
        : `Competitor analysis failed: ${action.error}`;
    case 'generate_video':
      return action.success
        ? `Video generated in ${(((result?.generation_time_ms as number) || 0) / 1000).toFixed(1)}s`
        : `Video generation failed: ${action.error}`;
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
  onSetImage?: (imageUrl: string) => void;
}

interface BrandAlignment {
  score: number;
  dimensions: {
    visual_identity: boolean;
    photography: boolean;
    color_system: boolean;
    brand_voice: boolean;
  };
}

interface CompetitorScene {
  timestamp: string;
  scene_type: string;
  emotional_signal: string;
  marketing_intent: string;
}

interface CampaignDirection {
  title: string;
  concept: string;
  emotional_angle: string;
  tagline: string;
}

interface CompetitorAnalysis {
  competitor_summary: string;
  key_messages: string[];
  visual_style: string;
  target_audience: string;
  emotional_hooks: string[];
  weaknesses: string[];
  scenes: CompetitorScene[];
  campaign_directions: CampaignDirection[];
  counter_brief: string;
  counter_deliverables?: Array<{
    name: string;
    description: string;
    deliverable_type: string;
    aspect_ratio: string;
  }>;
  video_url?: string;
}

interface SelfDemoAnalysis {
  product_summary: string;
  demo_score: number;
  ux_observations: string[];
  missed_opportunities: string[];
  demo_narrative_issues: string[];
  recommended_improvements: string[];
  video_url?: string;
}

interface CreativePackageResult {
  parts: PackagePart[];
  image_urls: string[];
  latency_ms: number;
  model: string;
  brand_name: string;
  brief?: string;
  deliverable_names?: string[];
  brand_alignment?: BrandAlignment;
}

interface EditedImage {
  url: string;
  generation_id?: string;
  text_response?: string;
  thought_signature?: string;
}

interface GenerationRecord {
  id: string;
  output_urls: string[];
  prompt_text: string | null;
  model_used: string;
  generation_type: string;
  created_at: string;
  estimated_cost_usd: number | null;
}

interface AgentResponse {
  prompt?: string;
  camera_preset?: CameraPreset;
  recommended_model?: string;
  tool_actions?: ToolAction[];
  generated_images?: GeneratedImage[];
  generated_videos?: string[];
  creative_package?: CreativePackageResult;
  competitor_analysis?: CompetitorAnalysis;
  self_demo_analysis?: SelfDemoAnalysis;
  edited_image?: EditedImage;
  generation_history?: GenerationRecord[];
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
  onSetImage,
}: BrandAgentAppProps) {
  const invalidateGenerations = useInvalidateGenerations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showHistoryPicker, setShowHistoryPicker] = useState(false);
  const [historySummaries, setHistorySummaries] = useState<ConversationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showCampaignsPicker, setShowCampaignsPicker] = useState(false);
  const [campaignHistory, setCampaignHistory] = useState<GenerationWithDetails[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<UserContext | undefined>(undefined);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | undefined>(undefined);
  const [liveApiKeyReady, setLiveApiKeyReady] = useState(false);
  const [brandCtx, setBrandCtx] = useState<BrandContext | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [pendingUrl, setPendingUrl] = useState('');
  const [activeToolName, setActiveToolName] = useState<string | null>(null);
  const [videoRenderingAt, setVideoRenderingAt] = useState<Date | null>(null);
  const [elapsedVideoSeconds, setElapsedVideoSeconds] = useState(0);
  const [analyzingVideoAt, setAnalyzingVideoAt] = useState<Date | null>(null);
  const [elapsedAnalysisSeconds, setElapsedAnalysisSeconds] = useState(0);

  // Map message IDs to structured agent responses
  const [agentResponses, setAgentResponses] = useState<Record<string, AgentResponse>>({});

  // Voice state
  const voiceVolumeRef = useRef(0);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<TranscriptItem[]>([]);
  const liveControlRef = useRef<LiveSessionControl | null>(null);
  const addedTranscriptIdsRef = useRef<Set<string>>(new Set());
  // Token-based guard: each connection attempt gets a unique token;
  // handleCloseVoice resets it to -1 so pending connections self-abort.
  const activeConnectionTokenRef = useRef<number>(0);
  // Refs for stale-closure-safe voice session persistence
  const conversationIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const voiceToolCallsRef = useRef(0);

  // Settings state
  const [quickPrompts, setQuickPrompts] = useState<string[]>([]);
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

        // Load settings
        try {
          const settings = await getBrandAgentSettings();
          setQuickPrompts(settings.quick_prompts || []);
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

  // Tick elapsed seconds while video is rendering
  useEffect(() => {
    if (!videoRenderingAt) { setElapsedVideoSeconds(0); return; }
    const interval = setInterval(() => {
      setElapsedVideoSeconds(Math.floor((Date.now() - videoRenderingAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [videoRenderingAt]);

  // Tick elapsed seconds while analyzing a video
  useEffect(() => {
    if (!analyzingVideoAt) { setElapsedAnalysisSeconds(0); return; }
    const interval = setInterval(() => {
      setElapsedAnalysisSeconds(Math.floor((Date.now() - analyzingVideoAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [analyzingVideoAt]);

  // Keep refs in sync for stale-closure-safe voice session persistence
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { conversationIdRef.current = conversationId; }, [conversationId]);

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
    if (/youtu\.?be|youtube\.com|\.mp4|\.mov/.test(text)) {
      setAnalyzingVideoAt(new Date());
    }

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

      // Lazily create the conversation record on first message
      let activeConversationId = conversationId;
      if (!activeConversationId && userId) {
        try {
          activeConversationId = await createBrandAgentConversation(userId);
          setConversationId(activeConversationId);
          conversationIdRef.current = activeConversationId;
        } catch (convError) {
          console.warn('[Vince] Conversation creation failed:', convError);
        }
      }

      const response = await sendMessageToBrandAgent(
        text,
        activeConversationId,
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
            brief: (r.brief as string) || undefined,
            deliverable_names: (r.deliverable_names as string[]) || [],
            brand_alignment: (r.brand_alignment as BrandAlignment) || undefined,
          };
        }
      }

      // Extract competitor analysis from tool actions if present
      let competitorAnalysis: CompetitorAnalysis | undefined;
      const competitorAction = response.tool_actions?.find(
        (a: ToolAction) => a.toolName === 'analyze_competitor_content' && a.success
      );
      if (competitorAction?.result) {
        const r = competitorAction.result as Record<string, unknown>;
        if (r.competitor_summary) {
          competitorAnalysis = {
            competitor_summary: r.competitor_summary as string,
            key_messages: (r.key_messages as string[]) || [],
            visual_style: (r.visual_style as string) || '',
            target_audience: (r.target_audience as string) || '',
            emotional_hooks: (r.emotional_hooks as string[]) || [],
            weaknesses: (r.weaknesses as string[]) || [],
            scenes: (r.scenes as CompetitorScene[]) || [],
            campaign_directions: (r.campaign_directions as CampaignDirection[]) || [],
            counter_brief: (r.counter_brief as string) || '',
            counter_deliverables: (r.counter_deliverables as CompetitorAnalysis['counter_deliverables']) || undefined,
            video_url: (r.video_url as string) || undefined,
          };
        }
      }

      // Extract self-demo analysis from tool actions if present
      let selfDemoAnalysis: SelfDemoAnalysis | undefined;
      const selfDemoAction = response.tool_actions?.find(
        (a: ToolAction) => a.toolName === 'analyze_self_demo' && a.success
      );
      if (selfDemoAction?.result) {
        const r = selfDemoAction.result as Record<string, unknown>;
        if (r.product_summary) {
          selfDemoAnalysis = {
            product_summary: r.product_summary as string,
            demo_score: (r.demo_score as number) || 0,
            ux_observations: (r.ux_observations as string[]) || [],
            missed_opportunities: (r.missed_opportunities as string[]) || [],
            demo_narrative_issues: (r.demo_narrative_issues as string[]) || [],
            recommended_improvements: (r.recommended_improvements as string[]) || [],
            video_url: (r.video_url as string) || undefined,
          };
        }
      }

      // Extract edit_image or generate_headshot_scene result (both return output_url)
      let editedImage: EditedImage | undefined;
      const editAction = response.tool_actions?.find(
        (a: ToolAction) => (a.toolName === 'edit_image' || a.toolName === 'generate_headshot_scene') && a.success
      );
      if (editAction?.result) {
        const r = editAction.result as Record<string, unknown>;
        if (r.output_url) {
          editedImage = {
            url: r.output_url as string,
            generation_id: (r.generation_id as string) || undefined,
            text_response: (r.text_response as string) || undefined,
            thought_signature: (r.thought_signature as string) || undefined,
          };
        }
      }

      // Extract list_generations result
      let generationHistory: GenerationRecord[] | undefined;
      const listAction = response.tool_actions?.find(
        (a: ToolAction) => a.toolName === 'list_generations' && a.success
      );
      if (listAction?.result) {
        const r = listAction.result as Record<string, unknown>;
        if (r.generations && Array.isArray(r.generations) && (r.generations as unknown[]).length > 0) {
          generationHistory = r.generations as GenerationRecord[];
        }
      }

      // Store structured response data alongside the message
      if (response.prompt || response.camera_preset || response.recommended_model || response.tool_actions?.length || response.generated_images?.length || creativePackage || competitorAnalysis || selfDemoAnalysis || editedImage || generationHistory) {
        setAgentResponses(prev => ({
          ...prev,
          [agentMsgId]: {
            prompt: response.prompt,
            camera_preset: response.camera_preset as CameraPreset | undefined,
            recommended_model: response.recommended_model,
            tool_actions: response.tool_actions,
            generated_images: response.generated_images,
            creative_package: creativePackage,
            competitor_analysis: competitorAnalysis,
            self_demo_analysis: selfDemoAnalysis,
            edited_image: editedImage,
            generation_history: generationHistory,
          },
        }));
        if (creativePackage || response.generated_images?.length) invalidateGenerations();
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
      setAnalyzingVideoAt(null);
    }
  };

  // Track reconnection attempts
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 2;

  // Persist voice session to chatbot_conversations — safe to call from stale closures
  const persistVoiceSession = () => {
    const convId = conversationIdRef.current;
    const msgs = messagesRef.current;
    if (!convId) return;
    const substantiveMessages = msgs.filter(m =>
      m.content &&
      m.content.length > 0 &&
      !m.isError &&
      !m.isStreaming &&
      !['Reconnecting voice...', 'Voice session ended.', 'Voice mode unavailable. Using chat instead.', 'Voice connection lost. Chat mode active.'].includes(m.content)
    );
    if (substantiveMessages.length === 0) return;
    const dbMessages = substantiveMessages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      content: m.content,
      timestamp: m.timestamp,
    }));
    saveVoiceConversation(convId, dbMessages, {
      brand_id: brandCtx?.brand?.id ?? null,
      brand_name: brandCtx?.brand?.name,
      tool_calls_count: voiceToolCallsRef.current,
    });
  };

  const connectVoice = async (resumeHandle?: string) => {
    const token = Date.now();
    activeConnectionTokenRef.current = token;
    try {
      const control = await connectVinceLiveSession(
        {
          onClose: () => {
            const handle = liveControlRef.current?.getResumeHandle?.();
            liveControlRef.current = null;

            // Persist before reconnect or end
            persistVoiceSession();

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
            const INTERIM_ID = 'voice-interim-model';
            // Stream Vince's response into chat progressively as he speaks
            if (!item.isFinal && item.role === 'model' && item.text) {
              setMessages(prev => {
                const existingIdx = prev.findIndex(m => m.id === INTERIM_ID);
                if (existingIdx >= 0) {
                  const updated = [...prev];
                  updated[existingIdx] = { ...updated[existingIdx], content: item.text };
                  return updated;
                }
                return [...prev, {
                  id: INTERIM_ID,
                  role: 'model' as const,
                  content: item.text,
                  timestamp: new Date(),
                  isVoice: true,
                }];
              });
            }
            // Replace interim with final, or add final user message directly
            if (item.isFinal && item.text && !addedTranscriptIdsRef.current.has(item.id)) {
              addedTranscriptIdsRef.current.add(item.id);
              setMessages(prev => {
                const filtered = item.role === 'model' ? prev.filter(m => m.id !== INTERIM_ID) : prev;
                return [...filtered, {
                  id: uuidv4(),
                  role: item.role === 'user' ? 'user' as const : 'model' as const,
                  content: item.text,
                  timestamp: new Date(),
                  isVoice: true,
                }];
              });
            }
          },
          onToolStart: (toolName) => {
            setActiveToolName(toolName);
          },
          onToolResult: (toolName, result) => {
            setActiveToolName(null);
            voiceToolCallsRef.current++;
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
              invalidateGenerations();
            } else if (toolName === 'generate_creative_package' && result.parts && Array.isArray(result.parts)) {
              const pkgMsgId = uuidv4();
              setMessages(prev => [...prev, {
                id: pkgMsgId,
                role: 'model' as const,
                content: `Creative package ready`,
                timestamp: new Date(),
              }]);
              setAgentResponses(prev => ({
                ...prev,
                [pkgMsgId]: {
                  creative_package: {
                    parts: result.parts as PackagePart[],
                    image_urls: (result.image_urls as string[]) || [],
                    latency_ms: (result.latency_ms as number) || 0,
                    model: (result.model as string) || 'gemini-3.1-flash-image-preview',
                    brand_name: brandName,
                    brief: (result.brief as string) || undefined,
                    deliverable_names: (result.deliverable_names as string[]) || [],
                    brand_alignment: (result.brand_alignment as BrandAlignment) || undefined,
                  },
                },
              }));
              invalidateGenerations();
            } else if (toolName === 'analyze_competitor_content' && result.competitor_summary) {
              setAnalyzingVideoAt(null);
              const compMsgId = uuidv4();
              setMessages(prev => [...prev, {
                id: compMsgId,
                role: 'model' as const,
                content: `Competitor analysis complete`,
                timestamp: new Date(),
              }]);
              setAgentResponses(prev => ({
                ...prev,
                [compMsgId]: {
                  competitor_analysis: {
                    competitor_summary: result.competitor_summary as string,
                    key_messages: (result.key_messages as string[]) || [],
                    visual_style: (result.visual_style as string) || '',
                    target_audience: (result.target_audience as string) || '',
                    emotional_hooks: (result.emotional_hooks as string[]) || [],
                    weaknesses: (result.weaknesses as string[]) || [],
                    scenes: (result.scenes as CompetitorScene[]) || [],
                    campaign_directions: (result.campaign_directions as CampaignDirection[]) || [],
                    counter_brief: (result.counter_brief as string) || '',
                    counter_deliverables: (result.counter_deliverables as CompetitorAnalysis['counter_deliverables']) || undefined,
                    video_url: (result.video_url as string) || undefined,
                  },
                },
              }));
            } else if (toolName === 'generate_video' && result.queued) {
              // Fire-and-forget video — start elapsed timer
              setVideoRenderingAt(new Date());
            } else if (toolName === 'generate_video' && result.output_urls && Array.isArray(result.output_urls) && result.output_urls.length > 0) {
              setVideoRenderingAt(null);
              const vidMsgId = uuidv4();
              setMessages(prev => [...prev, {
                id: vidMsgId,
                role: 'model' as const,
                content: `Video ready`,
                timestamp: new Date(),
              }]);
              setAgentResponses(prev => ({
                ...prev,
                [vidMsgId]: {
                  generated_videos: (result.output_urls as string[]),
                },
              }));
            } else if ((toolName === 'edit_image' || toolName === 'generate_headshot_scene') && result.output_url) {
              const editMsgId = uuidv4();
              setMessages(prev => [...prev, {
                id: editMsgId,
                role: 'model' as const,
                content: (result.text_response as string) || 'Image edited',
                timestamp: new Date(),
              }]);
              setAgentResponses(prev => ({
                ...prev,
                [editMsgId]: {
                  edited_image: {
                    url: result.output_url as string,
                    generation_id: (result.generation_id as string) || undefined,
                    text_response: (result.text_response as string) || undefined,
                    thought_signature: (result.thought_signature as string) || undefined,
                  },
                },
              }));
              invalidateGenerations();
            } else if (toolName === 'list_generations' && result.generations && Array.isArray(result.generations) && (result.generations as unknown[]).length > 0) {
              const histMsgId = uuidv4();
              setMessages(prev => [...prev, {
                id: histMsgId,
                role: 'model' as const,
                content: `Found ${(result.generations as unknown[]).length} generation(s)`,
                timestamp: new Date(),
              }]);
              setAgentResponses(prev => ({
                ...prev,
                [histMsgId]: {
                  generation_history: result.generations as GenerationRecord[],
                },
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
    voiceToolCallsRef.current = 0;
    addedTranscriptIdsRef.current.clear();
    reconnectAttemptsRef.current = 0;
    activeConnectionTokenRef.current = 0; // reset so new connection isn't blocked

    // Ensure we have a conversation record (created at init, but create now if missing)
    if (!conversationIdRef.current && userId) {
      try {
        const newId = await createBrandAgentConversation(userId);
        setConversationId(newId);
        conversationIdRef.current = newId;
      } catch {
        console.warn('[Vince] Could not create voice conversation record');
      }
    }

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
    setActiveToolName(null);
    setIsMuted(false);

    // Persist full message thread before clearing — fire-and-forget, non-blocking
    persistVoiceSession();

    setVoiceTranscript([]);
    addedTranscriptIdsRef.current.clear();
  };


  const copyPrompt = (prompt: string, msgId: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(messages.findIndex(m => m.id === msgId));
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleOpenHistory = async () => {
    setShowHistoryPicker(true);
    setShowCampaignsPicker(false);
    setHistoryLoading(true);
    try {
      const summaries = await fetchRecentConversations(25);
      setHistorySummaries(summaries);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRestoreConversation = async (summary: ConversationSummary) => {
    const restored = await loadConversationMessages(summary.id);
    setConversationId(summary.id);
    setMessages(restored);
    setAgentResponses({});
    setShowHistoryPicker(false);
  };

  const handleOpenCampaigns = async () => {
    setShowCampaignsPicker(true);
    setShowHistoryPicker(false);
    setCampaignsLoading(true);
    try {
      let query = supabase
        .from('creative_studio_generations')
        .select('*, brand:creative_studio_brands(*), model:creative_studio_models(name)')
        .eq('generation_type', 'creative_package')
        .order('created_at', { ascending: false })
        .limit(30);
      if (brandId) {
        query = query.eq('brand_id', brandId);
      }
      const { data } = await query;
      setCampaignHistory(
        (data || []).map(g => ({
          ...g,
          parameters: g.parameters as Record<string, unknown>,
          metadata: g.metadata as Record<string, unknown>,
          brand: g.brand ? { ...g.brand, quick_prompts: g.brand.quick_prompts as unknown[] } : undefined,
        })) as GenerationWithDetails[]
      );
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleLoadCampaign = (gen: GenerationWithDetails) => {
    setShowCampaignsPicker(false);
    const copyBlocks = gen.copy_blocks as PackagePart[] | null;
    const deliverableNames = (gen.metadata?.deliverable_names as string[]) || [];
    const brandAlignment = gen.metadata?.brand_alignment as BrandAlignment | undefined;
    const diff = Date.now() - new Date(gen.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    let relTime: string;
    if (mins < 60) relTime = mins <= 1 ? 'just now' : `${mins}m ago`;
    else if (mins < 1440) relTime = `${Math.floor(mins / 60)}h ago`;
    else if (mins < 2880) relTime = 'yesterday';
    else relTime = new Date(gen.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const msgId = uuidv4();
    const brandLabel = gen.brand?.name || brandName || 'brand';
    setMessages(prev => [...prev, {
      id: msgId,
      role: 'model' as const,
      content: `Here's your ${brandLabel} campaign from ${relTime}. What would you like to change or explore next?`,
      timestamp: new Date(),
    }]);
    setAgentResponses(prev => ({
      ...prev,
      [msgId]: {
        creative_package: {
          parts: copyBlocks || gen.output_urls.map(url => ({ type: 'image' as const, content: url })),
          image_urls: gen.output_urls,
          latency_ms: (gen.metadata?.generation_time_ms as number) || 0,
          model: gen.model_used || '',
          brand_name: brandLabel,
          brief: gen.prompt_text || '',
          deliverable_names: deliverableNames,
          brand_alignment: brandAlignment,
        },
      },
    }));
  };

  const handleDirectionSelect = (direction: CampaignDirection, analysis: CompetitorAnalysis) => {
    const text = `Let's go with the "${direction.title}" direction. ${direction.concept} Tagline: "${direction.tagline}"`;
    handleSendMessage(text, []);
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
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${showCampaignsPicker ? 'text-purple-500 bg-purple-50' : 'text-muted-foreground hover:text-purple-500 hover:bg-purple-50'}`}
            onClick={showCampaignsPicker ? () => setShowCampaignsPicker(false) : handleOpenCampaigns}
            aria-label="Campaign archive"
            title="Campaign archive"
          >
            <Layers className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${showHistoryPicker ? 'text-purple-500 bg-purple-50' : 'text-muted-foreground hover:text-purple-500 hover:bg-purple-50'}`}
            onClick={showHistoryPicker ? () => setShowHistoryPicker(false) : handleOpenHistory}
            aria-label="Chat history"
            title="Chat history"
          >
            <History className="w-4 h-4" />
          </Button>
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
            <>
              <Badge variant="outline" className="text-[9px] gap-1.5 border-red-500/40 text-red-400 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                LIVE
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${isMuted ? 'text-red-400 hover:text-red-300' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => {
                  const next = !isMuted;
                  setIsMuted(next);
                  liveControlRef.current?.setMuted(next);
                }}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-red-400"
                onClick={handleCloseVoice}
                aria-label="End voice session"
                title="Back to chat"
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const isDocument = file.type === 'application/pdf'
                || file.name.endsWith('.docx')
                || file.name.endsWith('.pptx')
                || file.type === 'text/plain';

              const reader = new FileReader();
              reader.onload = async (ev) => {
                if (!ev.target?.result) return;
                const base64 = (ev.target.result as string).split(',')[1];

                // Documents (PDF, DOCX, etc.): upload to Storage, then import directly
                // without waiting for Vince to decide. Notify Vince after so he responds naturally.
                if (isDocument && brandId) {
                  const path = `brand-documents/${brandId}/${Date.now()}-${file.name}`;
                  const { error: uploadError } = await supabase.storage
                    .from('media')
                    .upload(path, file, { contentType: file.type });
                  if (uploadError) {
                    console.error('[Vince] Document storage upload failed:', uploadError);
                    handleSendMessage(`[Uploaded: ${file.name}] (storage failed — cannot import by URL)`, []);
                    return;
                  }
                  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
                  const contentTypeMap: Record<string, string> = {
                    'application/pdf': 'pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
                    'text/plain': 'text',
                  };
                  const contentType = contentTypeMap[file.type] || (file.name.endsWith('.docx') ? 'docx' : file.name.endsWith('.pptx') ? 'pptx' : 'pdf');
                  const { error: importError } = await supabase.functions.invoke('brand-prompt-agent', {
                    body: {
                      mode: 'tool_call',
                      tool_name: 'import_brand_document',
                      brand_id: brandId,
                      parameters: {
                        document_url: publicUrl,
                        filename: file.name,
                        content_type: contentType,
                      },
                    },
                  });
                  const notify = importError
                    ? `I uploaded ${file.name} but the analysis failed. You can try importing it manually.`
                    : `I just imported and analyzed ${file.name} for the brand. The document has been processed and added to the brand profile. Would you like to synthesize the updated brand profile now?`;
                  if (isVoiceMode && liveControlRef.current?.sendText) {
                    liveControlRef.current.sendText(notify).catch(err => console.error('[Vince] Voice text inject failed:', err));
                  } else {
                    handleSendMessage(notify, []);
                  }
                  return;
                }

                // Images: stream directly in voice mode, or attach inline in chat mode
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
              };
              reader.readAsDataURL(file);
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        />
      </div>

      {/* Conversation history picker */}
      {showHistoryPicker && (
        <div className="flex-1 min-h-0 overflow-y-auto border-t bg-background">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/20 sticky top-0">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Past Conversations</span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] gap-1 text-purple-500 border-purple-500/30 hover:bg-purple-50"
              onClick={() => {
                setConversationId(null);
                conversationIdRef.current = null;
                setMessages([]);
                setAgentResponses({});
                setShowHistoryPicker(false);
              }}
            >
              + New chat
            </Button>
          </div>
          {historyLoading && (
            <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">Loading…</div>
          )}
          {!historyLoading && historySummaries.length === 0 && (
            <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">No past conversations yet.</div>
          )}
          {historySummaries.map(conv => (
            <button
              key={conv.id}
              onClick={() => handleRestoreConversation(conv)}
              className="w-full text-left px-3 py-2.5 border-b border-border/30 hover:bg-muted/30 transition-colors flex flex-col gap-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-foreground leading-snug line-clamp-2 flex-1">
                  {conv.firstUserMessage}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0 pt-0.5">
                  {(() => {
                    const diff = Date.now() - new Date(conv.updatedAt).getTime();
                    const mins = Math.floor(diff / 60000);
                    if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`;
                    const hours = Math.floor(mins / 60);
                    if (hours < 24) return `${hours}h ago`;
                    const days = Math.floor(hours / 24);
                    if (days === 1) return 'Yesterday';
                    if (days < 7) return `${days}d ago`;
                    return new Date(conv.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  })()}
                </span>
              </div>
              {(conv.thumbnails.length > 0 || conv.hasCreativePackage) && (
                <div className="flex items-center gap-1.5">
                  {conv.thumbnails.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="w-9 h-9 rounded object-cover border border-border/50"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ))}
                  {conv.hasCreativePackage && (
                    <span className="text-[9px] font-semibold text-purple-500 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5">
                      Package
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Campaign archive picker */}
      {showCampaignsPicker && (
        <div className="flex-1 min-h-0 overflow-y-auto border-t bg-background">
          <div className="px-3 py-2 border-b bg-muted/20 sticky top-0">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Campaign Archive</span>
          </div>
          {campaignsLoading && (
            <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">Loading…</div>
          )}
          {!campaignsLoading && campaignHistory.length === 0 && (
            <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">No campaigns yet.</div>
          )}
          {campaignHistory.map(gen => {
            const deliverableNames = (gen.metadata?.deliverable_names as string[]) || [];
            const diff = Date.now() - new Date(gen.created_at).getTime();
            const mins = Math.floor(diff / 60000);
            let relTime: string;
            if (mins < 60) relTime = mins <= 1 ? 'Just now' : `${mins}m ago`;
            else if (mins < 1440) relTime = `${Math.floor(mins / 60)}h ago`;
            else if (mins < 2880) relTime = 'Yesterday';
            else relTime = new Date(gen.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <button
                key={gen.id}
                onClick={() => handleLoadCampaign(gen)}
                className="w-full text-left px-3 py-2.5 border-b border-border/30 hover:bg-muted/30 transition-colors flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-foreground leading-snug line-clamp-2 flex-1">
                    {gen.prompt_text || 'Creative package'}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 pt-0.5">{relTime}</span>
                </div>
                {gen.output_urls.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {gen.output_urls.slice(0, 4).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="w-9 h-9 rounded object-cover border border-border/50"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ))}
                    {deliverableNames.length > 0 && (
                      <span className="text-[9px] font-semibold text-purple-500 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5 ml-1">
                        {deliverableNames.length} deliverables
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Messages — always visible */}
      {!showHistoryPicker && !showCampaignsPicker && <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-1 scroll-smooth">
        {messages.map((message, idx) => (
          <React.Fragment key={message.id}>
            {message.content === 'Voice session ended.' ? (
              <div className="flex items-center justify-center py-2 my-1">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/40 bg-muted/30 text-[10px] text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                  Voice session ended
                </div>
              </div>
            ) : (
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
            )}

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

                {/* Competitor Analysis — Beat This Ad */}
                {agentResponses[message.id].competitor_analysis && (() => {
                  const analysis = agentResponses[message.id].competitor_analysis!;
                  return (
                    <div className="p-3 bg-purple-950/40 border border-purple-500/20 rounded-lg space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-purple-200 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-200">Beat This Ad</span>
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-foreground/80 leading-relaxed">{analysis.competitor_summary}</p>

                      {/* Scene Timeline */}
                      {analysis.scenes?.length > 0 && (
                        <div className="pt-2 border-t border-purple-500/15">
                          <p className="text-[10px] font-semibold text-purple-300/70 uppercase tracking-wider mb-1.5">Scene Breakdown</p>
                          <div className="space-y-1">
                            {analysis.scenes.map((scene, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <span className="text-purple-300/60 shrink-0 font-mono text-[10px] pt-0.5">{scene.timestamp}</span>
                                <span className="text-foreground/60 flex-1">{scene.scene_type}</span>
                                <span className="text-purple-300/50 shrink-0 text-[10px] italic">{scene.emotional_signal}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strategic Openings */}
                      {analysis.weaknesses?.length > 0 && (
                        <div className="pt-2 border-t border-purple-500/15">
                          <p className="text-[10px] font-semibold text-purple-300/70 uppercase tracking-wider mb-1.5">Strategic Openings</p>
                          <ul className="space-y-1">
                            {analysis.weaknesses.map((w, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/70">
                                <span className="text-purple-200 mt-0.5 shrink-0">›</span>
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 3 Campaign Directions */}
                      {analysis.campaign_directions?.length > 0 && (
                        <div className="pt-2 border-t border-purple-500/15 space-y-2">
                          <p className="text-[10px] font-semibold text-purple-300/70 uppercase tracking-wider">3 Ways to Beat It</p>
                          {analysis.campaign_directions.map((dir, i) => (
                            <button
                              key={i}
                              onClick={() => handleDirectionSelect(dir, analysis)}
                              className="w-full text-left p-2 bg-purple-950/40 hover:bg-purple-800/30 border border-purple-500/20 hover:border-purple-500/40 rounded cursor-pointer transition-colors space-y-0.5"
                            >
                              <p className="text-xs font-semibold text-foreground/90">{dir.title}</p>
                              <p className="text-[11px] text-foreground/60 leading-snug">{dir.concept}</p>
                              <p className="text-[10px] text-purple-300/70 italic">"{dir.tagline}"</p>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Counter Deliverables */}
                      {analysis.counter_deliverables && analysis.counter_deliverables.length > 0 && (
                        <div className="pt-2 border-t border-purple-500/15 space-y-1.5">
                          <p className="text-[10px] font-semibold text-purple-300/70 uppercase tracking-wider">Build These</p>
                          {analysis.counter_deliverables.map((d, i) => (
                            <button
                              key={i}
                              onClick={() => handleSendMessage(`Generate a creative package for a ${d.name} (${d.aspect_ratio}, deliverable_type: ${d.deliverable_type}) as part of the counter-campaign. Brief: ${d.description}`, [])}
                              className="w-full text-left flex items-center gap-2 px-2 py-1.5 bg-purple-950/40 hover:bg-purple-800/30 border border-purple-500/20 hover:border-purple-500/40 rounded transition-colors"
                            >
                              <span className="text-xs font-medium text-foreground/80 flex-1">{d.name}</span>
                              <span className="text-[10px] text-purple-300/50 shrink-0">{d.aspect_ratio}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Counter Brief (collapsible) */}
                      {analysis.counter_brief && (
                        <details className="pt-2 border-t border-purple-500/15">
                          <summary className="text-[10px] font-semibold text-purple-300/70 uppercase tracking-wider cursor-pointer select-none">
                            Full Counter Brief
                          </summary>
                          <p className="text-xs text-foreground/70 leading-relaxed mt-1.5">{analysis.counter_brief}</p>
                        </details>
                      )}
                    </div>
                  );
                })()}

                {/* Self-Demo Analysis */}
                {agentResponses[message.id].self_demo_analysis && (() => {
                  const demo = agentResponses[message.id].self_demo_analysis!;
                  return (
                    <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Self Analysis</span>
                        <span className="text-[10px] font-bold text-violet-400">Demo Score: {demo.demo_score}/100</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{demo.product_summary}</p>
                      {demo.ux_observations?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-violet-400/70 uppercase tracking-wider mb-1.5">UX Observations</p>
                          <ul className="space-y-1">
                            {demo.ux_observations.map((o, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/70">
                                <span className="text-violet-400 mt-0.5 shrink-0">›</span>
                                {o}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {demo.missed_opportunities?.length > 0 && (
                        <div className="pt-2 border-t border-violet-500/15">
                          <p className="text-[10px] font-semibold text-violet-400/70 uppercase tracking-wider mb-1.5">Missed Opportunities</p>
                          <ul className="space-y-1">
                            {demo.missed_opportunities.map((o, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/70">
                                <span className="text-violet-400 mt-0.5 shrink-0">›</span>
                                {o}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {demo.demo_narrative_issues?.length > 0 && (
                        <div className="pt-2 border-t border-violet-500/15">
                          <p className="text-[10px] font-semibold text-violet-400/70 uppercase tracking-wider mb-1.5">Narrative Issues</p>
                          <ul className="space-y-1">
                            {demo.demo_narrative_issues.map((n, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/70">
                                <span className="text-violet-400 mt-0.5 shrink-0">›</span>
                                {n}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {demo.recommended_improvements?.length > 0 && (
                        <div className="pt-2 border-t border-violet-500/15">
                          <p className="text-[10px] font-semibold text-violet-400/70 uppercase tracking-wider mb-1.5">Recommended Improvements</p>
                          <ul className="space-y-1">
                            {demo.recommended_improvements.map((r, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/70">
                                <span className="text-violet-400 mt-0.5 shrink-0">›</span>
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Creative Package (interleaved text + images) */}
                {agentResponses[message.id].creative_package && (
                  <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                    <CreativePackageDisplay
                      parts={agentResponses[message.id].creative_package!.parts}
                      imageUrls={agentResponses[message.id].creative_package!.image_urls}
                      latencyMs={agentResponses[message.id].creative_package!.latency_ms}
                      brandName={agentResponses[message.id].creative_package!.brand_name}
                      model={agentResponses[message.id].creative_package!.model}
                      brief={agentResponses[message.id].creative_package!.brief}
                      deliverableNames={agentResponses[message.id].creative_package!.deliverable_names}
                      brandAlignment={agentResponses[message.id].creative_package!.brand_alignment}
                      onLoadToCanvas={onSetImage}
                    />
                  </div>
                )}

                {/* Generated Videos */}
                {agentResponses[message.id].generated_videos && agentResponses[message.id].generated_videos!.length > 0 && (
                  <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg space-y-2">
                    <p className="text-[10px] font-medium text-purple-400">Generated Video</p>
                    {agentResponses[message.id].generated_videos!.map((url, vidIdx) => (
                      <div key={vidIdx} className="rounded-lg overflow-hidden border border-border/50">
                        <video
                          src={url}
                          controls
                          autoPlay
                          loop
                          muted
                          className="w-full h-auto"
                          playsInline
                        />
                        <div className="flex items-center justify-between px-2 py-1.5 bg-muted/20">
                          {onSetImage && (
                            <button
                              onClick={() => onSetImage(url)}
                              className="text-[10px] text-purple-400 hover:text-purple-300"
                            >
                              Use in Canvas
                            </button>
                          )}
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-muted-foreground hover:text-foreground ml-auto"
                          >
                            Open full size
                          </a>
                        </div>
                      </div>
                    ))}
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
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                            {onSetImage && (
                              <button
                                onClick={() => onSetImage(img.url)}
                                className="text-[9px] text-purple-300 hover:text-white"
                              >
                                Load to Canvas
                              </button>
                            )}
                            <a
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] text-white/80 hover:text-white ml-auto"
                            >
                              Open full size
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Edited Image */}
                {agentResponses[message.id].edited_image && (
                  <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                    <p className="text-[10px] font-medium text-purple-400 mb-2">Edited Image</p>
                    <div className="relative group rounded-lg overflow-hidden border border-border/50">
                      <img
                        src={agentResponses[message.id].edited_image!.url}
                        alt="Edited image"
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                        {onSetImage && (
                          <button
                            onClick={() => onSetImage(agentResponses[message.id].edited_image!.url)}
                            className="text-[9px] text-purple-300 hover:text-white"
                          >
                            Load to Canvas
                          </button>
                        )}
                        <a
                          href={agentResponses[message.id].edited_image!.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] text-white/80 hover:text-white ml-auto"
                        >
                          Open full size
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generation History */}
                {agentResponses[message.id].generation_history && agentResponses[message.id].generation_history!.length > 0 && (
                  <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                    <p className="text-[10px] font-medium text-purple-400 mb-2">
                      Past Generations ({agentResponses[message.id].generation_history!.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {agentResponses[message.id].generation_history!.map((gen) => (
                        <div key={gen.id} className="relative group rounded-lg overflow-hidden border border-border/50">
                          {gen.output_urls[0] && (
                            <img
                              src={gen.output_urls[0]}
                              alt={gen.prompt_text || 'Generated image'}
                              className="w-full h-24 object-cover"
                              loading="lazy"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-1">
                            {gen.prompt_text && (
                              <p className="text-[8px] text-white/70 line-clamp-2 leading-tight">{gen.prompt_text}</p>
                            )}
                            <div className="flex items-center gap-1.5">
                              {onSetImage && (
                                <button
                                  onClick={() => onSetImage(gen.output_urls[0])}
                                  className="text-[8px] text-purple-300 hover:text-white"
                                >
                                  Canvas
                                </button>
                              )}
                              <button
                                onClick={() => handleSendMessage(`Edit this image: ${gen.output_urls[0]}`, [])}
                                className="text-[8px] text-blue-300 hover:text-white"
                              >
                                Iterate
                              </button>
                            </div>
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

        {isVoiceMode && activeToolName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <span>
                {activeToolName === 'generate_creative_package' ? 'Generating creative package...' :
                 activeToolName === 'analyze_competitor_content' ? 'Analyzing competitor content...' :
                 activeToolName === 'generate_video' ? 'Queueing video render...' :
                 activeToolName === 'edit_image' ? 'Editing image...' :
                 activeToolName === 'list_generations' ? 'Loading past generations...' :
                 'Vince is working...'}
              </span>
            </div>
          </div>
        )}

        {analyzingVideoAt && (
          <div className="flex items-center gap-2 text-xs py-2">
            <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-500/30 rounded-lg px-3 py-2 w-full">
              <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-purple-200 font-medium">Analyzing video</span>
                <span className="text-muted-foreground">
                  {elapsedAnalysisSeconds < 60
                    ? `${elapsedAnalysisSeconds}s · Gemini is watching the video...`
                    : `${Math.floor(elapsedAnalysisSeconds / 60)}m ${elapsedAnalysisSeconds % 60}s · almost there...`}
                </span>
              </div>
            </div>
          </div>
        )}

        {videoRenderingAt && (
          <div className="flex items-center gap-2 text-xs py-2">
            <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-2 w-full">
              <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-purple-300 font-medium">Video rendering</span>
                <span className="text-muted-foreground">
                  {elapsedVideoSeconds < 60
                    ? `${elapsedVideoSeconds}s elapsed · appears in History when ready`
                    : `${Math.floor(elapsedVideoSeconds / 60)}m ${elapsedVideoSeconds % 60}s elapsed · appears in History when ready`}
                </span>
              </div>
              <button
                onClick={() => setVideoRenderingAt(null)}
                className="ml-auto text-muted-foreground hover:text-foreground flex-shrink-0"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'model' && !messages[messages.length - 1].content && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <div className="flex items-center gap-1.5 bg-purple-500/10 rounded-full px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>}

      {/* Quick prompts — pinned above input, hidden during voice mode or history picker */}
      {!showHistoryPicker && !showCampaignsPicker && !isVoiceMode && !isLoading && quickPrompts.length > 0 && (
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
                className="text-[11px] h-auto py-1 px-2.5 bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 hover:border-purple-400/50 rounded-full"
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
              className="h-5 text-[10px] text-purple-400/60 hover:text-purple-300 px-1.5"
              onClick={() => setPromptOffset(prev => (prev + 3) % quickPrompts.length)}
            >
              More
            </Button>
          )}
        </div>
      )}

      {/* Inline voice bar — replaces input area during voice mode, hidden when history picker open */}
      {!showHistoryPicker && !showCampaignsPicker && isVoiceMode && (
        <div className="flex-shrink-0 border-t bg-muted/40 px-3 py-2.5 space-y-2">
          {/* Live transcript — wraps up to 3 lines so Vince's response is readable */}
          {liveTranscriptText && (
            <p className={`text-xs leading-relaxed line-clamp-3 ${
              isUserSpeaking ? 'text-cyan-400 italic' : 'text-foreground/90'
            }`}>
              {liveTranscriptText}
            </p>
          )}
          {/* URL inject row — paste a video or competitor link while in voice mode */}
          <div className="flex items-center gap-1.5">
            <Link className="w-3 h-3 text-muted-foreground/50 shrink-0" />
            <input
              type="url"
              value={pendingUrl}
              onChange={e => setPendingUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && pendingUrl.trim() && liveControlRef.current) {
                  liveControlRef.current.sendText(`Here is the URL to analyze: ${pendingUrl.trim()}`);
                  setPendingUrl('');
                }
              }}
              placeholder="Paste a URL and press Enter..."
              className="flex-1 h-6 text-[11px] bg-background/50 border border-border/40 rounded px-2 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-purple-500/50"
            />
            {pendingUrl.trim() && liveControlRef.current && (
              <button
                onClick={() => {
                  liveControlRef.current!.sendText(`Here is the URL to analyze: ${pendingUrl.trim()}`);
                  setPendingUrl('');
                }}
                className="h-6 px-2 text-[10px] bg-purple-600 hover:bg-purple-500 text-white rounded shrink-0"
              >
                Send
              </button>
            )}
          </div>
          {/* Controls row */}
          <div className="flex items-center gap-3">
            <CompactAudioIndicator
              volumeRef={voiceVolumeRef}
              isModelSpeaking={isModelSpeaking}
              isUserSpeaking={isUserSpeaking}
            />
            <span className="text-[10px] text-muted-foreground flex-1">
              {!liveControlRef.current
                ? 'Connecting...'
                : activeToolName === 'analyze_competitor_content'
                ? '⏳ Analyzing competitor video...'
                : activeToolName === 'generate_creative_package'
                ? '⏳ Generating creative package...'
                : activeToolName === 'generate_video'
                ? '⏳ Rendering video (1-3 min)...'
                : activeToolName
                ? `⏳ Working...`
                : isModelSpeaking
                ? 'Vince is speaking...'
                : isUserSpeaking
                ? 'Listening...'
                : 'Waiting...'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={handleCloseVoice}
              aria-label="Switch to chat"
            >
              <X className="w-3 h-3" />
              Chat
            </Button>
          </div>
        </div>
      )}

      {/* Text input — hidden during voice mode or history picker */}
      {!showHistoryPicker && !showCampaignsPicker && !isVoiceMode && (
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
          sendButtonClassName="text-purple-400 hover:text-purple-300"
        />
      )}
    </div>
  );
}
