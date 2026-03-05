// ABOUTME: Shared Scout AI settings service with caching and validation
// ABOUTME: Provides centralized settings access for both voice and chat modes

import { supabase } from '@/integrations/supabase/client';
import type { GeminiVoice } from '@/services/eddie/eddieSettings';

// Re-export voice/model constants from Eddie — they're the same Gemini API
export { GEMINI_VOICES, GEMINI_LIVE_MODELS } from '@/services/eddie/eddieSettings';
export type { GeminiVoice } from '@/services/eddie/eddieSettings';

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

export const DEFAULT_LIGHT_PILLAR_SETTINGS: LightPillarSettings = {
  topColor: '#5227FF',
  bottomColor: '#FF9FFC',
  intensity: 1.0,
  rotationSpeed: 0.3,
  glowAmount: 0.005,
  pillarWidth: 3.0,
  pillarHeight: 0.4,
  noiseIntensity: 0.5,
  pillarRotation: 0,
};

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

export const DEFAULT_CLASSIC_WAVE_SETTINGS: ClassicWaveSettings = {
  color1: null,
  color2: null,
  color3: null,
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

export interface Codrops3DOrbSettings {
  backgroundColor: string;
  color1: string;
  color2: string;
  glowColor: string;
  speakingGlowColor: string;
  distortion: number;
}

export const DEFAULT_CODROPS_3D_ORB_SETTINGS: Codrops3DOrbSettings = {
  backgroundColor: '#000000',
  color1: '#1a472a',
  color2: '#2d5a3d',
  glowColor: '#4ade80',
  speakingGlowColor: '#22d3ee',
  distortion: 0.15,
};

// Named presets match Codrops demos, numbered presets are aliases
export type HyperspeedPreset =
  | 'one' | 'two' | 'three' | 'four' | 'five' | 'six' | 'seven'
  | 'cyberpunk' | 'akira' | 'golden' | 'highway' | 'neon' | 'deep' | 'vertigo';

export interface HyperspeedSettings {
  preset: HyperspeedPreset;
  baseSpeed: number;
  bloomStrength: number;
}

export const DEFAULT_HYPERSPEED_SETTINGS: HyperspeedSettings = {
  preset: 'one',
  baseSpeed: 1.0,
  bloomStrength: 1.5,
};

export interface VrmAvatarSettings {
  filePath: string;
  mouthIntensity: number;
  lipSensitivity: number;
  attackSpeed: number;
  decaySpeed: number;
  idleIntensity: number;
  cameraDistance: number;
  backgroundColor: string;
}

export const DEFAULT_VRM_AVATAR_SETTINGS: VrmAvatarSettings = {
  filePath: 'https://eubeowzvhsbfhijkvael.supabase.co/storage/v1/object/public/ai-avatars/vrm/default-avatar.vrm',
  mouthIntensity: 1.5,
  lipSensitivity: 0.5,
  attackSpeed: 0.6,
  decaySpeed: 0.2,
  idleIntensity: 1.0,
  cameraDistance: 2.5,
  backgroundColor: '#1a1a2e',
};

export interface ScoutAISettings {
  // Voice
  voice_name: GeminiVoice;
  voice_model: string;
  // Analysis
  evidence_analysis_depth: 'basic' | 'standard' | 'deep';
  auto_followup_questions: boolean;
  max_followup_questions: number;
  auto_tag_evidence: boolean;
  show_key_observations: boolean;
  // Visualizer
  visualizer_style: 'classic_wave' | 'codrops_3d_orb' | 'siri_wave' | 'light_pillar' | 'hyperspeed';
  voice_background_override: string | null;
  lightPillarSettings: LightPillarSettings;
  classicWaveSettings: ClassicWaveSettings;
  hyperspeedSettings: HyperspeedSettings;
  codrops3DOrbSettings: Codrops3DOrbSettings;
}

export interface ScoutSettingsSnapshot extends ScoutAISettings {
  timestamp: string;
  session_mode: 'voice' | 'chat';
}

// Singleton cache
let settingsCache: { settings: ScoutAISettings; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 60 seconds

/**
 * Fetches Scout AI settings from database with 60-second cache
 */
export async function getScoutSettings(): Promise<ScoutAISettings> {
  // Return cached settings if still valid
  if (settingsCache && Date.now() - settingsCache.timestamp < CACHE_TTL) {
    return settingsCache.settings;
  }

  // Fetch from database
  const { data, error } = await supabase
    .from('scout_ai_settings')
    .select('*')
    .eq('id', 'default')
    .single();

  if (error) {
    console.error('[Scout Settings] Failed to fetch settings:', error);
    // Return sensible defaults on error
    return getDefaultSettings();
  }

  const settings: ScoutAISettings = {
    voice_name: (data.voice_name ?? 'Kore') as GeminiVoice,
    voice_model: data.voice_model ?? 'gemini-2.5-flash-native-audio-preview-12-2025',
    evidence_analysis_depth: data.evidence_analysis_depth as 'basic' | 'standard' | 'deep',
    auto_followup_questions: data.auto_followup_questions ?? true,
    max_followup_questions: data.max_followup_questions ?? 3,
    auto_tag_evidence: data.auto_tag_evidence ?? true,
    show_key_observations: data.show_key_observations ?? true,
    visualizer_style: (data.visualizer_style as 'classic_wave' | 'codrops_3d_orb' | 'siri_wave' | 'light_pillar' | 'hyperspeed') ?? 'classic_wave',
    voice_background_override: data.voice_background_override ?? '#000000',
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
  };

  // Update cache
  settingsCache = {
    settings,
    timestamp: Date.now(),
  };

  return settings;
}

/**
 * Creates a snapshot of current settings for audit trail
 */
export async function captureSettingsSnapshot(mode: 'voice' | 'chat'): Promise<ScoutSettingsSnapshot> {
  const settings = await getScoutSettings();
  return {
    ...settings,
    timestamp: new Date().toISOString(),
    session_mode: mode,
  };
}

/**
 * Returns default Scout AI settings
 */
export function getDefaultSettings(): ScoutAISettings {
  return {
    voice_name: 'Kore' as GeminiVoice,
    voice_model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    evidence_analysis_depth: 'standard',
    auto_followup_questions: true,
    max_followup_questions: 3,
    auto_tag_evidence: true,
    show_key_observations: true,
    visualizer_style: 'classic_wave',
    voice_background_override: '#000000',
    lightPillarSettings: { ...DEFAULT_LIGHT_PILLAR_SETTINGS },
    classicWaveSettings: { ...DEFAULT_CLASSIC_WAVE_SETTINGS },
    hyperspeedSettings: { ...DEFAULT_HYPERSPEED_SETTINGS },
    codrops3DOrbSettings: { ...DEFAULT_CODROPS_3D_ORB_SETTINGS },
  };
}

/**
 * Validates that Scout output matches configured settings
 */
export function validateScoutOutput(
  settings: ScoutAISettings,
  evidenceContext: any
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // If deep mode, expect deep_analysis field
  if (settings.evidence_analysis_depth === 'deep' && evidenceContext?.deep_analysis === undefined) {
    warnings.push('Deep analysis mode enabled but deep_analysis field missing from output');
  }

  // If auto-tag enabled, expect auto_tags array
  if (settings.auto_tag_evidence && !evidenceContext?.auto_tags) {
    warnings.push('Auto-tag evidence enabled but auto_tags missing from output');
  }

  // If show key observations, expect key_observations array
  if (settings.show_key_observations && !evidenceContext?.key_observations) {
    warnings.push('Show key observations enabled but key_observations missing from output');
  }

  // If auto-followup enabled, expect follow_up_qa array
  if (settings.auto_followup_questions && !evidenceContext?.follow_up_qa) {
    warnings.push('Auto follow-up questions enabled but follow_up_qa missing from output');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Clears the settings cache (useful for testing or after settings update)
 */
export function clearSettingsCache(): void {
  settingsCache = null;
}
