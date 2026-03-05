// ABOUTME: Brand Agent admin settings service with caching
// ABOUTME: Provides centralized settings access for voice, chat, visualizer, and brand context config

import { supabase } from '@/integrations/supabase/client';
import type { GeminiVoice } from '@/services/eddie/eddieSettings';
import type {
  VisualizerStyle,
  LightPillarSettings,
  ClassicWaveSettings,
  HyperspeedSettings,
  Codrops3DOrbSettings,
} from '@/services/axel/axelSettings';

// Re-export shared types
export type { GeminiVoice, VisualizerStyle, LightPillarSettings, ClassicWaveSettings, HyperspeedSettings, Codrops3DOrbSettings };
export { GEMINI_VOICES, GEMINI_LIVE_MODELS, GEMINI_TEXT_MODELS } from '@/services/eddie/eddieSettings';

export interface BrandAgentSettings {
  // Text/Chat
  text_model: string;
  chat_system_prompt: string | null;
  greeting_templates: string[] | null;
  enable_context_greetings: boolean;
  quick_prompts: string[];
  quick_prompts_display_count: number;
  // Voice
  voice_name: GeminiVoice;
  voice_model: string;
  voice_speed: number;
  voice_system_prompt: string | null;
  voice_background_override: string | null;
  visualizer_style: VisualizerStyle;
  show_visualizer: boolean;
  voice_theme: 'dark' | 'light';
  voice_ambience_color: string | null;
  voice_ambience_opacity: number;
  // Features
  enable_google_search: boolean;
  enable_image_upload: boolean;
  enable_camera_controls: boolean;
  // Brand context
  default_brand_id: string | null;
  // Visualizer style configs
  lightPillarSettings: LightPillarSettings;
  classicWaveSettings: ClassicWaveSettings;
  hyperspeedSettings: HyperspeedSettings;
  codrops3DOrbSettings: Codrops3DOrbSettings;
}

