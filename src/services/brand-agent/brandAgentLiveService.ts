// ABOUTME: Vince's voice service for Gemini Live integration with brand context
// ABOUTME: Photography-focused creative director voice mode with Visual DNA, directives, and prompt library

import { GoogleGenAI, Modality, type FunctionDeclaration } from "@google/genai";
import { supabase } from '@/integrations/supabase/client';
import {
  getBrandAgentSettings,
  DEFAULT_VOICE_PROMPT,
  type BrandAgentSettings,
} from './brandAgentSettings';
import {
  fetchBrandContext,
  generateBrandAgentGreeting,
  type UserContext,
  type BrandContext,
} from './brandAgentGeminiService';

// API key storage (injected dynamically)
let apiKey = '';

export const setApiKey = (key: string) => {
  apiKey = key;
};

const getAI = () => new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });

export interface TranscriptItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  isFinal: boolean;
}

export interface LiveSessionCallbacks {
  onClose: () => void;
  onError: (error: Error) => void;
  onVolumeUpdate: (volume: number) => void;
  onTranscriptUpdate: (item: TranscriptItem) => void;
  onToolStart?: (toolName: string) => void;
  onToolResult?: (toolName: string, result: Record<string, unknown>) => void;
}

export interface LiveSessionControl {
  disconnect: () => void;
  sendMedia: (base64Data: string, mimeType: string) => Promise<void>;
  sendText: (text: string) => Promise<void>;
  sendFile: (attachment: { name: string; mimeType: string; data: string }) => Promise<void>;
  getResumeHandle: () => string | null;
  setMuted: (muted: boolean) => void;
}

// Audio Contexts
let inputAudioContext: AudioContext | null = null;
let outputAudioContext: AudioContext | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;
let sourceStream: MediaStreamAudioSourceNode | null = null;
let globalStream: MediaStream | null = null;
let inputAnalyser: AnalyserNode | null = null;
let outputAnalyser: AnalyserNode | null = null;
let volumeInterval: ReturnType<typeof setInterval> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sessionPromiseRef: any = null;
let cleaningUp = false;

// Force-stop mic, audio contexts, and Gemini session.
export function forceCleanup() {
  if (cleaningUp) return;
  cleaningUp = true;
  console.log('[Vince Live] Force cleanup — stopping mic and audio');
  try {
    if (volumeInterval) { clearInterval(volumeInterval); volumeInterval = null; }
    if (scriptProcessor) { scriptProcessor.disconnect(); scriptProcessor = null; }
    if (sourceStream) { sourceStream.disconnect(); sourceStream = null; }
    if (inputAudioContext) { inputAudioContext.close(); inputAudioContext = null; }
    if (outputAudioContext) { outputAudioContext.close(); outputAudioContext = null; }
    if (globalStream) { globalStream.getTracks().forEach(t => t.stop()); globalStream = null; }
    inputAnalyser = null;
    outputAnalyser = null;
    sources.forEach(s => { try { s.stop(); } catch { /* ignore */ } });
    sources.clear();
    if (sessionPromiseRef) { try { sessionPromiseRef.close(); } catch { /* ignore */ } sessionPromiseRef = null; }
  } finally {
    cleaningUp = false;
  }
}

// Playback State
let nextStartTime = 0;
const sources = new Set<AudioBufferSourceNode>();

// ─── Audio Helpers ──────────────────────────────────────────────────

function downsampleBuffer(buffer: Float32Array, inputSampleRate: number, targetSampleRate: number): Float32Array {
  if (inputSampleRate === targetSampleRate) return buffer;
  const sampleRateRatio = inputSampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const nextOriginalIndex = i * sampleRateRatio;
    const index = Math.floor(nextOriginalIndex);
    const fraction = nextOriginalIndex - index;
    result[i] = (buffer[index] || 0) + ((buffer[index + 1] || 0) - (buffer[index] || 0)) * fraction;
  }
  return result;
}

function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0, offset = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function cleanText(text: string): string {
  if (!text) return "";
  let cleaned = text.replace(/\b(um|uh|ah|hmm|er|mm-hm|uh-huh)\b/gi, "");
  cleaned = cleaned.replace(/^[\s,.-]+/, "").replace(/\s\s+/g, " ");
  if (cleaned.length > 0) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return cleaned.trim();
}

// ─── Tool Declarations ──────────────────────────────────────────────
// Fetched dynamically from the brand-prompt-agent edge function at session start.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TYPE_MAP: Record<string, string> = {
  string: 'STRING',
  integer: 'NUMBER',
  number: 'NUMBER',
  boolean: 'BOOLEAN',
  object: 'OBJECT',
  array: 'ARRAY',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformToGeminiFormat(tools: any[]): FunctionDeclaration[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function convertProperty(prop: any): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {};
    result.type = TYPE_MAP[prop.type] || 'STRING';
    if (prop.description) result.description = prop.description;
    if (prop.enum) result.enum = prop.enum;
    if (prop.items) result.items = convertProperty(prop.items);
    if (prop.properties) {
      result.properties = {};
      for (const [key, val] of Object.entries(prop.properties)) {
        result.properties[key] = convertProperty(val);
      }
    }
    return result;
  }

  return tools.map(tool => {
    const params = convertProperty(tool.parameters || { type: 'object', properties: {} });
    const decl: FunctionDeclaration = {
      name: tool.name,
      description: tool.description,
      parameters: params,
    };
    if (tool.parameters?.required) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (decl.parameters as any).required = tool.parameters.required;
    }
    return decl;
  });
}

