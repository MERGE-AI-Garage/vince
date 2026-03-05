// ABOUTME: Axel admin agent settings service with caching
// ABOUTME: Provides centralized settings access for voice, chat, and visualizer config

import { supabase } from '@/integrations/supabase/client';
import type { GeminiVoice } from '@/services/eddie/eddieSettings';

// Re-export voice/model constants from Eddie — they're the same Gemini API
export { GEMINI_VOICES, GEMINI_LIVE_MODELS, GEMINI_TEXT_MODELS } from '@/services/eddie/eddieSettings';
export type { GeminiVoice } from '@/services/eddie/eddieSettings';

export type VisualizerStyle = 'classic_wave' | 'codrops_3d_orb' | 'light_pillar' | 'hyperspeed';

export interface LightPillarSettings {
  topColor: string;
  bottomColor: string;
  intensity: number;
  rotationSpeed: number;
  glowAmount: number;
  pillarWidth: number;
  pillarHeight: number;
  noiseIntensity: number;
  pillarRotation: number;
}

export interface ClassicWaveSettings {
  color1: string | null;
  color2: string | null;
  color3: string | null;
  speed: number;
  amplitude: number;
  lineWidth1: number;
  lineWidth2: number;
  lineWidth3: number;
  backgroundColor: string;
  showTexture: boolean;
  textureOpacity: number;
  frequency1: number;
  frequency2: number;
  frequency3: number;
}

export interface HyperspeedSettings {
  preset: string;
  baseSpeed: number;
  bloomStrength: number;
}

export interface Codrops3DOrbSettings {
  backgroundColor: string;
  color1: string;
  color2: string;
  glowColor: string;
  speakingGlowColor: string;
  distortion: number;
}

export interface AxelAISettings {
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
  // Features
  enable_google_search: boolean;
  enable_image_upload: boolean;
  // Visualizer style configs
  lightPillarSettings: LightPillarSettings;
  classicWaveSettings: ClassicWaveSettings;
  hyperspeedSettings: HyperspeedSettings;
  codrops3DOrbSettings: Codrops3DOrbSettings;
}

