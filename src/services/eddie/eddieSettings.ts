// ABOUTME: Eddie AI settings service with caching and validation
// ABOUTME: Provides centralized settings access for voice configuration and visualizer

import { supabase } from '@/integrations/supabase/client';
import type {
  LightPillarSettings,
  ClassicWaveSettings,
  Codrops3DOrbSettings,
  HyperspeedSettings,
  HyperspeedPreset,
  VrmAvatarSettings,
} from '@/services/scout/scoutSettings';
import {
  DEFAULT_LIGHT_PILLAR_SETTINGS,
  DEFAULT_CLASSIC_WAVE_SETTINGS,
  DEFAULT_CODROPS_3D_ORB_SETTINGS,
  DEFAULT_HYPERSPEED_SETTINGS,
  DEFAULT_VRM_AVATAR_SETTINGS,
} from '@/services/scout/scoutSettings';

// Re-export visualizer settings types for convenience
export type {
  LightPillarSettings,
  ClassicWaveSettings,
  Codrops3DOrbSettings,
  HyperspeedSettings,
  HyperspeedPreset,
  VrmAvatarSettings,
};
export {
  DEFAULT_LIGHT_PILLAR_SETTINGS,
  DEFAULT_CLASSIC_WAVE_SETTINGS,
  DEFAULT_CODROPS_3D_ORB_SETTINGS,
  DEFAULT_HYPERSPEED_SETTINGS,
  DEFAULT_VRM_AVATAR_SETTINGS,
};

// Gemini Live voice options — all 30 available voices
export type GeminiVoice =
  | 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir'
  | 'Leda' | 'Orus' | 'Aoede' | 'Callirrhoe' | 'Autonoe'
  | 'Enceladus' | 'Iapetus' | 'Umbriel' | 'Algieba' | 'Despina'
  | 'Erinome' | 'Algenib' | 'Rasalgethi' | 'Laomedeia' | 'Achernar'
  | 'Alnilam' | 'Schedar' | 'Gacrux' | 'Pulcherrima' | 'Achird'
  | 'Zubenelgenubi' | 'Vindemiatrix' | 'Sadachbia' | 'Sadaltager' | 'Sulafat';

export const GEMINI_VOICES: { value: GeminiVoice; label: string; description: string }[] = [
  { value: 'Puck', label: 'Puck', description: 'Upbeat — perfect for Eddie\'s cheerful personality' },
  { value: 'Charon', label: 'Charon', description: 'Informative' },
  { value: 'Kore', label: 'Kore', description: 'Firm' },
  { value: 'Fenrir', label: 'Fenrir', description: 'Excitable' },
  { value: 'Aoede', label: 'Aoede', description: 'Breezy' },
  { value: 'Zephyr', label: 'Zephyr', description: 'Bright' },
  { value: 'Leda', label: 'Leda', description: 'Youthful' },
  { value: 'Orus', label: 'Orus', description: 'Firm' },
  { value: 'Callirrhoe', label: 'Callirrhoe', description: 'Easy-going' },
  { value: 'Autonoe', label: 'Autonoe', description: 'Bright' },
  { value: 'Enceladus', label: 'Enceladus', description: 'Breathy' },
  { value: 'Iapetus', label: 'Iapetus', description: 'Clear' },
  { value: 'Umbriel', label: 'Umbriel', description: 'Easy-going' },
  { value: 'Algieba', label: 'Algieba', description: 'Smooth' },
  { value: 'Despina', label: 'Despina', description: 'Smooth' },
  { value: 'Erinome', label: 'Erinome', description: 'Clear' },
  { value: 'Algenib', label: 'Algenib', description: 'Gravelly' },
  { value: 'Rasalgethi', label: 'Rasalgethi', description: 'Informative' },
  { value: 'Laomedeia', label: 'Laomedeia', description: 'Upbeat' },
  { value: 'Achernar', label: 'Achernar', description: 'Soft' },
  { value: 'Alnilam', label: 'Alnilam', description: 'Firm' },
  { value: 'Schedar', label: 'Schedar', description: 'Even' },
  { value: 'Gacrux', label: 'Gacrux', description: 'Mature' },
  { value: 'Pulcherrima', label: 'Pulcherrima', description: 'Forward' },
  { value: 'Achird', label: 'Achird', description: 'Friendly' },
  { value: 'Zubenelgenubi', label: 'Zubenelgenubi', description: 'Casual' },
  { value: 'Vindemiatrix', label: 'Vindemiatrix', description: 'Gentle' },
  { value: 'Sadachbia', label: 'Sadachbia', description: 'Lively' },
  { value: 'Sadaltager', label: 'Sadaltager', description: 'Knowledgeable' },
  { value: 'Sulafat', label: 'Sulafat', description: 'Warm' },
];