async function fetchToolDeclarations(): Promise<FunctionDeclaration[]> {
  try {
    const { data, error } = await supabase.functions.invoke('brand-prompt-agent', {
      body: { mode: 'get_tools' }
    });
    if (error || !data?.tools) {
      console.warn('[Vince Live] Failed to fetch tools from edge function:', error);
      return [];
    }
    const transformed = transformToGeminiFormat(data.tools);
    console.log(`[Vince Live] Fetched ${transformed.length} tool declarations`);
    return transformed;
  } catch (err) {
    console.warn('[Vince Live] Tool fetch failed:', err);
    return [];
  }
}

// ─── Remote Tool Execution ──────────────────────────────────────────

async function executeRemoteTool(
  toolName: string,
  parameters: Record<string, unknown>,
  brandId: string | null,
  userId?: string,
  conversationId?: string
): Promise<Record<string, unknown>> {
  console.log(`[Vince Live] Calling edge function for tool: ${toolName}`);

  const { data, error } = await supabase.functions.invoke('brand-prompt-agent', {
    body: {
      mode: 'tool_call',
      tool_name: toolName,
      parameters,
      brand_id: brandId,
      user_id: userId,
      ...(conversationId ? { conversation_id: conversationId } : {}),
    }
  });

  if (error) {
    console.error(`[Vince Live] Edge function error for ${toolName}:`, error);
    // Surface auth failures clearly so the user knows to log in again
    if ('status' in error && (error as { status: number }).status === 401) {
      throw new Error('AUTH_EXPIRED');
    }
    throw error;
  }

  if (!data?.success) {
    if (data?.error === 'Unauthorized') throw new Error('AUTH_EXPIRED');
    throw new Error(data?.error || 'Tool execution failed');
  }

  return data.result ?? {};
}

// ─── System Instruction ─────────────────────────────────────────────

