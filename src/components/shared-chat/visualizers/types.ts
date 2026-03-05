// ABOUTME: Type definitions for Scout visualizer components
// ABOUTME: Defines the common interface all visualizers must implement

import React from 'react';

export interface VisualizerProps {
  isActive: boolean;
  volumeRef: React.MutableRefObject<number>;
  isUserSpeaking: boolean;
  className?: string;
}

export type VisualizerStyle = 'classic_wave' | 'codrops_3d_orb' | 'siri_wave' | 'light_pillar' | 'hyperspeed' | 'vrm_avatar';

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

export interface Codrops3DOrbSettings {
  backgroundColor: string;
  color1: string;
  color2: string;
  glowColor: string;
  speakingGlowColor: string;
  distortion: number;
}

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