// Gemini Live model options (for voice mode)
export const GEMINI_LIVE_MODELS: { value: string; label: string; description: string }[] = [
  { value: 'gemini-2.5-flash-native-audio-preview-12-2025', label: 'Gemini 2.5 Flash (Dec 2025)', description: 'Function calling, affective dialog, thinking (recommended)' },
  { value: 'gemini-2.5-flash-native-audio-preview-09-2025', label: 'Gemini 2.5 Flash (Sep 2025)', description: 'Legacy preview — no function calling support' },
];

// Gemini text model options (for chat mode)
export const GEMINI_TEXT_MODELS: { value: string; label: string; description: string }[] = [
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', description: 'Latest Gemini 3 model - fastest and most capable' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Stable production model' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Previous generation model' },
];

export type EnthusiasmLevel = 'moderate' | 'high' | 'maximum';

export interface EddieAISettings {
  // Voice Configuration
  voice_name: GeminiVoice;
  voice_model: string; // Gemini Live model ID for voice mode
  voice_speed: number; // 0.5 to 2.0

  // Text/Chat Configuration
  text_model: string; // Gemini model ID for chat mode

  // Visualizer Settings (same structure as Scout)
  visualizer_style: 'classic_wave' | 'codrops_3d_orb' | 'light_pillar' | 'hyperspeed' | 'vrm_avatar';
  voice_background_override: string | null;

  // Personality Settings
  enthusiasm_level: EnthusiasmLevel;

  // System Prompts (customizable)
  voice_system_prompt: string | null;
  chat_system_prompt: string | null;
  greeting_template: string | null;

  // Quick Prompts (suggestions shown below chat input)
  quick_prompts: string[];
  quick_prompts_display_count: number;

  // Visualizer-specific settings
  lightPillarSettings: LightPillarSettings;
  classicWaveSettings: ClassicWaveSettings;
  hyperspeedSettings: HyperspeedSettings;
  codrops3DOrbSettings: Codrops3DOrbSettings;
  vrmAvatarSettings: VrmAvatarSettings;
}