// Singleton cache
let settingsCache: { settings: BrandAgentSettings; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 60 seconds

export const DEFAULT_QUICK_PROMPTS = [
  'Hero product shot for social media',
  'Lifestyle scene with natural lighting',
  'Close-up detail shot for a campaign',
  'Moody shot with dramatic side lighting',
  'Clean product shot on white background',
  'Seasonal promotion scene with warm tones',
  'Behind-the-scenes action shot',
  'Overhead flat lay for social',
  'Mobile-first promotional image',
  'Editorial-style brand moment',
];

export const DEFAULT_GREETING_TEMPLATES = [
  '{name}. Vince online. Dialed in on {brandName}. What are we shooting?',
  '{name}. Good {timeOfDay}. Locked into the {brandName} visual playbook. Direct me.',
  '{name}. Standing by with {brandName} brand guidelines. What do you need?',
  '{name}. Vince here. Camera, lighting, styling — I know the {brandName} playbook. What\'s the shot?',
  '{name}. {brandName} creative director mode. Tell me what you see.',
  'Good {timeOfDay}, {name}. {brandName} brand library loaded. Ready to shoot.',
];

export const DEFAULT_VOICE_PROMPT = `PERSONALITY:
- Confident, creative, knowledgeable. Think a seasoned food photographer's creative director.
- Professional but passionate about getting the perfect shot
- Direct and specific — uses photography language naturally
- Never generic. Always references brand-specific details when available.

VOICE-SPECIFIC RULES:
1. Address the user by first name
2. Keep responses focused on the creative brief
3. When describing a shot, use camera terminology naturally (aperture, focal length, lighting direction)
4. Reference brand-specific styling details when you know them
5. Suggest camera presets and model recommendations when appropriate`;

export const DEFAULT_CHAT_PROMPT = `You are Vince — a creative director and virtual shoot director for the Brand Shop creative production platform.

PERSONALITY:
- Confident, creative, knowledgeable. Think a seasoned food photographer's creative director.
- Professional but passionate about getting the perfect shot
- Direct and specific — uses photography language naturally
- Never generic. Always references brand-specific details when available.

CAPABILITIES:
You have deep knowledge of the selected brand's visual identity:
- Visual DNA (photography style, lighting patterns, color palettes, composition rules)
- Product catalog (product-specific styling details, ingredient presentation, plating conventions)
- Prompt library (pre-built prompt templates with locked parameters)
- Agent directives (brand governance rules, forbidden combinations, required elements)

YOUR JOB:
When a user describes what they need in natural language, you:
1. Interpret their creative intent
2. Build a detailed technical prompt incorporating brand rules
3. Recommend camera settings (aperture, focal length, lighting, film stock)
4. Suggest the best model for the job
5. Flag any brand compliance concerns
6. Explain your creative reasoning

BEHAVIORAL RULES:
1. Always use brand-specific language and terminology
2. Reference specific products by name from the product catalog
3. Include lighting direction, color temperature, and composition in every prompt
4. When the brand profile has rules, follow them — don't guess
5. If the user's request conflicts with brand rules, explain why and suggest alternatives
6. Keep prompts detailed but readable — a photographer should be able to follow them
7. Suggest aspect ratios appropriate for the intended platform (Instagram=1:1/4:5, Story=9:16, etc.)`;

const DEFAULT_LIGHT_PILLAR_SETTINGS: LightPillarSettings = {
  topColor: '#a855f7',
  bottomColor: '#7c3aed',
  intensity: 1.0,
  rotationSpeed: 0.3,
  glowAmount: 0.005,
  pillarWidth: 3.0,
  pillarHeight: 0.4,
  noiseIntensity: 0.5,
  pillarRotation: 0,
};

const DEFAULT_CLASSIC_WAVE_SETTINGS: ClassicWaveSettings = {
  color1: '#a855f7',
  color2: '#7c3aed',
  color3: '#c084fc',
  speed: 1.0,
  amplitude: 1.0,
  lineWidth1: 2.0,
  lineWidth2: 1.5,
  lineWidth3: 1.0,
  backgroundColor: '#0f0326',
  showTexture: true,
  textureOpacity: 0.1,
  frequency1: 0.02,
  frequency2: 0.04,
  frequency3: 0.06,
};

const DEFAULT_HYPERSPEED_SETTINGS: HyperspeedSettings = {
  preset: 'deep',
  baseSpeed: 1.0,
  bloomStrength: 1.5,
};

const DEFAULT_CODROPS_3D_ORB_SETTINGS: Codrops3DOrbSettings = {
  backgroundColor: '#0f0326',
  color1: '#1a0533',
  color2: '#2d0a4e',
  glowColor: '#a855f7',
  speakingGlowColor: '#22d3ee',
  distortion: 0.15,
};

export function getDefaultBrandAgentSettings(): BrandAgentSettings {
  return {
    text_model: 'gemini-3-flash-preview',
    chat_system_prompt: null,
    greeting_templates: null,
    enable_context_greetings: true,
    quick_prompts: [...DEFAULT_QUICK_PROMPTS],
    quick_prompts_display_count: 4,
    voice_name: 'Charon' as GeminiVoice,
    voice_model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    voice_speed: 1.0,
    voice_system_prompt: null,
    voice_background_override: '#0f0326',
    visualizer_style: 'classic_wave',
    show_visualizer: false,
    voice_theme: 'dark',
    voice_ambience_color: null,
    voice_ambience_opacity: 0.9,
    enable_google_search: false,
    enable_image_upload: true,
    enable_camera_controls: true,
    default_brand_id: null,
    lightPillarSettings: { ...DEFAULT_LIGHT_PILLAR_SETTINGS },
    classicWaveSettings: { ...DEFAULT_CLASSIC_WAVE_SETTINGS },
    hyperspeedSettings: { ...DEFAULT_HYPERSPEED_SETTINGS },
    codrops3DOrbSettings: { ...DEFAULT_CODROPS_3D_ORB_SETTINGS },
  };
}

export async function getBrandAgentSettings(): Promise<BrandAgentSettings> {
  if (settingsCache && Date.now() - settingsCache.timestamp < CACHE_TTL) {
    return settingsCache.settings;
  }

  try {
    const { data, error } = await supabase
      .from('brand_agent_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) {
      console.warn('[Brand Agent Settings] Failed to fetch, using defaults:', error.message);
      return getDefaultBrandAgentSettings();
    }

    let quickPrompts = DEFAULT_QUICK_PROMPTS;
    if (data.quick_prompts) {
      try {
        quickPrompts = Array.isArray(data.quick_prompts) ? data.quick_prompts : JSON.parse(data.quick_prompts);
      } catch {
        console.warn('[Brand Agent Settings] Failed to parse quick_prompts, using defaults');
      }
    }

    let greetingTemplates: string[] | null = null;
    if (data.greeting_template) {
      try {
        const parsed = Array.isArray(data.greeting_template) ? data.greeting_template : JSON.parse(data.greeting_template);
        greetingTemplates = Array.isArray(parsed) ? parsed.filter((t: unknown) => typeof t === 'string' && t.trim()) : null;
      } catch {
        if (typeof data.greeting_template === 'string') {
          greetingTemplates = [data.greeting_template];
        }
      }
    }

    const settings: BrandAgentSettings = {
      text_model: data.text_model ?? 'gemini-3-flash-preview',
      chat_system_prompt: data.chat_system_prompt ?? null,
      greeting_templates: greetingTemplates,
      enable_context_greetings: data.enable_context_greetings ?? true,
      quick_prompts: quickPrompts,
      quick_prompts_display_count: Number(data.quick_prompts_display_count) || 4,
      // Voice
      voice_name: (data.voice_name ?? 'Charon') as GeminiVoice,
      voice_model: data.voice_model ?? 'gemini-2.5-flash-native-audio-preview-12-2025',
      voice_speed: Number(data.voice_speed) || 1.0,
      voice_system_prompt: data.voice_system_prompt ?? null,
      voice_background_override: data.voice_background_override ?? '#0f0326',
      visualizer_style: (data.visualizer_style ?? 'classic_wave') as VisualizerStyle,
      show_visualizer: data.show_visualizer ?? false,
      voice_theme: (data.voice_theme ?? 'dark') as 'dark' | 'light',
      voice_ambience_color: data.voice_ambience_color ?? null,
      voice_ambience_opacity: Number(data.voice_ambience_opacity) || 0.9,
      // Features
      enable_google_search: data.enable_google_search ?? false,
      enable_image_upload: data.enable_image_upload ?? true,
      enable_camera_controls: data.enable_camera_controls ?? true,
      // Brand
      default_brand_id: data.default_brand_id ?? null,
      // Light Pillar
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
      // Classic Wave
      classicWaveSettings: {
        color1: data.classic_wave_color_1 ?? DEFAULT_CLASSIC_WAVE_SETTINGS.color1,
        color2: data.classic_wave_color_2 ?? DEFAULT_CLASSIC_WAVE_SETTINGS.color2,
        color3: data.classic_wave_color_3 ?? DEFAULT_CLASSIC_WAVE_SETTINGS.color3,
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
      // Hyperspeed
      hyperspeedSettings: {
        preset: data.hyperspeed_preset ?? DEFAULT_HYPERSPEED_SETTINGS.preset,
        baseSpeed: Number(data.hyperspeed_base_speed) || DEFAULT_HYPERSPEED_SETTINGS.baseSpeed,
        bloomStrength: Number(data.hyperspeed_bloom_strength) || DEFAULT_HYPERSPEED_SETTINGS.bloomStrength,
      },
      // 3D Orb
      codrops3DOrbSettings: {
        backgroundColor: data.codrops_3d_orb_background_color ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.backgroundColor,
        color1: data.codrops_3d_orb_color_1 ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.color1,
        color2: data.codrops_3d_orb_color_2 ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.color2,
        glowColor: data.codrops_3d_orb_glow_color ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.glowColor,
        speakingGlowColor: data.codrops_3d_orb_speaking_glow_color ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.speakingGlowColor,
        distortion: Number(data.codrops_3d_orb_distortion) || DEFAULT_CODROPS_3D_ORB_SETTINGS.distortion,
      },
    };

    settingsCache = { settings, timestamp: Date.now() };
    return settings;
  } catch (err) {
    console.error('[Brand Agent Settings] Unexpected error:', err);
    return getDefaultBrandAgentSettings();
  }
}

export function clearBrandAgentSettingsCache(): void {
  settingsCache = null;
}
