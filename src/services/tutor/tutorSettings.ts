// ABOUTME: Tutor AI settings fetched from mitch_tutor_settings DB table with caching
// ABOUTME: Singleton row pattern with 60s TTL cache and fallback to defaults

import { supabase } from '@/integrations/supabase/client';
import {
  DEFAULT_LIGHT_PILLAR_SETTINGS,
  DEFAULT_CLASSIC_WAVE_SETTINGS,
  DEFAULT_CODROPS_3D_ORB_SETTINGS,
  DEFAULT_HYPERSPEED_SETTINGS,
  type LightPillarSettings,
  type ClassicWaveSettings,
  type Codrops3DOrbSettings,
  type HyperspeedSettings,
  type HyperspeedPreset,
} from '@/services/scout/scoutSettings';

export type VisualizerStyle = 'classic_wave' | 'codrops_3d_orb' | 'light_pillar' | 'hyperspeed';

export interface TutorQuickPrompt {
  module_type: string;
  text: string;
}

export interface TutorSettings {
  // Text/Chat
  text_model: string;
  chat_system_prompt: string | null;
  temperature: number;
  max_output_tokens: number;
  max_content_length: number;
  max_voice_content_length: number;
  // Voice
  voice_name: string;
  voice_model: string;
  voice_system_prompt: string | null;
  voice_background: string;
  voice_theme: 'dark' | 'light';
  visualizer_style: VisualizerStyle;
  // Per-visualizer settings
  lightPillarSettings: LightPillarSettings;
  classicWaveSettings: ClassicWaveSettings;
  codrops3DOrbSettings: Codrops3DOrbSettings;
  hyperspeedSettings: HyperspeedSettings;
  // Feature toggles
  enable_tools: boolean;
  enable_voice_tools: boolean;
  // Greetings & quick prompts
  greeting_templates: string[] | null;
  enable_context_greetings: boolean;
  quick_prompts: TutorQuickPrompt[] | null;
}

export const DEFAULT_GREETING_TEMPLATES = [
  "Hey {name}! I'm Mitch, your tutor for **{moduleTitle}**. What would you like to go over?",
  "Hey {name}. Ready to work through **{moduleTitle}**? Ask me anything.",
  "{name}, I'm Mitch — here to help with **{moduleTitle}**. What's on your mind?",
  "Good {timeOfDay}, {name}. Let's dig into **{moduleTitle}** — where should we start?",
  "{name}! Mitch here. You're working through **{programName}**. What can I help with?",
  "Hi {name}. I'm Mitch — your AI tutor. Ready to tackle **{moduleTitle}** together?",
];

export const DEFAULT_QUIZ_GREETING_TEMPLATES = [
  "Hey {name}! Ready for the **{moduleTitle}**? I can help you review key concepts before you start.",
  "{name}, you're about to take the **{moduleTitle}**. Want me to walk through any topics first?",
  "Good {timeOfDay}, {name}. Before you start the **{moduleTitle}**, I can help you prep. What do you want to review?",
];

export const DEFAULT_QUICK_PROMPTS: TutorQuickPrompt[] = [
  { module_type: 'quiz', text: 'Give me a quick refresher before I start' },
  { module_type: 'quiz', text: 'What are the trickiest topics on this?' },
  { module_type: 'quiz', text: 'Quiz me on a practice question' },
  { module_type: 'quiz', text: 'What should I study for this quiz?' },
  { module_type: 'quiz', text: 'Walk me through the key concepts' },
  { module_type: 'quiz', text: 'Any hints on what to focus on?' },
  { module_type: 'lesson', text: 'Explain the main concepts' },
  { module_type: 'lesson', text: 'Give me a real-world example' },
  { module_type: 'reading', text: 'Summarize the main points' },
  { module_type: 'reading', text: 'What are the key takeaways?' },
  { module_type: 'exercise', text: 'Walk me through this exercise' },
  { module_type: 'exercise', text: 'Where should I start?' },
  { module_type: '*', text: 'How does this apply to my day-to-day work?' },
  { module_type: '*', text: 'What should I remember from this module?' },
];