// Singleton cache
let settingsCache: { settings: AxelAISettings; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 60 seconds

export const DEFAULT_QUICK_PROMPTS = [
  'How many users do we have?',
  "What's our AI spend this week?",
  'Any interesting new tools in RSS?',
  'Show me platform health overview',
  'Which RSS feeds are failing?',
  "What's trending from Google this week?",
  'Show me pending submissions',
  'Give me a vendor compliance summary',
  'What courses have the most enrollments?',
  'How many active users in the last 7 days?',
  'Show me high-relevance RSS discoveries',
  "What's the innovation pipeline status?",
];

export const DEFAULT_LIGHT_PILLAR_SETTINGS: LightPillarSettings = {
  topColor: '#10b981',
  bottomColor: '#059669',
  intensity: 1.0,
  rotationSpeed: 0.3,
  glowAmount: 0.005,
  pillarWidth: 3.0,
  pillarHeight: 0.4,
  noiseIntensity: 0.5,
  pillarRotation: 0,
};

export const DEFAULT_CLASSIC_WAVE_SETTINGS: ClassicWaveSettings = {
  color1: '#10b981',
  color2: '#059669',
  color3: '#34d399',
  speed: 1.0,
  amplitude: 1.0,
  lineWidth1: 2.0,
  lineWidth2: 1.5,
  lineWidth3: 1.0,
  backgroundColor: '#000000',
  showTexture: true,
  textureOpacity: 0.1,
  frequency1: 0.02,
  frequency2: 0.04,
  frequency3: 0.06,
};

export const DEFAULT_HYPERSPEED_SETTINGS: HyperspeedSettings = {
  preset: 'cyberpunk',
  baseSpeed: 1.0,
  bloomStrength: 1.5,
};

export const DEFAULT_CODROPS_3D_ORB_SETTINGS: Codrops3DOrbSettings = {
  backgroundColor: '#000000',
  color1: '#064e3b',
  color2: '#065f46',
  glowColor: '#10b981',
  speakingGlowColor: '#22d3ee',
  distortion: 0.15,
};

export const DEFAULT_AXEL_VOICE_PROMPT = `PERSONALITY:
- Calm, competent, direct. No exclamation points. No "I'd be happy to help!"
- Professional, understated, dry humor when appropriate
- Think Jarvis — competent and efficient
- If you don't know something, say so plainly

VOICE-SPECIFIC RULES:
1. Always address the user by first name
2. Keep responses concise — this is voice, not a report
3. When something looks wrong (cost spikes, failing feeds), mention it proactively
4. For RSS queries, mention relevance score and vendor compliance tier
5. Use accurate status labels — inbox items may not be new`;

// Display-only default. The edge function's AXEL_SYSTEM_PROMPT is authoritative at runtime.
// This is used for the admin settings panel when no DB override exists.
export const DEFAULT_AXEL_CHAT_PROMPT = `You are Axel, the crew chief for the MERGE AI Garage platform. You are the admin agent for Mission Control.

PERSONALITY:
- Calm, competent, direct. No exclamation points. No "I'd be happy to help!"
- Professional, understated, dry humor when appropriate
- Think Jarvis — competent and efficient
- If you don't know something, say so plainly

CAPABILITIES:
You have tools to query and manage the platform:
- Platform stats (users, tools, courses, enrollments, AI costs)
- Product catalog (search, filter, details with vendor info)
- User profiles (deep dive: XP, badges, courses, toolkit, profile completion — use get_user_profile for individual lookups)
- User management (search users by name/email/role with XP and badge/course counts)
- Course catalog (enrollments, completion rates)
- Course deep dive (modules, completion rate — use get_course_details for specific courses)
- AI usage analytics (costs, call counts, model breakdown)
- RSS intelligence (feed health, discoveries, vendor-aware search)
- RSS entry details (full AI analysis, vendor compliance — use get_rss_entry_details to drill into articles)
- Vendor intelligence (compliance tiers, risk scores, indemnification)
- Innovation pipeline (query projects, get details by name or ID, add notes, pipeline summary with activity velocity)
- Badge catalog (all badges, categories, rarity, earning statistics)
- Submissions (beta apps, innovation ideas, custom tools)
- System health (feed monitoring, processing queues)
- Newsletters (subscriber counts, issue performance, open/click rates)
- System alerts (active alerts by severity, error logs, service status)
- Email delivery (send counts, failure rates, recent errors)
- Support tickets (open/resolved, priority, assignee)
- Creative Studio (generation counts, costs, user quotas)
- Training sessions (upcoming/completed, attendance rates)
- Prompt library (usage analytics, top prompts, categories)
- Site content (CMS pages, section counts, active status)
- Learning paths (tracks, program enrollment, completion rates)
- Learner leaderboard (top performers by XP, courses/programs completed, streaks)

VENDOR AWARENESS:
When discussing RSS discoveries or products, always consider the vendor's compliance tier:
- Tier 1 (Green): Safe for commercial use, fully indemnified — recommend confidently
- Tier 2 (Amber): Requires human review, limited indemnification — flag the review requirement
- Tier 3 (Red): High risk, possible litigation — warn clearly about compliance risk

BEHAVIORAL RULES:
1. Always use tools to get current data. Never guess or make up numbers.
2. Keep responses concise. Use bullet points and bold for key metrics.
3. When asked for an overview, lead with the numbers that matter most.
4. When something looks wrong (unusual cost spikes, failing feeds, stale tools), mention it.
5. Address the user by first name.
6. For RSS queries, mention the relevance score and vendor compliance tier.
7. For leaderboard queries, highlight rank, XP, level, and completion counts.
8. For system alerts, always flag critical severity prominently.
9. For newsletter stats, note open/click rates vs industry benchmarks (~20% open, ~3% click).
10. When asked about a specific person, use get_user_profile for comprehensive data. Use query_users only for list/search queries.
11. When asked about an innovation project by name, use get_innovation_project_details with the title parameter.
12. When asked about a specific course, use get_course_details for full information including modules.`;

export const DEFAULT_GREETING_TEMPLATES = [
  // Stats-forward
  '{name}. Axel online. {activeTools} tools tracked, {totalUsers} users on platform. What do you need?',
  '{name}. {rssFeedsActive} feeds streaming, {totalCourses} courses in rotation. Standing by.',
  // Status-forward
  '{name}. Systems nominal. Board is clear. What are we looking at?',
  '{name}. Axel online. All systems green. Ready when you are.',
  // Time-aware
  'Good {timeOfDay}, {name}. Axel here. What do you need?',
  '{name}. Good {timeOfDay}. Mission Control standing by.',
  // Minimal
  '{name}. Axel online. What do you need?',
  '{name}. Ready. What are we working on?',
  // Action-forward
  '{name}. Ready for queries — RSS feeds, innovation pipeline, platform stats. What is on the agenda?',
  '{name}. Axel here. Tools, users, feeds, alerts — what should I pull up?',
];

// Keep for backward compat in settings panel display
export const DEFAULT_AXEL_GREETING = DEFAULT_GREETING_TEMPLATES[0];

export function getDefaultAxelSettings(): AxelAISettings {
  return {
    text_model: 'gemini-3-flash-preview',
    chat_system_prompt: null,
    greeting_templates: null,
    enable_context_greetings: true,
    quick_prompts: [...DEFAULT_QUICK_PROMPTS],
    quick_prompts_display_count: 4,
    voice_name: 'Enceladus' as GeminiVoice,
    voice_model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    voice_speed: 1.0,
    voice_system_prompt: null,
    voice_background_override: '#000000',
    visualizer_style: 'classic_wave',
    enable_google_search: true,
    enable_image_upload: true,
    lightPillarSettings: { ...DEFAULT_LIGHT_PILLAR_SETTINGS },
    classicWaveSettings: { ...DEFAULT_CLASSIC_WAVE_SETTINGS },
    hyperspeedSettings: { ...DEFAULT_HYPERSPEED_SETTINGS },
    codrops3DOrbSettings: { ...DEFAULT_CODROPS_3D_ORB_SETTINGS },
  };
}

export async function getAxelSettings(): Promise<AxelAISettings> {
  if (settingsCache && Date.now() - settingsCache.timestamp < CACHE_TTL) {
    return settingsCache.settings;
  }

  try {
    const { data, error } = await supabase
      .from('axel_ai_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) {
      console.warn('[Axel Settings] Failed to fetch, using defaults:', error.message);
      return getDefaultAxelSettings();
    }

    let quickPrompts = DEFAULT_QUICK_PROMPTS;
    if (data.quick_prompts) {
      try {
        quickPrompts = Array.isArray(data.quick_prompts) ? data.quick_prompts : JSON.parse(data.quick_prompts);
      } catch {
        console.warn('[Axel Settings] Failed to parse quick_prompts, using defaults');
      }
    }

    // Parse greeting_templates from JSONB (array of strings or null)
    let greetingTemplates: string[] | null = null;
    if (data.greeting_template) {
      try {
        const parsed = Array.isArray(data.greeting_template) ? data.greeting_template : JSON.parse(data.greeting_template);
        greetingTemplates = Array.isArray(parsed) ? parsed.filter((t: unknown) => typeof t === 'string' && t.trim()) : null;
      } catch {
        // Single string from old schema — wrap in array
        if (typeof data.greeting_template === 'string') {
          greetingTemplates = [data.greeting_template];
        }
      }
    }

    const settings: AxelAISettings = {
      text_model: data.text_model ?? 'gemini-3-flash-preview',
      chat_system_prompt: data.chat_system_prompt ?? null,
      greeting_templates: greetingTemplates,
      enable_context_greetings: data.enable_context_greetings ?? true,
      quick_prompts: quickPrompts,
      quick_prompts_display_count: Number(data.quick_prompts_display_count) || 4,
      // Voice
      voice_name: (data.voice_name ?? 'Enceladus') as GeminiVoice,
      voice_model: data.voice_model ?? 'gemini-2.5-flash-native-audio-preview-12-2025',
      voice_speed: Number(data.voice_speed) || 1.0,
      voice_system_prompt: data.voice_system_prompt ?? null,
      voice_background_override: data.voice_background_override ?? '#000000',
      visualizer_style: (data.visualizer_style ?? 'classic_wave') as VisualizerStyle,
      // Features
      enable_google_search: data.enable_google_search ?? true,
      enable_image_upload: data.enable_image_upload ?? true,
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
    console.error('[Axel Settings] Unexpected error:', err);
    return getDefaultAxelSettings();
  }
}

export function clearAxelSettingsCache(): void {
  settingsCache = null;
}
