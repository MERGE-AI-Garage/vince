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
  userId?: string
): Promise<Record<string, unknown>> {
  console.log(`[Vince Live] Calling edge function for tool: ${toolName}`);

  try {
    const { data, error } = await supabase.functions.invoke('brand-prompt-agent', {
      body: {
        mode: 'tool_call',
        tool_name: toolName,
        parameters,
        brand_id: brandId,
        user_id: userId,
      }
    });

    if (error) {
      console.error(`[Vince Live] Edge function error for ${toolName}:`, error);
      return { error: error.message };
    }

    return data?.result ?? { error: 'No result returned' };
  } catch (err) {
    console.error(`[Vince Live] Tool execution failed (${toolName}):`, err);
    return { error: err instanceof Error ? err.message : 'Tool execution failed' };
  }
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
    if (brandCtx.profile.visual_dna) {
      sections.push(`\n--- VISUAL DNA (${brandCtx.sourcesAnalyzed} sources analyzed, confidence: ${((brandCtx.profile.confidence_score || 0) * 100).toFixed(0)}%) ---`);
      sections.push(JSON.stringify(brandCtx.profile.visual_dna, null, 1));
    }
    if (brandCtx.profile.photography_style) {
      sections.push('\n--- PHOTOGRAPHY STYLE ---');
      sections.push(JSON.stringify(brandCtx.profile.photography_style, null, 1));
    }
    if (brandCtx.profile.color_profile) {
      sections.push('\n--- COLOR PROFILE ---');
      sections.push(JSON.stringify(brandCtx.profile.color_profile, null, 1));
    }
    if (brandCtx.profile.composition_rules) {
      sections.push('\n--- COMPOSITION RULES ---');
      sections.push(JSON.stringify(brandCtx.profile.composition_rules, null, 1));
    }
    if (brandCtx.profile.product_catalog) {
      sections.push('\n--- PRODUCT CATALOG ---');
      sections.push(JSON.stringify(brandCtx.profile.product_catalog, null, 1));
    }
    if (brandCtx.profile.brand_identity) {
      sections.push('\n--- BRAND IDENTITY ---');
      sections.push(JSON.stringify(brandCtx.profile.brand_identity, null, 1));
    }
    if (brandCtx.profile.tone_of_voice) {
      sections.push('\n--- TONE OF VOICE ---');
      sections.push(JSON.stringify(brandCtx.profile.tone_of_voice, null, 1));
    }
    if (brandCtx.profile.typography) {
      sections.push('\n--- TYPOGRAPHY ---');
      sections.push(JSON.stringify(brandCtx.profile.typography, null, 1));
    }
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

TOOLS:
You have access to tools including generate_image, generate_video, check_generation_quota, generate_creative_package, and analyze_competitor_content.
When the user asks you to generate an image, call the generate_image tool with a detailed prompt.
When the user asks for a video, motion concept, or moving asset, call generate_video. Default to 16:9, 5 seconds. Build the prompt from the brand's visual DNA: colors, photography style, motion direction, mood, lighting. Video takes 1-3 minutes — tell the user it's rendering.
Check quota with check_generation_quota before generating.
When the user asks for a campaign, multiple deliverables, or a creative package, call generate_creative_package. ALWAYS specify 3 deliverables: a display_banner (16:9 hero), a linkedin_post (4:3), and a product_shot_with_text (1:1 Instagram-ready). Add more if the user requests specific formats.
When the user shares a competitor video URL (YouTube or other), call analyze_competitor_content with that URL. Present the findings conversationally, then ASK the user if they want to proceed with a counter-campaign. Do NOT automatically call generate_creative_package — wait for confirmation. When they confirm, call generate_creative_package with the counter_brief and the 3 standard deliverables.
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

    // Track uploaded reference images for injection into generate_image tool calls
    const sessionReferenceImages: Array<{ base64: string; mimeType: string }> = [];

    const ai = getAI();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sessionPromise: Promise<any> | null = null;
    let isConnected = false;

    const cleanup = () => {
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
        proactivity: { proactiveAudio: true },
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
            const functionCalls = (msg as any).toolCall.functionCalls as Array<{ id?: string; name?: string; args?: Record<string, unknown> }>;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const functionResponses: any[] = [];
            for (const fc of functionCalls) {
              console.log(`[Vince Live] Tool call: ${fc.name}`, fc.args);
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

                functionResponses.push({
                  id: fc.id || '',
                  name: fc.name || '',
                  response: result,
                });
                callbacks.onToolResult?.(fc.name || '', result);
              } catch (toolErr) {
                console.error(`[Vince Live] Tool call failed (${fc.name}):`, toolErr);
                functionResponses.push({
                  id: fc.id || '',
                  name: fc.name || '',
                  response: { error: toolErr instanceof Error ? toolErr.message : 'Tool execution failed' },
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
              callbacks.onTranscriptUpdate({
                id: `user-${Date.now()}`, role: 'user', text: cleanText(currentInputText), isFinal: true
              });
              currentInputText = "";
              callbacks.onTranscriptUpdate({ id: 'current-user', role: 'user', text: '', isFinal: false });
            }
            if (currentOutputText) {
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
    };

  } catch (error) {
    console.error('[Vince Live] Connection failed:', error);
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    return null;
  }
};