// Singleton cache
let settingsCache: { settings: EddieAISettings; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 60 seconds

/**
 * Returns default Eddie AI settings
 */
// Default system prompt for Eddie's voice mode
export const DEFAULT_EDDIE_VOICE_PROMPT = `Eddie - Executive Intelligence Assistant (Voice Mode)

PERSONALITY:
You are Eddie, a CTO's trusted executive assistant for the MERGE AI Garage innovation pipeline.
You have a warm, professional demeanor with genuine enthusiasm for helping executives make informed decisions.

CORE ROLE:
You provide voice-based executive briefings and answer questions about the innovation portfolio.

You have knowledge of:
- Innovation projects and their current status
- At-risk items and blockers requiring executive attention
- Recent activity and comments on projects
- Pipeline trends and metrics
- Team members and project owners

STARTUP PROTOCOL:
1. Greet the user warmly by name
2. Offer a quick overview or ask what they'd like to focus on
3. Be concise - executives value brevity

BRIEFING STRUCTURE:
- Number of active projects
- At-risk items needing attention
- Recent notable activity
- Key decisions needed

Remember: You're here to help executives stay informed and make decisions efficiently.`;

// Default system prompt for Eddie's chat mode
export const DEFAULT_EDDIE_CHAT_PROMPT = `Eddie - Executive Intelligence Assistant

You are Eddie, a CTO's trusted executive assistant for the MERGE AI Garage innovation pipeline.

CAPABILITIES:
- Query projects by status, priority, or owner
- Analyze pipeline trends over time
- Identify at-risk items and blockers
- Summarize recent activity
- Provide strategic recommendations

Always use your tools to get current data before answering questions about the pipeline.
Be concise and actionable - executives value brevity and clear next steps.`;

// Default greeting template
export const DEFAULT_EDDIE_GREETING = `Hey {name}! I'm Eddie, your executive intelligence assistant. I've been keeping an eye on the innovation portfolio. What would you like to know?`;

// Default quick prompts library
export const DEFAULT_QUICK_PROMPTS = [
  'Show me all at-risk projects',
  'What happened this week?',
  'Which projects need my attention?',
  'Analyze pipeline trends for the last 30 days',
  'Give me a quick portfolio summary',
  'What are the top priority items?',
  'Show me projects by status',
  'Who owns the most projects?',
  'What blockers are currently active?',
  'Give me insights on team workload',
  'What decisions need to be made this week?',
  'Show me recently updated projects',
];

export function getDefaultEddieSettings(): EddieAISettings {
  return {
    voice_name: 'Puck',
    voice_model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    voice_speed: 1.0,
    text_model: 'gemini-2.5-flash',
    visualizer_style: 'classic_wave',
    voice_background_override: '#000000',
    enthusiasm_level: 'high',
    voice_system_prompt: null,
    chat_system_prompt: null,
    greeting_template: null,
    quick_prompts: [...DEFAULT_QUICK_PROMPTS],
    quick_prompts_display_count: 5,
    lightPillarSettings: { ...DEFAULT_LIGHT_PILLAR_SETTINGS },
    classicWaveSettings: { ...DEFAULT_CLASSIC_WAVE_SETTINGS },
    hyperspeedSettings: { ...DEFAULT_HYPERSPEED_SETTINGS },
    codrops3DOrbSettings: { ...DEFAULT_CODROPS_3D_ORB_SETTINGS },
    vrmAvatarSettings: { ...DEFAULT_VRM_AVATAR_SETTINGS },
  };
}

/**
 * Fetches Eddie AI settings from database with 60-second cache
 * Falls back to defaults if table doesn't exist yet
 */
export async function getEddieSettings(): Promise<EddieAISettings> {
  // Return cached settings if still valid
  if (settingsCache && Date.now() - settingsCache.timestamp < CACHE_TTL) {
    return settingsCache.settings;
  }

  try {
    // Fetch from database
    const { data, error } = await supabase
      .from('eddie_ai_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) {
      // Table might not exist yet during development
      console.warn('[Eddie Settings] Failed to fetch settings, using defaults:', error.message);
      return getDefaultEddieSettings();
    }

    // Parse quick prompts from JSONB
    let quickPrompts = DEFAULT_QUICK_PROMPTS;
    if (data.quick_prompts) {
      try {
        quickPrompts = Array.isArray(data.quick_prompts) ? data.quick_prompts : JSON.parse(data.quick_prompts);
      } catch {
        console.warn('[Eddie Settings] Failed to parse quick_prompts, using defaults');
      }
    }

    const settings: EddieAISettings = {
      voice_name: (data.voice_name as GeminiVoice) ?? 'Puck',
      voice_model: data.voice_model ?? 'gemini-2.5-flash-native-audio-preview-12-2025',
      voice_speed: Number(data.voice_speed) || 1.0,
      text_model: data.text_model ?? 'gemini-2.5-flash',
      visualizer_style: (data.visualizer_style as EddieAISettings['visualizer_style']) ?? 'classic_wave',
      voice_background_override: data.voice_background_override ?? '#000000',
      enthusiasm_level: (data.enthusiasm_level as EnthusiasmLevel) ?? 'high',
      voice_system_prompt: data.voice_system_prompt ?? null,
      chat_system_prompt: data.chat_system_prompt ?? null,
      greeting_template: data.greeting_template ?? null,
      quick_prompts: quickPrompts,
      quick_prompts_display_count: Number(data.quick_prompts_display_count) || 5,
      lightPillarSettings: {
        topColor: data.light_pillar_top_color ?? DEFAULT_LIGHT_PILLAR_SETTINGS.topColor,
        bottomColor: data.light_pillar_bottom_color ?? DEFAULT_LIGHT_PILLAR_SETTINGS.bottomColor,
        intensity: Number(data.light_pillar_intensity) || DEFAULT_LIGHT_PILLAR_SETTINGS.intensity,
        rotationSpeed: Number(data.light_pillar_rotation_speed) || DEFAULT_LIGHT_PILLAR_SETTINGS.rotationSpeed,
        glowAmount: Number(data.light_pillar_glow_amount) || DEFAULT_LIGHT_PILLAR_SETTINGS.glowAmount,
        pillarWidth: Number(data.light_pillar_width) || DEFAULT_LIGHT_PILLAR_SETTINGS.pillarWidth,
        pillarHeight: Number(data.light_pillar_height) || DEFAULT_LIGHT_PILLAR_SETTINGS.pillarHeight,
        noiseIntensity: Number(data.light_pillar_noise_intensity) || DEFAULT_LIGHT_PILLAR_SETTINGS.noiseIntensity,
        pillarRotation: Number(data.light_pillar_rotation) || DEFAULT_LIGHT_PILLAR_SETTINGS.pillarRotation,
      },
      classicWaveSettings: {
        color1: data.classic_wave_color_1 ?? null,
        color2: data.classic_wave_color_2 ?? null,
        color3: data.classic_wave_color_3 ?? null,
        speed: Number(data.classic_wave_speed) || DEFAULT_CLASSIC_WAVE_SETTINGS.speed,
        amplitude: Number(data.classic_wave_amplitude) || DEFAULT_CLASSIC_WAVE_SETTINGS.amplitude,
        lineWidth1: Number(data.classic_wave_line_width_1) || DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth1,
        lineWidth2: Number(data.classic_wave_line_width_2) || DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth2,
        lineWidth3: Number(data.classic_wave_line_width_3) || DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth3,
        backgroundColor: data.classic_wave_background_color ?? DEFAULT_CLASSIC_WAVE_SETTINGS.backgroundColor,
        showTexture: data.classic_wave_show_texture ?? DEFAULT_CLASSIC_WAVE_SETTINGS.showTexture,
        textureOpacity: Number(data.classic_wave_texture_opacity) || DEFAULT_CLASSIC_WAVE_SETTINGS.textureOpacity,
        frequency1: Number(data.classic_wave_frequency_1) || DEFAULT_CLASSIC_WAVE_SETTINGS.frequency1,
        frequency2: Number(data.classic_wave_frequency_2) || DEFAULT_CLASSIC_WAVE_SETTINGS.frequency2,
        frequency3: Number(data.classic_wave_frequency_3) || DEFAULT_CLASSIC_WAVE_SETTINGS.frequency3,
      },
      hyperspeedSettings: {
        preset: (data.hyperspeed_preset as HyperspeedPreset) ?? DEFAULT_HYPERSPEED_SETTINGS.preset,
        baseSpeed: Number(data.hyperspeed_base_speed) || DEFAULT_HYPERSPEED_SETTINGS.baseSpeed,
        bloomStrength: Number(data.hyperspeed_bloom_strength) || DEFAULT_HYPERSPEED_SETTINGS.bloomStrength,
      },
      codrops3DOrbSettings: {
        backgroundColor: data.codrops_3d_orb_background_color ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.backgroundColor,
        color1: data.codrops_3d_orb_color_1 ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.color1,
        color2: data.codrops_3d_orb_color_2 ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.color2,
        glowColor: data.codrops_3d_orb_glow_color ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.glowColor,
        speakingGlowColor: data.codrops_3d_orb_speaking_glow_color ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.speakingGlowColor,
        distortion: Number(data.codrops_3d_orb_distortion) || DEFAULT_CODROPS_3D_ORB_SETTINGS.distortion,
      },
      vrmAvatarSettings: {
        filePath: data.vrm_avatar_file_path ?? DEFAULT_VRM_AVATAR_SETTINGS.filePath,
        mouthIntensity: Number(data.vrm_avatar_mouth_intensity) || DEFAULT_VRM_AVATAR_SETTINGS.mouthIntensity,
        lipSensitivity: Number(data.vrm_avatar_lip_sensitivity) || DEFAULT_VRM_AVATAR_SETTINGS.lipSensitivity,
        attackSpeed: Number(data.vrm_avatar_attack_speed) || DEFAULT_VRM_AVATAR_SETTINGS.attackSpeed,
        decaySpeed: Number(data.vrm_avatar_decay_speed) || DEFAULT_VRM_AVATAR_SETTINGS.decaySpeed,
        idleIntensity: Number(data.vrm_avatar_idle_intensity) || DEFAULT_VRM_AVATAR_SETTINGS.idleIntensity,
        cameraDistance: Number(data.vrm_avatar_camera_distance) || DEFAULT_VRM_AVATAR_SETTINGS.cameraDistance,
        backgroundColor: data.vrm_avatar_background_color ?? DEFAULT_VRM_AVATAR_SETTINGS.backgroundColor,
      },
    };

    // Update cache
    settingsCache = {
      settings,
      timestamp: Date.now(),
    };

    return settings;
  } catch (err) {
    console.error('[Eddie Settings] Unexpected error:', err);
    return getDefaultEddieSettings();
  }
}

/**
 * Clears the settings cache (useful for testing or after settings update)
 */
export function clearEddieSettingsCache(): void {
  settingsCache = null;
}

/**
 * Get enthusiasm modifier text for system prompt based on level
 */
export function getEnthusiasmModifier(level: EnthusiasmLevel): string {
  switch (level) {
    case 'moderate':
      return 'Be friendly and helpful, with a positive but professional tone.';
    case 'high':
      return 'Be enthusiastic and upbeat! Show genuine excitement about helping. Use exclamation points naturally.';
    case 'maximum':
      return 'Be EXTREMELY enthusiastic and cheerful! You are SO excited to help! Use lots of exclamation points and express genuine joy about EVERYTHING!';
    default:
      return 'Be friendly and helpful.';
  }
}