const DEFAULT_SETTINGS: TutorSettings = {
  text_model: 'gemini-2.5-flash',
  chat_system_prompt: null,
  temperature: 0.7,
  max_output_tokens: 2048,
  max_content_length: 12000,
  max_voice_content_length: 8000,
  voice_name: 'Charon',
  voice_model: 'gemini-2.5-flash-native-audio-preview-12-2025',
  voice_system_prompt: null,
  voice_background: '#ffffff',
  voice_theme: 'light',
  visualizer_style: 'light_pillar',
  lightPillarSettings: { ...DEFAULT_LIGHT_PILLAR_SETTINGS },
  classicWaveSettings: { ...DEFAULT_CLASSIC_WAVE_SETTINGS },
  codrops3DOrbSettings: { ...DEFAULT_CODROPS_3D_ORB_SETTINGS },
  hyperspeedSettings: { ...DEFAULT_HYPERSPEED_SETTINGS },
  enable_tools: true,
  enable_voice_tools: true,
  greeting_templates: null,
  enable_context_greetings: true,
  quick_prompts: null,
};

let cache: { settings: TutorSettings; ts: number } | null = null;
const CACHE_TTL = 60_000;

export function getDefaultTutorSettings(): TutorSettings {
  return { ...DEFAULT_SETTINGS };
}

export async function getTutorSettings(): Promise<TutorSettings> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.settings;

  try {
    const { data, error } = await supabase
      .from('mitch_tutor_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) {
      console.warn('[Tutor Settings] Failed to fetch, using defaults:', error.message);
      return getDefaultTutorSettings();
    }

    const settings: TutorSettings = {
      text_model: data.text_model ?? DEFAULT_SETTINGS.text_model,
      chat_system_prompt: data.chat_system_prompt ?? null,
      temperature: Number(data.temperature) || DEFAULT_SETTINGS.temperature,
      max_output_tokens: Number(data.max_output_tokens) || DEFAULT_SETTINGS.max_output_tokens,
      max_content_length: Number(data.max_content_length) || DEFAULT_SETTINGS.max_content_length,
      max_voice_content_length: Number(data.max_voice_content_length) || DEFAULT_SETTINGS.max_voice_content_length,
      voice_name: data.voice_name ?? DEFAULT_SETTINGS.voice_name,
      voice_model: data.voice_model ?? DEFAULT_SETTINGS.voice_model,
      voice_system_prompt: data.voice_system_prompt ?? null,
      voice_background: data.voice_background ?? DEFAULT_SETTINGS.voice_background,
      voice_theme: (data.voice_theme ?? DEFAULT_SETTINGS.voice_theme) as 'dark' | 'light',
      visualizer_style: (data.visualizer_style ?? DEFAULT_SETTINGS.visualizer_style) as VisualizerStyle,
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
      codrops3DOrbSettings: {
        backgroundColor: data.codrops_3d_orb_background_color ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.backgroundColor,
        color1: data.codrops_3d_orb_color_1 ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.color1,
        color2: data.codrops_3d_orb_color_2 ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.color2,
        glowColor: data.codrops_3d_orb_glow_color ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.glowColor,
        speakingGlowColor: data.codrops_3d_orb_speaking_glow_color ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.speakingGlowColor,
        distortion: Number(data.codrops_3d_orb_distortion) || DEFAULT_CODROPS_3D_ORB_SETTINGS.distortion,
      },
      hyperspeedSettings: {
        preset: (data.hyperspeed_preset as HyperspeedPreset) ?? DEFAULT_HYPERSPEED_SETTINGS.preset,
        baseSpeed: Number(data.hyperspeed_base_speed) || DEFAULT_HYPERSPEED_SETTINGS.baseSpeed,
        bloomStrength: Number(data.hyperspeed_bloom_strength) || DEFAULT_HYPERSPEED_SETTINGS.bloomStrength,
      },
      enable_tools: data.enable_tools ?? DEFAULT_SETTINGS.enable_tools,
      enable_voice_tools: data.enable_voice_tools ?? DEFAULT_SETTINGS.enable_voice_tools,
      greeting_templates: data.greeting_templates ?? null,
      enable_context_greetings: data.enable_context_greetings ?? DEFAULT_SETTINGS.enable_context_greetings,
      quick_prompts: data.quick_prompts ?? null,
    };

    cache = { settings, ts: Date.now() };
    return settings;
  } catch (err) {
    console.error('[Tutor Settings] Unexpected error:', err);
    return getDefaultTutorSettings();
  }
}

export function clearTutorSettingsCache(): void {
  cache = null;
}