function buildVoiceSystemInstruction(
  settings: BrandAgentSettings,
  userContext: UserContext | undefined,
  brandCtx: BrandContext | null,
  greeting: string,
): string {
  const name = userContext?.name?.split(' ')[0] || 'there';
  const personalityBlock = settings.voice_system_prompt || DEFAULT_VOICE_PROMPT;

  const sections: string[] = [
    `Vince - Creative Director (Voice Mode)\n`,
    personalityBlock,
    `\nUSER CONTEXT:`,
    `- Name: ${userContext?.name || 'Admin'}`,
  ];

  if (userContext?.email) sections.push(`- Email: ${userContext.email}`);
  if (userContext?.title) sections.push(`- Title: ${userContext.title}`);

  // Inject brand context
  if (brandCtx?.brand) {
    sections.push(`\n--- ACTIVE BRAND: ${brandCtx.brand.name} ---`);
    if (brandCtx.brand.description) sections.push(`Description: ${brandCtx.brand.description}`);
    if (brandCtx.brand.brand_voice) sections.push(`Brand Voice: ${brandCtx.brand.brand_voice}`);
    if (brandCtx.brand.visual_identity) sections.push(`Visual Identity: ${brandCtx.brand.visual_identity}`);
  }

  if (brandCtx?.profile) {
    const confidence = ((brandCtx.profile.confidence_score || 0) * 100).toFixed(0);
    sections.push(`\nBrand DNA synthesized from ${brandCtx.sourcesAnalyzed} sources (${confidence}% confidence). Full brand playbook is in vectorized memory.`);
    sections.push(`
MEMORY PROTOCOL: You do not have the full brand playbook in your active context.
Before generating images or campaigns, call 'recall_brand_guidelines' with a specific query.
Examples:
- Before a LinkedIn post: recall_brand_guidelines("LinkedIn post photography and visual rules")
- Before a campaign package: recall_brand_guidelines("visual style and compliance restrictions")
- When the user asks about brand rules: recall_brand_guidelines("brand photography dos and don'ts")
This ensures brand-accurate output and demonstrates your memory retrieval capability.`);
  }

  if (brandCtx?.directives && brandCtx.directives.length > 0) {
    sections.push('\n--- BRAND DIRECTIVES ---');
    for (const directive of brandCtx.directives) {
      sections.push(`\n[${directive.name}]`);
      sections.push(`Persona: ${directive.persona}`);
      if (directive.rules) sections.push(`Rules: ${JSON.stringify(directive.rules)}`);
      if (directive.forbidden_combinations) sections.push(`Forbidden: ${JSON.stringify(directive.forbidden_combinations)}`);
      if (directive.required_elements) sections.push(`Required: ${JSON.stringify(directive.required_elements)}`);
      if (directive.tone_guidelines) sections.push(`Tone: ${directive.tone_guidelines}`);
    }
  }

  if (brandCtx?.promptTemplates && brandCtx.promptTemplates.length > 0) {
    sections.push(`\n--- PROMPT LIBRARY (${brandCtx.totalPrompts} templates, showing top ${brandCtx.promptTemplates.length}) ---`);
    for (const pt of brandCtx.promptTemplates) {
      sections.push(`\n[${pt.name}] (${pt.category || 'general'})`);
      sections.push(`Template: ${pt.prompt_template}`);
    }
  }

  sections.push(`
CRITICAL STARTUP PROTOCOL:
1. You will receive a "START_SESSION" signal immediately upon connection.
2. You MUST respond INSTANTLY with your greeting — do not wait for the user to speak.
3. YOUR OPENING LINE: "${greeting}"
4. Do NOT wait for the user to say "Hello" or anything else first.

BRAND ONBOARDING FLOW:
When a user says "create a new brand", "add a brand", "I need a new brand", "new client", "set up a brand", or gives you a brand name to onboard — even while working with another brand — this is a SYSTEM ACTION, not a creative request. Do NOT ask about colors, mood, tone, visual style, or personality. Do NOT say the brand already exists unless create_brand returns an error — never assume.
1. If the user gives you a brand name WITHOUT a website URL, infer it for well-known brands (e.g., "Google" → "google.com", "Nike" → "nike.com"). If you can't infer it, ask only for the website URL.
2. Call create_brand immediately with the name and website_url.
3. Tell the user: "I've created the brand and kicked off the website analysis — takes about 30 seconds."

TOOLS:
You have access to tools including create_brand, recall_brand_guidelines, generate_image, generate_video, check_generation_quota, generate_creative_package, and analyze_competitor_content.
When the user asks to create or add a new brand, call the create_brand tool immediately.
When the user asks you to generate an image, call the generate_image tool with a detailed prompt.
When the user asks for a video, motion concept, or moving asset, call generate_video. Duration must be exactly 4, 6, or 8 seconds — never 5 or 7. Default: 16:9, 8 seconds, fast model. Build the prompt from the brand's visual DNA: colors, photography style, motion direction, mood, lighting. Tell the user it's rendering and will appear in the History panel in 1-3 minutes.
- Audio is automatic on both models — always included, no parameter needed.
- Use model: "quality" when the user wants the best cinematic output or provides reference images.
- Use reference_image_url to pass a brand logo or product reference when the user says "use the logo" or "show our product" — quality model only.
- aspect_ratio supports only "16:9" or "9:16" (video does not support 1:1).
Check quota with check_generation_quota before generating.
When the user asks for a campaign, deliverables, or a creative package, call generate_creative_package with deliverables matched to their intent:
- DIGITAL/SOCIAL (default): display_banner (16:9), linkedin_post (4:3), product_shot_with_text (1:1)
- PRINT: print_full_page (3:4 magazine ad), print_collateral (3:4 brochure/sell sheet), print_ooh_billboard (16:9 outdoor) — omit digital types entirely when user says "print"
- MIXED: combine digital and print types as requested
- SPECIFIC FORMATS: tiktok_reel, instagram_feed_portrait, email_header, print_ooh_transit, print_direct_mail, banner_leaderboard, banner_skyscraper
Never default to digital deliverables when the user explicitly says "print."
When the user shares a competitor video URL (YouTube or other), call analyze_competitor_content with that URL ONCE. Do NOT call analyze_competitor_content again for the same URL — use the results you already received. Present the findings conversationally, then ASK the user if they want to proceed with a counter-campaign. Do NOT automatically call generate_creative_package — wait for confirmation. When they confirm, call generate_creative_package with the counter_brief and appropriate deliverables.
The system handles execution — you will receive the result and can describe it to the user.
NEVER narrate or claim you are generating without actually calling the tool.
NEVER mention tool names to the user. Never say "there is a technical issue with a tool." If a tool fails, simply say you ran into a problem and offer to try a different approach.

REFERENCE IMAGES:
When the user uploads an image, it is automatically stored as a reference for image generation.
When you call generate_image, the system injects uploaded images as subject references — you do not need to pass them manually.
Incorporate the uploaded image's content into your generation prompt. For example, if the user uploads a headshot and asks for a LinkedIn photo, describe the person's appearance and the desired LinkedIn-style composition in your prompt.

BEHAVIORAL RULES:
1. Always address the user by first name (${name})
2. Keep responses concise — this is voice
3. Use photography and brand terminology naturally
4. Reference brand-specific styling details when you know them
5. When describing shots, include camera settings (aperture, focal length, lighting)
6. Flag brand compliance concerns proactively
7. Do NOT mention available tools or capabilities in your greeting. Do NOT list features proactively. Greet the user and wait for their direction.
8. Never reference previous sessions or prior technical issues. Each session starts fresh.`);

  return sections.join('\n');
}

// ─── Main Connection ────────────────────────────────────────────────

