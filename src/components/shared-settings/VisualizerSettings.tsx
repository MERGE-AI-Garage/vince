// ABOUTME: Shared visualizer configuration controls used by all AI agent admin panels
// ABOUTME: Provides full controls for Classic Wave, 3D Orb, Light Pillar, and Hyperspeed styles

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Palette, RotateCw } from 'lucide-react';
import {
  DEFAULT_LIGHT_PILLAR_SETTINGS,
  DEFAULT_CLASSIC_WAVE_SETTINGS,
  DEFAULT_HYPERSPEED_SETTINGS,
  DEFAULT_CODROPS_3D_ORB_SETTINGS,
  DEFAULT_VRM_AVATAR_SETTINGS,
  type HyperspeedPreset,
  type LightPillarSettings,
  type ClassicWaveSettings,
  type HyperspeedSettings,
  type Codrops3DOrbSettings,
} from '@/services/brand-agent/brandAgentSettings';

export interface VrmAvatarSettings {
  filePath: string; mouthIntensity: number; lipSensitivity: number;
  attackSpeed: number; decaySpeed: number; idleIntensity: number; cameraDistance: number; backgroundColor: string;
}

type VisualizerStyle = 'classic_wave' | 'codrops_3d_orb' | 'light_pillar' | 'hyperspeed' | 'vrm_avatar';

export interface VisualizerSettingsData {
  visualizer_style: VisualizerStyle;
  voice_background_override: string | null;
  lightPillarSettings: LightPillarSettings;
  classicWaveSettings: ClassicWaveSettings;
  hyperspeedSettings: HyperspeedSettings;
  codrops3DOrbSettings: Codrops3DOrbSettings;
  // Raw DB values for classic wave (needed for texture/background)
  classic_wave_background_color?: string;
  classic_wave_show_texture?: boolean;
  classic_wave_texture_opacity?: number;
  classic_wave_line_width_1?: number;
  classic_wave_line_width_2?: number;
  classic_wave_line_width_3?: number;
  classic_wave_frequency_1?: number;
  classic_wave_frequency_2?: number;
  classic_wave_frequency_3?: number;
  // Raw DB values for light pillar extras
  light_pillar_glow_amount?: number;
  light_pillar_width?: number;
  light_pillar_height?: number;
  light_pillar_noise_intensity?: number;
  light_pillar_rotation?: number;
  // Raw DB values for 3D Orb extras
  codrops_3d_orb_background_color?: string;
  codrops_3d_orb_color_1?: string;
  codrops_3d_orb_color_2?: string;
  // VRM Avatar
  vrmAvatarSettings: VrmAvatarSettings;
}

interface VisualizerSettingsProps {
  settings: VisualizerSettingsData;
  onUpdate: (updates: Record<string, unknown>) => void;
}

export const VisualizerSettings: React.FC<VisualizerSettingsProps> = ({ settings, onUpdate }) => {
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});

  // Sync slider local state from server settings
  useEffect(() => {
    setSliderValues({
      codrops_3d_orb_distortion: settings.codrops3DOrbSettings.distortion ?? DEFAULT_CODROPS_3D_ORB_SETTINGS.distortion,
      light_pillar_intensity: settings.lightPillarSettings.intensity ?? DEFAULT_LIGHT_PILLAR_SETTINGS.intensity,
      light_pillar_rotation_speed: settings.lightPillarSettings.rotationSpeed ?? DEFAULT_LIGHT_PILLAR_SETTINGS.rotationSpeed,
      light_pillar_glow_amount: settings.lightPillarSettings.glowAmount ?? DEFAULT_LIGHT_PILLAR_SETTINGS.glowAmount,
      light_pillar_width: settings.lightPillarSettings.pillarWidth ?? DEFAULT_LIGHT_PILLAR_SETTINGS.pillarWidth,
      light_pillar_height: settings.lightPillarSettings.pillarHeight ?? DEFAULT_LIGHT_PILLAR_SETTINGS.pillarHeight,
      light_pillar_noise_intensity: settings.lightPillarSettings.noiseIntensity ?? DEFAULT_LIGHT_PILLAR_SETTINGS.noiseIntensity,
      light_pillar_rotation: settings.lightPillarSettings.pillarRotation ?? DEFAULT_LIGHT_PILLAR_SETTINGS.pillarRotation,
      classic_wave_speed: settings.classicWaveSettings.speed ?? DEFAULT_CLASSIC_WAVE_SETTINGS.speed,
      classic_wave_amplitude: settings.classicWaveSettings.amplitude ?? DEFAULT_CLASSIC_WAVE_SETTINGS.amplitude,
      classic_wave_line_width_1: settings.classicWaveSettings.lineWidth1 ?? DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth1,
      classic_wave_line_width_2: settings.classicWaveSettings.lineWidth2 ?? DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth2,
      classic_wave_line_width_3: settings.classicWaveSettings.lineWidth3 ?? DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth3,
      classic_wave_texture_opacity: settings.classicWaveSettings.textureOpacity ?? DEFAULT_CLASSIC_WAVE_SETTINGS.textureOpacity,
      classic_wave_frequency_1: settings.classicWaveSettings.frequency1 ?? DEFAULT_CLASSIC_WAVE_SETTINGS.frequency1,
      classic_wave_frequency_2: settings.classicWaveSettings.frequency2 ?? DEFAULT_CLASSIC_WAVE_SETTINGS.frequency2,
      classic_wave_frequency_3: settings.classicWaveSettings.frequency3 ?? DEFAULT_CLASSIC_WAVE_SETTINGS.frequency3,
      hyperspeed_base_speed: settings.hyperspeedSettings.baseSpeed ?? DEFAULT_HYPERSPEED_SETTINGS.baseSpeed,
      hyperspeed_bloom_strength: settings.hyperspeedSettings.bloomStrength ?? DEFAULT_HYPERSPEED_SETTINGS.bloomStrength,
      vrm_avatar_mouth_intensity: settings.vrmAvatarSettings?.mouthIntensity ?? DEFAULT_VRM_AVATAR_SETTINGS.mouthIntensity,
      vrm_avatar_lip_sensitivity: settings.vrmAvatarSettings?.lipSensitivity ?? DEFAULT_VRM_AVATAR_SETTINGS.lipSensitivity,
      vrm_avatar_attack_speed: settings.vrmAvatarSettings?.attackSpeed ?? DEFAULT_VRM_AVATAR_SETTINGS.attackSpeed,
      vrm_avatar_decay_speed: settings.vrmAvatarSettings?.decaySpeed ?? DEFAULT_VRM_AVATAR_SETTINGS.decaySpeed,
      vrm_avatar_idle_intensity: settings.vrmAvatarSettings?.idleIntensity ?? DEFAULT_VRM_AVATAR_SETTINGS.idleIntensity,
      vrm_avatar_camera_distance: settings.vrmAvatarSettings?.cameraDistance ?? DEFAULT_VRM_AVATAR_SETTINGS.cameraDistance,
    });
  }, [settings]);

  const getSliderValue = (key: string, defaultValue: number): number => {
    return sliderValues[key] ?? defaultValue;
  };

  const updateSliderValue = (key: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Style & Background */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Visualizer Style</Label>
          <Select
            value={settings.visualizer_style}
            onValueChange={(value: VisualizerStyle) => onUpdate({ visualizer_style: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classic_wave">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Classic Wave</span>
                  <span className="text-xs text-muted-foreground">Three-wave sine animation in circular orb</span>
                </div>
              </SelectItem>
              <SelectItem value="codrops_3d_orb">
                <div className="flex flex-col items-start">
                  <span className="font-medium">3D Orb</span>
                  <span className="text-xs text-muted-foreground">Shader-based reactive sphere</span>
                </div>
              </SelectItem>
              <SelectItem value="light_pillar">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Light Pillar</span>
                  <span className="text-xs text-muted-foreground">Ray-marched holographic beam effect</span>
                </div>
              </SelectItem>
              <SelectItem value="hyperspeed">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Hyperspeed</span>
                  <span className="text-xs text-muted-foreground">3D highway light trails</span>
                </div>
              </SelectItem>
              <SelectItem value="vrm_avatar">
                <div className="flex flex-col items-start">
                  <span className="font-medium">3D Avatar (VRM)</span>
                  <span className="text-xs text-muted-foreground">Animated 3D character with lip sync</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Voice Mode Background</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={settings.voice_background_override || '#000000'}
              onChange={(e) => onUpdate({ voice_background_override: e.target.value })}
              className="w-12 h-9 p-0 border-0"
            />
            <Input
              type="text"
              value={settings.voice_background_override || '#000000'}
              onChange={(e) => onUpdate({ voice_background_override: e.target.value })}
              className="flex-1 font-mono text-sm"
              placeholder="#000000"
            />
            <Button variant="outline" size="sm" onClick={() => onUpdate({ voice_background_override: '#000000' })}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* 3D Orb Settings */}
      {settings.visualizer_style === 'codrops_3d_orb' && (
        <div className="space-y-4 p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium">3D Orb Settings</h5>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate({
                codrops_3d_orb_background_color: DEFAULT_CODROPS_3D_ORB_SETTINGS.backgroundColor,
                codrops_3d_orb_color_1: DEFAULT_CODROPS_3D_ORB_SETTINGS.color1,
                codrops_3d_orb_color_2: DEFAULT_CODROPS_3D_ORB_SETTINGS.color2,
                codrops_3d_orb_glow_color: DEFAULT_CODROPS_3D_ORB_SETTINGS.glowColor,
                codrops_3d_orb_speaking_glow_color: DEFAULT_CODROPS_3D_ORB_SETTINGS.speakingGlowColor,
                codrops_3d_orb_distortion: DEFAULT_CODROPS_3D_ORB_SETTINGS.distortion,
              })}
              className="gap-1"
            >
              <RotateCw className="w-3 h-3" />
              Reset All
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Background Color</Label>
              <div className="flex gap-2">
                <Input type="color" value={settings.codrops3DOrbSettings.backgroundColor} onChange={(e) => onUpdate({ codrops_3d_orb_background_color: e.target.value })} className="w-12 h-8 p-0 border-0" />
                <Input type="text" value={settings.codrops3DOrbSettings.backgroundColor} onChange={(e) => onUpdate({ codrops_3d_orb_background_color: e.target.value })} className="flex-1 font-mono text-xs" placeholder="#000000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Glow Color (AI)</Label>
              <div className="flex gap-2">
                <Input type="color" value={settings.codrops3DOrbSettings.glowColor} onChange={(e) => onUpdate({ codrops_3d_orb_glow_color: e.target.value })} className="w-12 h-8 p-0 border-0" />
                <Input type="text" value={settings.codrops3DOrbSettings.glowColor} onChange={(e) => onUpdate({ codrops_3d_orb_glow_color: e.target.value })} className="flex-1 font-mono text-xs" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Glow Color (User Speaking)</Label>
              <div className="flex gap-2">
                <Input type="color" value={settings.codrops3DOrbSettings.speakingGlowColor} onChange={(e) => onUpdate({ codrops_3d_orb_speaking_glow_color: e.target.value })} className="w-12 h-8 p-0 border-0" />
                <Input type="text" value={settings.codrops3DOrbSettings.speakingGlowColor} onChange={(e) => onUpdate({ codrops_3d_orb_speaking_glow_color: e.target.value })} className="flex-1 font-mono text-xs" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Base Color 1 (Bottom)</Label>
              <div className="flex gap-2">
                <Input type="color" value={settings.codrops3DOrbSettings.color1} onChange={(e) => onUpdate({ codrops_3d_orb_color_1: e.target.value })} className="w-12 h-8 p-0 border-0" />
                <Input type="text" value={settings.codrops3DOrbSettings.color1} onChange={(e) => onUpdate({ codrops_3d_orb_color_1: e.target.value })} className="flex-1 font-mono text-xs" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Base Color 2 (Top)</Label>
              <div className="flex gap-2">
                <Input type="color" value={settings.codrops3DOrbSettings.color2} onChange={(e) => onUpdate({ codrops_3d_orb_color_2: e.target.value })} className="w-12 h-8 p-0 border-0" />
                <Input type="text" value={settings.codrops3DOrbSettings.color2} onChange={(e) => onUpdate({ codrops_3d_orb_color_2: e.target.value })} className="flex-1 font-mono text-xs" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Distortion Amount</Label>
              <span className="text-xs text-muted-foreground font-mono">{getSliderValue('codrops_3d_orb_distortion', DEFAULT_CODROPS_3D_ORB_SETTINGS.distortion).toFixed(2)}</span>
            </div>
            <Slider
              value={[getSliderValue('codrops_3d_orb_distortion', DEFAULT_CODROPS_3D_ORB_SETTINGS.distortion)]}
              onValueChange={([v]) => updateSliderValue('codrops_3d_orb_distortion', v)}
              onValueCommit={([value]) => onUpdate({ codrops_3d_orb_distortion: value })}
              min={0.0} max={0.5} step={0.01}
            />
          </div>
        </div>
      )}

      {/* Light Pillar Settings */}
      {settings.visualizer_style === 'light_pillar' && (
        <div className="space-y-4 p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium">Light Pillar Settings</h5>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate({
                light_pillar_top_color: DEFAULT_LIGHT_PILLAR_SETTINGS.topColor,
                light_pillar_bottom_color: DEFAULT_LIGHT_PILLAR_SETTINGS.bottomColor,
                light_pillar_intensity: DEFAULT_LIGHT_PILLAR_SETTINGS.intensity,
                light_pillar_rotation_speed: DEFAULT_LIGHT_PILLAR_SETTINGS.rotationSpeed,
                light_pillar_glow_amount: DEFAULT_LIGHT_PILLAR_SETTINGS.glowAmount,
                light_pillar_width: DEFAULT_LIGHT_PILLAR_SETTINGS.pillarWidth,
                light_pillar_height: DEFAULT_LIGHT_PILLAR_SETTINGS.pillarHeight,
                light_pillar_noise_intensity: DEFAULT_LIGHT_PILLAR_SETTINGS.noiseIntensity,
                light_pillar_rotation: DEFAULT_LIGHT_PILLAR_SETTINGS.pillarRotation,
              })}
              className="gap-1"
            >
              <RotateCw className="w-3 h-3" />
              Reset All
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Top Color</Label>
              <div className="flex items-center gap-2">
                <Input type="color" value={settings.lightPillarSettings.topColor} onChange={(e) => onUpdate({ light_pillar_top_color: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" />
                <Input type="text" value={settings.lightPillarSettings.topColor} onChange={(e) => onUpdate({ light_pillar_top_color: e.target.value })} className="flex-1 font-mono text-xs h-8" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Bottom Color</Label>
              <div className="flex items-center gap-2">
                <Input type="color" value={settings.lightPillarSettings.bottomColor} onChange={(e) => onUpdate({ light_pillar_bottom_color: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" />
                <Input type="text" value={settings.lightPillarSettings.bottomColor} onChange={(e) => onUpdate({ light_pillar_bottom_color: e.target.value })} className="flex-1 font-mono text-xs h-8" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Intensity</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('light_pillar_intensity', DEFAULT_LIGHT_PILLAR_SETTINGS.intensity).toFixed(2)}</span>
              </div>
              <Slider value={[getSliderValue('light_pillar_intensity', DEFAULT_LIGHT_PILLAR_SETTINGS.intensity)]} onValueChange={([v]) => updateSliderValue('light_pillar_intensity', v)} onValueCommit={([value]) => onUpdate({ light_pillar_intensity: value })} min={0.1} max={3.0} step={0.1} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Rotation Speed</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('light_pillar_rotation_speed', DEFAULT_LIGHT_PILLAR_SETTINGS.rotationSpeed).toFixed(2)}</span>
              </div>
              <Slider value={[getSliderValue('light_pillar_rotation_speed', DEFAULT_LIGHT_PILLAR_SETTINGS.rotationSpeed)]} onValueChange={([v]) => updateSliderValue('light_pillar_rotation_speed', v)} onValueCommit={([value]) => onUpdate({ light_pillar_rotation_speed: value })} min={0.0} max={2.0} step={0.05} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Glow Amount</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('light_pillar_glow_amount', DEFAULT_LIGHT_PILLAR_SETTINGS.glowAmount).toFixed(3)}</span>
              </div>
              <Slider value={[getSliderValue('light_pillar_glow_amount', DEFAULT_LIGHT_PILLAR_SETTINGS.glowAmount)]} onValueChange={([v]) => updateSliderValue('light_pillar_glow_amount', v)} onValueCommit={([value]) => onUpdate({ light_pillar_glow_amount: value })} min={0.001} max={0.1} step={0.001} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Pillar Width</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('light_pillar_width', DEFAULT_LIGHT_PILLAR_SETTINGS.pillarWidth).toFixed(1)}</span>
              </div>
              <Slider value={[getSliderValue('light_pillar_width', DEFAULT_LIGHT_PILLAR_SETTINGS.pillarWidth)]} onValueChange={([v]) => updateSliderValue('light_pillar_width', v)} onValueCommit={([value]) => onUpdate({ light_pillar_width: value })} min={0.5} max={10.0} step={0.5} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Pillar Height</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('light_pillar_height', DEFAULT_LIGHT_PILLAR_SETTINGS.pillarHeight).toFixed(2)}</span>
              </div>
              <Slider value={[getSliderValue('light_pillar_height', DEFAULT_LIGHT_PILLAR_SETTINGS.pillarHeight)]} onValueChange={([v]) => updateSliderValue('light_pillar_height', v)} onValueCommit={([value]) => onUpdate({ light_pillar_height: value })} min={0.1} max={2.0} step={0.1} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Noise Intensity</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('light_pillar_noise_intensity', DEFAULT_LIGHT_PILLAR_SETTINGS.noiseIntensity).toFixed(2)}</span>
              </div>
              <Slider value={[getSliderValue('light_pillar_noise_intensity', DEFAULT_LIGHT_PILLAR_SETTINGS.noiseIntensity)]} onValueChange={([v]) => updateSliderValue('light_pillar_noise_intensity', v)} onValueCommit={([value]) => onUpdate({ light_pillar_noise_intensity: value })} min={0.0} max={2.0} step={0.1} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Pillar Rotation</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('light_pillar_rotation', DEFAULT_LIGHT_PILLAR_SETTINGS.pillarRotation).toFixed(0)}&deg;</span>
              </div>
              <Slider value={[getSliderValue('light_pillar_rotation', DEFAULT_LIGHT_PILLAR_SETTINGS.pillarRotation)]} onValueChange={([v]) => updateSliderValue('light_pillar_rotation', v)} onValueCommit={([value]) => onUpdate({ light_pillar_rotation: value })} min={0} max={360} step={5} />
            </div>
          </div>
        </div>
      )}

      {/* Classic Wave Settings */}
      {settings.visualizer_style === 'classic_wave' && (
        <div className="space-y-4 p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium">Classic Wave Settings</h5>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate({
                classic_wave_color_1: null,
                classic_wave_color_2: null,
                classic_wave_color_3: null,
                classic_wave_speed: DEFAULT_CLASSIC_WAVE_SETTINGS.speed,
                classic_wave_amplitude: DEFAULT_CLASSIC_WAVE_SETTINGS.amplitude,
                classic_wave_line_width_1: DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth1,
                classic_wave_line_width_2: DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth2,
                classic_wave_line_width_3: DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth3,
                classic_wave_background_color: DEFAULT_CLASSIC_WAVE_SETTINGS.backgroundColor,
                classic_wave_show_texture: DEFAULT_CLASSIC_WAVE_SETTINGS.showTexture,
                classic_wave_texture_opacity: DEFAULT_CLASSIC_WAVE_SETTINGS.textureOpacity,
                classic_wave_frequency_1: DEFAULT_CLASSIC_WAVE_SETTINGS.frequency1,
                classic_wave_frequency_2: DEFAULT_CLASSIC_WAVE_SETTINGS.frequency2,
                classic_wave_frequency_3: DEFAULT_CLASSIC_WAVE_SETTINGS.frequency3,
              })}
              className="gap-1"
            >
              <RotateCw className="w-3 h-3" />
              Reset All
            </Button>
          </div>

          {/* Wave Colors */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Wave Colors</Label>
            <p className="text-xs text-muted-foreground">Leave empty to use theme colors</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Wave 1 (Bass)</Label>
                <div className="flex items-center gap-2">
                  <Input type="color" value={settings.classicWaveSettings.color1 || '#22c55e'} onChange={(e) => onUpdate({ classic_wave_color_1: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" />
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onUpdate({ classic_wave_color_1: null })}>Theme</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Wave 2 (Mids)</Label>
                <div className="flex items-center gap-2">
                  <Input type="color" value={settings.classicWaveSettings.color2 || '#8b5cf6'} onChange={(e) => onUpdate({ classic_wave_color_2: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" />
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onUpdate({ classic_wave_color_2: null })}>Theme</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Wave 3 (Treble)</Label>
                <div className="flex items-center gap-2">
                  <Input type="color" value={settings.classicWaveSettings.color3 || '#ffffff'} onChange={(e) => onUpdate({ classic_wave_color_3: e.target.value })} className="w-10 h-8 p-0.5 cursor-pointer" />
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onUpdate({ classic_wave_color_3: null })}>Theme</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Speed & Amplitude */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Animation Speed</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('classic_wave_speed', DEFAULT_CLASSIC_WAVE_SETTINGS.speed).toFixed(2)}x</span>
              </div>
              <Slider value={[getSliderValue('classic_wave_speed', DEFAULT_CLASSIC_WAVE_SETTINGS.speed)]} onValueChange={([v]) => updateSliderValue('classic_wave_speed', v)} onValueCommit={([value]) => onUpdate({ classic_wave_speed: value })} min={0.1} max={3.0} step={0.1} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Wave Amplitude</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('classic_wave_amplitude', DEFAULT_CLASSIC_WAVE_SETTINGS.amplitude).toFixed(2)}x</span>
              </div>
              <Slider value={[getSliderValue('classic_wave_amplitude', DEFAULT_CLASSIC_WAVE_SETTINGS.amplitude)]} onValueChange={([v]) => updateSliderValue('classic_wave_amplitude', v)} onValueCommit={([value]) => onUpdate({ classic_wave_amplitude: value })} min={0.1} max={3.0} step={0.1} />
            </div>
          </div>

          {/* Line Widths */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Line Widths</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Wave 1</Label>
                  <span className="text-xs text-muted-foreground font-mono">{getSliderValue('classic_wave_line_width_1', DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth1).toFixed(1)}</span>
                </div>
                <Slider value={[getSliderValue('classic_wave_line_width_1', DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth1)]} onValueChange={([v]) => updateSliderValue('classic_wave_line_width_1', v)} onValueCommit={([value]) => onUpdate({ classic_wave_line_width_1: value })} min={0.5} max={5.0} step={0.5} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Wave 2</Label>
                  <span className="text-xs text-muted-foreground font-mono">{getSliderValue('classic_wave_line_width_2', DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth2).toFixed(1)}</span>
                </div>
                <Slider value={[getSliderValue('classic_wave_line_width_2', DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth2)]} onValueChange={([v]) => updateSliderValue('classic_wave_line_width_2', v)} onValueCommit={([value]) => onUpdate({ classic_wave_line_width_2: value })} min={0.5} max={5.0} step={0.5} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Wave 3</Label>
                  <span className="text-xs text-muted-foreground font-mono">{getSliderValue('classic_wave_line_width_3', DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth3).toFixed(1)}</span>
                </div>
                <Slider value={[getSliderValue('classic_wave_line_width_3', DEFAULT_CLASSIC_WAVE_SETTINGS.lineWidth3)]} onValueChange={([v]) => updateSliderValue('classic_wave_line_width_3', v)} onValueCommit={([value]) => onUpdate({ classic_wave_line_width_3: value })} min={0.5} max={5.0} step={0.5} />
              </div>
            </div>
          </div>

          {/* Background & Texture */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Background & Texture</Label>
            <div className="flex items-center gap-3">
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Background Color</Label>
                <div className="flex items-center gap-2">
                  <Input type="color" value={settings.classicWaveSettings.backgroundColor || DEFAULT_CLASSIC_WAVE_SETTINGS.backgroundColor} onChange={(e) => onUpdate({ classic_wave_background_color: e.target.value })} className="w-10 h-8 p-1 cursor-pointer" />
                  <Input type="text" value={settings.classicWaveSettings.backgroundColor || DEFAULT_CLASSIC_WAVE_SETTINGS.backgroundColor} onChange={(e) => onUpdate({ classic_wave_background_color: e.target.value })} className="w-24 font-mono text-xs" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-xs">Show Texture Overlay</Label>
                <p className="text-xs text-muted-foreground">Cube pattern overlay</p>
              </div>
              <Switch checked={settings.classicWaveSettings.showTexture ?? DEFAULT_CLASSIC_WAVE_SETTINGS.showTexture} onCheckedChange={(checked) => onUpdate({ classic_wave_show_texture: checked })} />
            </div>
            {(settings.classicWaveSettings.showTexture ?? DEFAULT_CLASSIC_WAVE_SETTINGS.showTexture) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Texture Opacity</Label>
                  <span className="text-xs text-muted-foreground font-mono">{getSliderValue('classic_wave_texture_opacity', DEFAULT_CLASSIC_WAVE_SETTINGS.textureOpacity).toFixed(2)}</span>
                </div>
                <Slider value={[getSliderValue('classic_wave_texture_opacity', DEFAULT_CLASSIC_WAVE_SETTINGS.textureOpacity)]} onValueChange={([v]) => updateSliderValue('classic_wave_texture_opacity', v)} onValueCommit={([value]) => onUpdate({ classic_wave_texture_opacity: value })} min={0.01} max={0.5} step={0.01} />
              </div>
            )}
          </div>

          {/* Frequencies */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Wave Frequencies</Label>
            <p className="text-xs text-muted-foreground">Higher = tighter wave pattern</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Wave 1</Label>
                  <span className="text-xs text-muted-foreground font-mono">{getSliderValue('classic_wave_frequency_1', DEFAULT_CLASSIC_WAVE_SETTINGS.frequency1).toFixed(3)}</span>
                </div>
                <Slider value={[getSliderValue('classic_wave_frequency_1', DEFAULT_CLASSIC_WAVE_SETTINGS.frequency1)]} onValueChange={([v]) => updateSliderValue('classic_wave_frequency_1', v)} onValueCommit={([value]) => onUpdate({ classic_wave_frequency_1: value })} min={0.005} max={0.1} step={0.005} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Wave 2</Label>
                  <span className="text-xs text-muted-foreground font-mono">{getSliderValue('classic_wave_frequency_2', DEFAULT_CLASSIC_WAVE_SETTINGS.frequency2).toFixed(3)}</span>
                </div>
                <Slider value={[getSliderValue('classic_wave_frequency_2', DEFAULT_CLASSIC_WAVE_SETTINGS.frequency2)]} onValueChange={([v]) => updateSliderValue('classic_wave_frequency_2', v)} onValueCommit={([value]) => onUpdate({ classic_wave_frequency_2: value })} min={0.005} max={0.1} step={0.005} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Wave 3</Label>
                  <span className="text-xs text-muted-foreground font-mono">{getSliderValue('classic_wave_frequency_3', DEFAULT_CLASSIC_WAVE_SETTINGS.frequency3).toFixed(3)}</span>
                </div>
                <Slider value={[getSliderValue('classic_wave_frequency_3', DEFAULT_CLASSIC_WAVE_SETTINGS.frequency3)]} onValueChange={([v]) => updateSliderValue('classic_wave_frequency_3', v)} onValueCommit={([value]) => onUpdate({ classic_wave_frequency_3: value })} min={0.005} max={0.1} step={0.005} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hyperspeed Settings */}
      {settings.visualizer_style === 'hyperspeed' && (
        <div className="space-y-4 p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium">Hyperspeed Settings</h5>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate({
                hyperspeed_preset: DEFAULT_HYPERSPEED_SETTINGS.preset,
                hyperspeed_base_speed: DEFAULT_HYPERSPEED_SETTINGS.baseSpeed,
                hyperspeed_bloom_strength: DEFAULT_HYPERSPEED_SETTINGS.bloomStrength,
              })}
              className="gap-1"
            >
              <RotateCw className="w-3 h-3" />
              Reset All
            </Button>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Color Preset</Label>
            <Select
              value={settings.hyperspeedSettings.preset}
              onValueChange={(value: HyperspeedPreset) => onUpdate({ hyperspeed_preset: value })}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="one"><div className="flex items-center gap-2"><div className="flex gap-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#d856bf' }} /><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#03b3c3' }} /></div><span>Cyberpunk</span></div></SelectItem>
                <SelectItem value="two"><div className="flex items-center gap-2"><div className="flex gap-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff102a' }} /><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dadafa' }} /></div><span>Akira</span></div></SelectItem>
                <SelectItem value="three"><div className="flex items-center gap-2"><div className="flex gap-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#a90519' }} /><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f1eece' }} /></div><span>Golden</span></div></SelectItem>
                <SelectItem value="four"><div className="flex items-center gap-2"><div className="flex gap-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f73' }} /><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#a4e3e6' }} /></div><span>Highway</span></div></SelectItem>
                <SelectItem value="five"><div className="flex items-center gap-2"><div className="flex gap-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#dc5b20' }} /><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#334bf7' }} /></div><span>Neon</span></div></SelectItem>
                <SelectItem value="six"><div className="flex items-center gap-2"><div className="flex gap-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff322f' }} /><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fdfdf0' }} /></div><span>Deep</span></div></SelectItem>
                <SelectItem value="seven"><div className="flex items-center gap-2"><div className="flex gap-1"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff102a' }} /><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffffff' }} /></div><span>Vertigo</span></div></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Base Speed</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('hyperspeed_base_speed', DEFAULT_HYPERSPEED_SETTINGS.baseSpeed).toFixed(2)}x</span>
              </div>
              <Slider value={[getSliderValue('hyperspeed_base_speed', DEFAULT_HYPERSPEED_SETTINGS.baseSpeed)]} onValueChange={([v]) => updateSliderValue('hyperspeed_base_speed', v)} onValueCommit={([value]) => onUpdate({ hyperspeed_base_speed: value })} min={0.1} max={3.0} step={0.1} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Bloom Strength</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('hyperspeed_bloom_strength', DEFAULT_HYPERSPEED_SETTINGS.bloomStrength).toFixed(2)}</span>
              </div>
              <Slider value={[getSliderValue('hyperspeed_bloom_strength', DEFAULT_HYPERSPEED_SETTINGS.bloomStrength)]} onValueChange={([v]) => updateSliderValue('hyperspeed_bloom_strength', v)} onValueCommit={([value]) => onUpdate({ hyperspeed_bloom_strength: value })} min={0.0} max={3.0} step={0.1} />
            </div>
          </div>
        </div>
      )}

      {/* VRM Avatar Settings */}
      {settings.visualizer_style === 'vrm_avatar' && (
        <div className="space-y-4 p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium">3D Avatar (VRM) Settings</h5>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate({
                vrm_avatar_file_path: DEFAULT_VRM_AVATAR_SETTINGS.filePath,
                vrm_avatar_mouth_intensity: DEFAULT_VRM_AVATAR_SETTINGS.mouthIntensity,
                vrm_avatar_lip_sensitivity: DEFAULT_VRM_AVATAR_SETTINGS.lipSensitivity,
                vrm_avatar_attack_speed: DEFAULT_VRM_AVATAR_SETTINGS.attackSpeed,
                vrm_avatar_decay_speed: DEFAULT_VRM_AVATAR_SETTINGS.decaySpeed,
                vrm_avatar_idle_intensity: DEFAULT_VRM_AVATAR_SETTINGS.idleIntensity,
                vrm_avatar_camera_distance: DEFAULT_VRM_AVATAR_SETTINGS.cameraDistance,
                vrm_avatar_background_color: DEFAULT_VRM_AVATAR_SETTINGS.backgroundColor,
              })}
              className="gap-1"
            >
              <RotateCw className="w-3 h-3" />
              Reset All
            </Button>
          </div>

          {/* VRM File URL */}
          <div className="space-y-2">
            <Label className="text-xs">VRM File URL</Label>
            <Input
              type="text"
              value={settings.vrmAvatarSettings?.filePath ?? DEFAULT_VRM_AVATAR_SETTINGS.filePath}
              onChange={(e) => onUpdate({ vrm_avatar_file_path: e.target.value })}
              className="font-mono text-xs"
              placeholder="/models/default-avatar.vrm"
            />
            <p className="text-xs text-muted-foreground">Path to .vrm file (local path or Supabase Storage URL)</p>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label className="text-xs">Background Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings.vrmAvatarSettings?.backgroundColor ?? DEFAULT_VRM_AVATAR_SETTINGS.backgroundColor}
                onChange={(e) => onUpdate({ vrm_avatar_background_color: e.target.value })}
                className="w-12 h-8 p-0 border-0"
              />
              <Input
                type="text"
                value={settings.vrmAvatarSettings?.backgroundColor ?? DEFAULT_VRM_AVATAR_SETTINGS.backgroundColor}
                onChange={(e) => onUpdate({ vrm_avatar_background_color: e.target.value })}
                className="flex-1 font-mono text-xs"
              />
            </div>
          </div>

          {/* Lip Sync Controls */}
          <div className="space-y-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lip Sync</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Mouth Intensity</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('vrm_avatar_mouth_intensity', DEFAULT_VRM_AVATAR_SETTINGS.mouthIntensity).toFixed(1)}x</span>
              </div>
              <Slider value={[getSliderValue('vrm_avatar_mouth_intensity', DEFAULT_VRM_AVATAR_SETTINGS.mouthIntensity)]} onValueChange={([v]) => updateSliderValue('vrm_avatar_mouth_intensity', v)} onValueCommit={([value]) => onUpdate({ vrm_avatar_mouth_intensity: value })} min={0.1} max={3.0} step={0.1} />
              <p className="text-[10px] text-muted-foreground">How wide the mouth opens. Higher = more dramatic.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Lip Sensitivity</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('vrm_avatar_lip_sensitivity', DEFAULT_VRM_AVATAR_SETTINGS.lipSensitivity).toFixed(2)}</span>
              </div>
              <Slider value={[getSliderValue('vrm_avatar_lip_sensitivity', DEFAULT_VRM_AVATAR_SETTINGS.lipSensitivity)]} onValueChange={([v]) => updateSliderValue('vrm_avatar_lip_sensitivity', v)} onValueCommit={([value]) => onUpdate({ vrm_avatar_lip_sensitivity: value })} min={0.2} max={1.0} step={0.05} />
              <p className="text-[10px] text-muted-foreground">Lower = more responsive to quiet speech. Higher = only reacts to loud sounds.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Attack Speed</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('vrm_avatar_attack_speed', DEFAULT_VRM_AVATAR_SETTINGS.attackSpeed).toFixed(2)}</span>
              </div>
              <Slider value={[getSliderValue('vrm_avatar_attack_speed', DEFAULT_VRM_AVATAR_SETTINGS.attackSpeed)]} onValueChange={([v]) => updateSliderValue('vrm_avatar_attack_speed', v)} onValueCommit={([value]) => onUpdate({ vrm_avatar_attack_speed: value })} min={0.1} max={1.0} step={0.05} />
              <p className="text-[10px] text-muted-foreground">How fast the mouth opens when speech starts.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Decay Speed</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('vrm_avatar_decay_speed', DEFAULT_VRM_AVATAR_SETTINGS.decaySpeed).toFixed(2)}</span>
              </div>
              <Slider value={[getSliderValue('vrm_avatar_decay_speed', DEFAULT_VRM_AVATAR_SETTINGS.decaySpeed)]} onValueChange={([v]) => updateSliderValue('vrm_avatar_decay_speed', v)} onValueCommit={([value]) => onUpdate({ vrm_avatar_decay_speed: value })} min={0.05} max={0.8} step={0.05} />
              <p className="text-[10px] text-muted-foreground">How fast the mouth closes after speech. Lower = smoother, higher = snappier.</p>
            </div>
          </div>

          {/* Body & Camera Controls */}
          <div className="space-y-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Body & Camera</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Idle Movement</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('vrm_avatar_idle_intensity', DEFAULT_VRM_AVATAR_SETTINGS.idleIntensity).toFixed(1)}x</span>
              </div>
              <Slider value={[getSliderValue('vrm_avatar_idle_intensity', DEFAULT_VRM_AVATAR_SETTINGS.idleIntensity)]} onValueChange={([v]) => updateSliderValue('vrm_avatar_idle_intensity', v)} onValueCommit={([value]) => onUpdate({ vrm_avatar_idle_intensity: value })} min={0.0} max={2.0} step={0.1} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Camera Distance</Label>
                <span className="text-xs text-muted-foreground font-mono">{getSliderValue('vrm_avatar_camera_distance', DEFAULT_VRM_AVATAR_SETTINGS.cameraDistance).toFixed(1)}</span>
              </div>
              <Slider value={[getSliderValue('vrm_avatar_camera_distance', DEFAULT_VRM_AVATAR_SETTINGS.cameraDistance)]} onValueChange={([v]) => updateSliderValue('vrm_avatar_camera_distance', v)} onValueCommit={([value]) => onUpdate({ vrm_avatar_camera_distance: value })} min={0.5} max={5.0} step={0.1} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