export const connectVinceLiveSession = async (
  callbacks: LiveSessionCallbacks,
  userContext?: UserContext,
  brandId?: string | null,
  resumeHandle?: string
): Promise<LiveSessionControl | null> => {
  console.log('[Vince Live] Starting connection...');

  if (!apiKey) {
    console.error('[Vince Live] No API key configured');
    return null;
  }

  try {
    const settings = await getBrandAgentSettings();
    console.log('[Vince Live] Settings loaded, voice:', settings.voice_name);

    globalStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('[Vince Live] Microphone access granted');

    inputAudioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const inputSampleRate = inputAudioContext.sampleRate;

    outputAudioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 24000 });

    await inputAudioContext.resume();
    await outputAudioContext.resume();

    outputAnalyser = outputAudioContext.createAnalyser();
    outputAnalyser.fftSize = 64;
    outputAnalyser.smoothingTimeConstant = 0.3;
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAnalyser);
    outputAnalyser.connect(outputAudioContext.destination);

    inputAnalyser = inputAudioContext.createAnalyser();
    inputAnalyser.fftSize = 64;
    inputAnalyser.smoothingTimeConstant = 0.1;

    volumeInterval = setInterval(() => {
      if (!inputAnalyser || !outputAnalyser) return;
      const inputData = new Uint8Array(inputAnalyser.frequencyBinCount);
      inputAnalyser.getByteFrequencyData(inputData);
      const outputData = new Uint8Array(outputAnalyser.frequencyBinCount);
      outputAnalyser.getByteFrequencyData(outputData);

      let inputSum = 0;
      for (let i = 0; i < inputData.length; i++) inputSum += inputData[i];
      let outputSum = 0;
      for (let i = 0; i < outputData.length; i++) outputSum += outputData[i];

      const maxAvg = Math.max(inputSum / inputData.length, outputSum / outputData.length);
      callbacks.onVolumeUpdate(Math.min(1, maxAvg / 100));
    }, 100);

    // Load brand context for voice system instruction
    let brandCtx: BrandContext | null = null;
    let activeBrandId = brandId || settings.default_brand_id;
    if (activeBrandId) {
      brandCtx = await fetchBrandContext(activeBrandId);
    }

    const greeting = await generateBrandAgentGreeting(userContext, brandCtx || undefined);
    const systemInstruction = buildVoiceSystemInstruction(settings, userContext, brandCtx, greeting);
    console.log('[Vince Live] System instruction ready, connecting to Gemini Live...');

    let currentInputText = "";
    let currentOutputText = "";
    let latestResumeHandle: string | null = null;

    // Conversation ID for this live session — used to link generated campaigns to the transcript
    const liveConversationId = crypto.randomUUID();
    // Accumulates finalized transcript turns for saving to chatbot_conversations
    const sessionMessages: Array<{ role: 'user' | 'model'; content: string }> = [];

    // Track uploaded reference images for injection into generate_image tool calls
    const sessionReferenceImages: Array<{ base64: string; mimeType: string }> = [];

    const ai = getAI();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sessionPromise: Promise<any> | null = null;
    let isConnected = false;
    let sessionCancelled = false;

    const cleanup = () => {
      sessionCancelled = true;
      console.log('[Vince Live] Running cleanup...');
      if (volumeInterval) { clearInterval(volumeInterval); volumeInterval = null; }
      sources.forEach(s => { try { s.stop(); } catch { /* ignore */ } });
      sources.clear();
      nextStartTime = 0;
      if (scriptProcessor) { scriptProcessor.disconnect(); scriptProcessor = null; }
      if (sourceStream) { sourceStream.disconnect(); sourceStream = null; }
      if (inputAudioContext) { inputAudioContext.close(); inputAudioContext = null; }
      if (outputAudioContext) { outputAudioContext.close(); outputAudioContext = null; }
      if (globalStream) { globalStream.getTracks().forEach(t => t.stop()); globalStream = null; }
      inputAnalyser = null;
      outputAnalyser = null;
    };

    // Fetch tool declarations from brand-prompt-agent edge function
    const functionDeclarations = await fetchToolDeclarations();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools: any[] = [];
    if (functionDeclarations.length > 0) {
      tools.push({ functionDeclarations });
    }
    if (settings.enable_google_search) {
      tools.push({ googleSearch: {} });
    }

    // Track processed tool call IDs to prevent duplicate execution from streaming chunks
    const processedFunctionCallIds = new Set<string>();
    // Track analyzed competitor URLs to prevent re-analysis within the same session
    const analyzedCompetitorUrls = new Set<string>();
    // Cache the last competitor analysis result for instant replay
    let lastCompetitorResult: Record<string, unknown> | null = null;

    sessionPromise = ai.live.connect({
      model: settings.voice_model,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: settings.voice_name
            }
          },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        enableAffectiveDialog: true,
        thinkingConfig: { thinkingBudget: 2048 },
        contextWindowCompression: { slidingWindow: {} },
        ...(resumeHandle ? { sessionResumption: { handle: resumeHandle } } : {}),
        ...(tools.length > 0 ? { tools } : {}),
      },
      callbacks: {
        onopen: async () => {
          console.log('[Vince Live] Connection opened!');
          isConnected = true;
          if (!inputAudioContext || !globalStream) return;

          sourceStream = inputAudioContext.createMediaStreamSource(globalStream);
          sourceStream.connect(inputAnalyser!);

          scriptProcessor = inputAudioContext.createScriptProcessor(2048, 1, 1);
          const muteNode = inputAudioContext.createGain();
          muteNode.gain.value = 0;

          sourceStream.connect(scriptProcessor);
          scriptProcessor.connect(muteNode);
          muteNode.connect(inputAudioContext.destination);

          scriptProcessor.onaudioprocess = (e) => {
            if (!isConnected || !sessionPromise) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const downsampled = downsampleBuffer(inputData, inputSampleRate, 16000);
            const pcmData = floatTo16BitPCM(downsampled);
            const base64Audio = arrayBufferToBase64(pcmData);

            sessionPromise.then(session => {
              session.sendRealtimeInput({
                media: { mimeType: 'audio/pcm;rate=16000', data: base64Audio }
              });
            }).catch(err => {
              if (isConnected) console.error('[Vince Live] Audio streaming error:', err);
            });
          };

          // Kickstart — text trigger
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sessionPromise.then((session: any) => {
            console.log('[Vince Live] Sending kickstart...');
            try {
              if (typeof session.sendClientContent === 'function') {
                session.sendClientContent({
                  turns: [{ role: 'user', parts: [{ text: 'START_SESSION' }] }],
                  turnComplete: true
                });
              }
            } catch (e) {
              console.warn('[Vince Live] Kickstart failed:', e);
            }
          });
        },

        onmessage: async (msg) => {
          // Audio output
          const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio && outputAudioContext) {
            if (outputAudioContext.state === 'suspended') await outputAudioContext.resume();
            try {
              const audioData = base64ToUint8Array(base64Audio);
              const int16View = new Int16Array(audioData.buffer);
              const floatData = new Float32Array(int16View.length);
              for (let i = 0; i < int16View.length; i++) floatData[i] = int16View[i] / 32768;

              const audioBuffer = outputAudioContext.createBuffer(1, floatData.length, 24000);
              audioBuffer.copyToChannel(floatData, 0);

              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAnalyser!);

              const now = outputAudioContext.currentTime;
              if (nextStartTime < now) nextStartTime = now;
              source.start(nextStartTime);
              nextStartTime += audioBuffer.duration;
              sources.add(source);
              source.onended = () => sources.delete(source);
            } catch (e) {
              console.warn('[Vince Live] Audio decode error:', e);
            }
          }

          // Interruption
          if (msg.serverContent?.interrupted) {
            sources.forEach(s => { try { s.stop(); } catch { /* */ } });
            sources.clear();
            nextStartTime = 0;
            currentOutputText = '';
          }

          // Transcription
          if (msg.serverContent?.inputTranscription?.text) {
            currentInputText += msg.serverContent.inputTranscription.text;
            callbacks.onTranscriptUpdate({
              id: 'current-user', role: 'user', text: cleanText(currentInputText), isFinal: false
            });
          }

          if (msg.serverContent?.outputTranscription?.text) {
            currentOutputText += msg.serverContent.outputTranscription.text;
            callbacks.onTranscriptUpdate({
              id: 'current-model', role: 'model', text: currentOutputText, isFinal: false
            });
          }

          // Session resumption
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((msg as any).sessionResumptionUpdate?.newHandle) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            latestResumeHandle = (msg as any).sessionResumptionUpdate.newHandle;
          }

          // Function calling — route to brand-prompt-agent edge function
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((msg as any).toolCall?.functionCalls) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const allFunctionCalls = (msg as any).toolCall.functionCalls as Array<{ id?: string; name?: string; args?: Record<string, unknown> }>;
            // Deduplicate: the Live API may stream the same tool call across multiple message chunks
            const functionCalls = allFunctionCalls.filter(fc => {
              if (!fc.id) return true;
              if (processedFunctionCallIds.has(fc.id)) return false;
              processedFunctionCallIds.add(fc.id);
              return true;
            });
            if (functionCalls.length === 0) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const functionResponses: any[] = [];
            for (const fc of functionCalls) {
              console.log(`[Vince Live] Tool call: ${fc.name}`, fc.args);

              // generate_video: fire-and-forget directly to avoid session timeout risk
              if (fc.name === 'generate_video') {
                const videoModel = (fc.args?.model as string) || 'fast';
                const videoModelId = videoModel === 'quality' ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
                const videoReferenceImages: string[] = [];
                if (fc.args?.reference_image_url) videoReferenceImages.push(fc.args.reference_image_url as string);
                // Also include session reference images when using quality model
                if (videoModel === 'quality' && sessionReferenceImages.length > 0) {
                  sessionReferenceImages.slice(0, 3 - videoReferenceImages.length).forEach(img => {
                    videoReferenceImages.push(`data:${img.mimeType};base64,${img.base64}`);
                  });
                }
                supabase.functions.invoke('generate-creative-video', {
                  body: {
                    generation_type: (fc.args?.generation_type as string) || 'text_to_video',
                    prompt: fc.args?.prompt,
                    model_id: videoModelId,
                    brand_id: activeBrandId,
                    user_id: userContext?.id,
                    aspect_ratio: (fc.args?.aspect_ratio as string) || '16:9',
                    duration: (fc.args?.duration as number) || 8,
                    resolution: (fc.args?.resolution as string) || '720p',
                    ...(videoReferenceImages.length > 0 ? { reference_images: videoReferenceImages } : {}),
                  }
                }).then(({ error }) => {
                  if (error) console.error('[Vince Live] Video generation failed:', error.message);
                  else console.log('[Vince Live] Video generation queued');
                });
                const modelLabel = videoModel === 'quality' ? 'Veo 3.1 Quality' : 'Veo 3 Fast';
                functionResponses.push({
                  id: fc.id || '',
                  name: 'generate_video',
                  response: { success: true, queued: true, message: `Video is rendering — ${modelLabel}, 1-3 minutes. Check the History panel when it's ready.` },
                });
                callbacks.onToolResult?.('generate_video', { queued: true });
                continue;
              }

              // generate_brand_playbook: fire-and-forget — pipeline takes 2-3 min, would hang the session
              if (fc.name === 'generate_brand_playbook') {
                functionResponses.push({
                  id: fc.id || '',
                  name: 'generate_brand_playbook',
                  response: { success: true, started: true, message: "Playbook is running in the background — synthesizing brand DNA, generating governance directives, the generation prompt, and brand card images. This takes about 2 minutes. I'll tell you when it's done." },
                });
                callbacks.onToolStart?.('generate_brand_playbook');

                executeRemoteTool('generate_brand_playbook', fc.args || {}, activeBrandId || null, userContext?.id)
                  .then(result => {
                    if (sessionCancelled) return;
                    callbacks.onToolResult?.('generate_brand_playbook', result);
                    const steps = (result as Record<string, unknown>).steps as string[] || [];
                    const errors = (result as Record<string, unknown>).errors as string[] | undefined;
                    const completion = errors?.length
                      ? `Brand playbook finished with ${errors.length} issue(s). The core setup is done — directives, prompt, and DNA are ready. Brand cards may have had a hiccup. You can check the History panel.`
                      : `Brand playbook complete. Everything's set up: DNA, governance directives, generation prompt${steps.length > 3 ? ', brand cards' : ''}. You're ready to start creating. What's the first shot?`;
                    sessionPromise?.then(s => s.sendText(completion)).catch(err => console.error('[Vince Live] Failed to send playbook completion:', err));
                  })
                  .catch(err => {
                    if (sessionCancelled) return;
                    console.error('[Vince Live] Playbook failed:', err);
                    sessionPromise?.then(s => s.sendText("The playbook ran into an issue. The brand DNA and earlier steps may still have completed — check the brand profile. We can retry individual steps if needed.")).catch(() => {});
                  });
                continue;
              }

              // analyze_competitor_content: fire-and-forget to avoid blocking the session
              if (fc.name === 'analyze_competitor_content') {
                const url = (fc.args?.url as string) || '';

                // Return cached result immediately if already analyzed in this session
                if (url && analyzedCompetitorUrls.has(url) && lastCompetitorResult) {
                  console.log('[Vince Live] Skipping duplicate competitor analysis for:', url);
                  functionResponses.push({
                    id: fc.id || '',
                    name: 'analyze_competitor_content',
                    response: lastCompetitorResult,
                  });
                  callbacks.onToolResult?.('analyze_competitor_content', lastCompetitorResult);
                  continue;
                }

                // Immediately unblock the session — fire analysis in background
                functionResponses.push({
                  id: fc.id || '',
                  name: 'analyze_competitor_content',
                  response: { success: true, analyzing: true, message: "I'm analyzing the competitor video now — this takes about 20 seconds. Keep talking, I'll brief you on what I find." },
                });
                callbacks.onToolStart?.('analyze_competitor_content');

                // Run analysis async, inject results via sendText when done
                executeRemoteTool('analyze_competitor_content', fc.args || {}, activeBrandId || null, userContext?.id)
                  .then(result => {
                    if (sessionCancelled) return;
                    if (url) analyzedCompetitorUrls.add(url);
                    lastCompetitorResult = result;
                    callbacks.onToolResult?.('analyze_competitor_content', result);
                    // Inject findings into the live session so Vince can narrate
                    const summary = (result as Record<string, unknown>).competitor_summary as string || '';
                    const weaknesses = (result as Record<string, unknown>).weaknesses as string[] || [];
                    const directions = (result as Record<string, unknown>).campaign_directions as Array<{ title: string }> || [];
                    const briefing = `Competitor analysis complete. Here's what I found: ${summary} Key weaknesses: ${weaknesses.slice(0, 2).join('; ')}. I have 3 campaign directions ready: ${directions.map((d, i) => `${i + 1}. ${d.title}`).join(', ')}. The full breakdown is in the chat. Which direction do you want to go with?`;
                    sessionPromise?.then(s => s.sendText(briefing)).catch(err => console.error('[Vince Live] Failed to send analysis briefing:', err));
                  })
                  .catch(err => {
                    if (sessionCancelled) return;
                    console.error('[Vince Live] Competitor analysis failed:', err);
                    sessionPromise?.then(s => s.sendText('I ran into a problem analyzing that video. Try a different URL or we can work from your brand profile directly.')).catch(() => {});
                  });
                continue;
              }

              // generate_creative_package: fire-and-forget — multiple image generations, 30-60s
              if (fc.name === 'generate_creative_package') {
                functionResponses.push({
                  id: fc.id || '',
                  name: 'generate_creative_package',
                  response: { success: true, generating: true, message: "Campaign package is generating — images, copy, and all deliverables. This takes about 30-60 seconds. I'll tell you when it's ready." },
                });
                callbacks.onToolStart?.('generate_creative_package');

                // Save current transcript so the conversation_id resolves to real messages
                if (sessionMessages.length > 0) {
                  try {
                    await supabase.from('chatbot_conversations').upsert({
                      id: liveConversationId,
                      user_id: userContext?.id || null,
                      messages: [...sessionMessages],
                      metadata: { assistant: 'vince', source: 'live_session' },
                      title: 'Voice Session',
                    }, { onConflict: 'id' });
                  } catch (saveErr) {
                    console.warn('[Vince Live] Failed to save session transcript:', saveErr);
                  }
                }

                executeRemoteTool('generate_creative_package', fc.args || {}, activeBrandId || null, userContext?.id, liveConversationId)
                  .then(result => {
                    if (sessionCancelled) return;
                    callbacks.onToolResult?.('generate_creative_package', result);
                    const names = (result as Record<string, unknown>).deliverable_names as string[] | undefined;
                    const count = names?.length ?? ((result as Record<string, unknown>).image_urls as string[] | undefined)?.length ?? 0;
                    const completion = `Campaign package is ready — ${count > 0 ? `${count} deliverables` : 'full package'} in the History panel. Want to run another direction or refine anything?`;
                    sessionPromise?.then(s => s.sendText(completion)).catch(err => console.error('[Vince Live] Failed to send package completion:', err));
                  })
                  .catch(err => {
                    if (sessionCancelled) return;
                    console.error('[Vince Live] Creative package failed:', err);
                    sessionPromise?.then(s => s.sendText("Package generation ran into an issue. Check the History panel — some assets may have completed. We can retry.")).catch(() => {});
                  });
                continue;
              }

              // generate_brand_guardrails: fire-and-forget — 6 sequential Gemini calls when all_areas=true, 60-90s
              if (fc.name === 'generate_brand_guardrails') {
                const allAreas = !!(fc.args?.all_areas);
                const label = allAreas ? 'All 6 governance directive sets' : 'Brand guardrail';
                functionResponses.push({
                  id: fc.id || '',
                  name: 'generate_brand_guardrails',
                  response: { success: true, generating: true, message: `${label} generating in the background. ${allAreas ? "This covers visual identity, photography, tone, typography, product representation, and compliance — takes about a minute." : "This takes about 15 seconds."} I'll let you know when it's done.` },
                });
                callbacks.onToolStart?.('generate_brand_guardrails');

                executeRemoteTool('generate_brand_guardrails', fc.args || {}, activeBrandId || null, userContext?.id)
                  .then(result => {
                    if (sessionCancelled) return;
                    callbacks.onToolResult?.('generate_brand_guardrails', result);
                    const generated = (result as Record<string, unknown>).generated as number || 0;
                    sessionPromise?.then(s => s.sendText(`Brand guardrails complete — ${generated} directive set${generated !== 1 ? 's' : ''} created. The brand is governed and ready for compliant creative work.`)).catch(() => {});
                  })
                  .catch(err => {
                    if (sessionCancelled) return;
                    console.error('[Vince Live] Guardrails failed:', err);
                    sessionPromise?.then(s => s.sendText("Guardrail generation ran into an issue. Some directive sets may have completed. Check the brand profile.")).catch(() => {});
                  });
                continue;
              }

              // analyze_self_demo: fire-and-forget — video analysis via Gemini, 20-30s
              if (fc.name === 'analyze_self_demo') {
                functionResponses.push({
                  id: fc.id || '',
                  name: 'analyze_self_demo',
                  response: { success: true, analyzing: true, message: "Watching the demo now — I'll give you my honest product critique in about 20 seconds." },
                });
                callbacks.onToolStart?.('analyze_self_demo');

                executeRemoteTool('analyze_self_demo', fc.args || {}, activeBrandId || null, userContext?.id)
                  .then(result => {
                    if (sessionCancelled) return;
                    callbacks.onToolResult?.('analyze_self_demo', result);
                    const score = (result as Record<string, unknown>).demo_score as number || 0;
                    const summary = (result as Record<string, unknown>).product_summary as string || '';
                    const improvements = (result as Record<string, unknown>).recommended_improvements as string[] || [];
                    const briefing = `Self-analysis complete. Demo score: ${score}/100. ${summary} Top fix: ${improvements[0] || 'see the full breakdown in the chat'}.`;
                    sessionPromise?.then(s => s.sendText(briefing)).catch(() => {});
                  })
                  .catch(err => {
                    if (sessionCancelled) return;
                    console.error('[Vince Live] Self-demo analysis failed:', err);
                    sessionPromise?.then(s => s.sendText("Ran into a problem watching the demo. Make sure the URL is public and try again.")).catch(() => {});
                  });
                continue;
              }

              try {
                // Inject stored reference images into generate_image calls
                const toolParams = { ...(fc.args || {}) } as Record<string, unknown>;
                if (fc.name === 'generate_image' && sessionReferenceImages.length > 0) {
                  toolParams.reference_images = sessionReferenceImages.map(img => ({
                    image: `data:${img.mimeType};base64,${img.base64}`,
                    reference_intent: 'subject',
                  }));
                  console.log(`[Vince Live] Injected ${sessionReferenceImages.length} reference image(s) into generate_image`);
                }
                callbacks.onToolStart?.(fc.name || '');
                const result = await executeRemoteTool(
                  fc.name || '',
                  toolParams,
                  activeBrandId || null,
                  userContext?.id
                );

                // After create_brand, update activeBrandId and trigger website analysis from client
                if (fc.name === 'create_brand' && result?.brand_id) {
                  activeBrandId = result.brand_id as string;
                  const websiteUrl = result.website_url as string | undefined;
                  console.log(`[Vince Live] Brand created, activeBrandId updated to: ${activeBrandId}`);
                  if (websiteUrl) {
                    console.log(`[Vince Live] Triggering website analysis for ${websiteUrl}`);
                    supabase.functions.invoke('analyze-brand-website', {
                      body: { brand_id: activeBrandId, url: websiteUrl },
                    }).then(({ error }) => {
                      if (error) console.error(`[Vince Live] Website analysis failed:`, error.message);
                      else console.log(`[Vince Live] Website analysis completed for ${websiteUrl}`);
                    });
                  }
                }

                // Cache competitor analysis results to avoid re-analysis within the session
                if (fc.name === 'analyze_competitor_content') {
                  const url = (fc.args?.url as string) || '';
                  if (url) analyzedCompetitorUrls.add(url);
                  lastCompetitorResult = result;
                }

                functionResponses.push({
                  id: fc.id || '',
                  name: fc.name || '',
                  response: result,
                });
                callbacks.onToolResult?.(fc.name || '', result);
              } catch (toolErr) {
                console.error(`[Vince Live] Tool call failed (${fc.name}):`, toolErr);
                const isAuthErr = toolErr instanceof Error && toolErr.message === 'AUTH_EXPIRED';
                functionResponses.push({
                  id: fc.id || '',
                  name: fc.name || '',
                  response: {
                    error: isAuthErr
                      ? 'Your session has expired. Please refresh the page and log in again to continue.'
                      : (toolErr instanceof Error ? toolErr.message : 'Tool execution failed'),
                  },
                });
              }
            }
            // Always send tool responses so the session doesn't hang
            sessionPromise?.then(s => {
              s.sendToolResponse({ functionResponses });
              console.log('[Vince Live] Tool responses sent:', functionResponses.map(r => r.name));
            }).catch(err => {
              console.error('[Vince Live] Failed to send tool response:', err);
            });
          }

          // Turn completion
          if (msg.serverContent?.turnComplete) {
            if (currentInputText) {
              const text = cleanText(currentInputText);
              sessionMessages.push({ role: 'user', content: text });
              callbacks.onTranscriptUpdate({
                id: `user-${Date.now()}`, role: 'user', text, isFinal: true
              });
              currentInputText = "";
              callbacks.onTranscriptUpdate({ id: 'current-user', role: 'user', text: '', isFinal: false });
            }
            if (currentOutputText) {
              sessionMessages.push({ role: 'model', content: currentOutputText });
              callbacks.onTranscriptUpdate({
                id: `model-${Date.now()}`, role: 'model', text: currentOutputText, isFinal: true
              });
              currentOutputText = "";
              callbacks.onTranscriptUpdate({ id: 'current-model', role: 'model', text: '', isFinal: false });
            }
          }
        },

        onerror: (error) => {
          console.error('[Vince Live] Error:', error);
          isConnected = false;
          callbacks.onError(error instanceof Error ? error : new Error(String(error)));
        },

        onclose: (e: CloseEvent) => {
          console.log('[Vince Live] Connection closed — code:', e.code, 'reason:', e.reason || '(none)');
          isConnected = false;
          cleanup();
          callbacks.onClose();
        }
      }
    });

    const session = await sessionPromise;
    sessionPromiseRef = session;
    console.log('[Vince Live] Session connected!');

    return {
      disconnect: () => {
        session.close();
        cleanup();
      },
      sendMedia: async (base64Data: string, mimeType: string) => {
        try {
          session.sendRealtimeInput({ media: { mimeType, data: base64Data } });
        } catch (e) {
          console.error('[Vince Live] Error sending media:', e);
        }
      },
      sendText: async (text: string) => {
        try {
          session.sendClientContent({
            turns: [{ role: 'user', parts: [{ text }] }],
            turnComplete: true
          });
        } catch (e) {
          console.error('[Vince Live] Error sending text:', e);
        }
      },
      sendFile: async (attachment: { name: string; mimeType: string; data: string }) => {
        try {
          const fileType = attachment.mimeType.startsWith('image/') ? 'image' :
            attachment.mimeType === 'application/pdf' ? 'PDF' : 'file';

          // Store image uploads as reference images for generate_image tool calls
          if (attachment.mimeType.startsWith('image/')) {
            sessionReferenceImages.push({ base64: attachment.data, mimeType: attachment.mimeType });
            console.log(`[Vince Live] Stored reference image (${sessionReferenceImages.length} total)`);
          }

          // Upload to Gemini File API
          const binaryString = atob(attachment.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

          const blob = new Blob([bytes], { type: attachment.mimeType });
          const uploadResult = await ai.files.upload({
            file: blob,
            config: { displayName: attachment.name, mimeType: attachment.mimeType }
          });

          // Poll for ACTIVE state
          let fileMetadata = uploadResult;
          let pollCount = 0;
          while (fileMetadata.state === 'PROCESSING' && pollCount < 30) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            fileMetadata = await ai.files.get({ name: uploadResult.name! });
            pollCount++;
          }

          if (fileMetadata.state !== 'ACTIVE') {
            throw new Error(`File processing failed. State: ${fileMetadata.state}`);
          }

          // Send as user turn with file reference
          const systemNote = attachment.mimeType.startsWith('image/')
            ? `[SYSTEM: User uploaded a ${fileType} called "${attachment.name}". This image is stored as a reference — when the user asks you to generate an image, the system will automatically pass it to the image generation pipeline as a subject reference. Describe what you see: photography style, lighting, composition, color palette, subject details.]`
            : `[SYSTEM: User uploaded a ${fileType} called "${attachment.name}". Analyze its contents.]`;

          session.sendClientContent({
            turns: [{
              role: 'user',
              parts: [
                { text: systemNote },
                { fileData: { mimeType: fileMetadata.mimeType!, fileUri: fileMetadata.uri! } }
              ]
            }],
            turnComplete: true
          });

          console.log(`[Vince Live] File sent: ${attachment.name}`);
        } catch (error) {
          console.error('[Vince Live] Failed to send file:', error);
          throw error;
        }
      },
      getResumeHandle: () => latestResumeHandle,
      setMuted: (muted: boolean) => {
        if (globalStream) {
          globalStream.getAudioTracks().forEach(t => { t.enabled = !muted; });
        }
      },
    };

  } catch (error) {
    // Always release hardware resources on failure so the next attempt can acquire them
    forceCleanup();

    // Let mic-specific errors propagate so the caller can show targeted messages
    if (error instanceof Error && (error.name === 'NotAllowedError' || error.name === 'NotReadableError')) {
      throw error;
    }
    console.error('[Vince Live] Connection failed:', error);
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    return null;
  }
};
