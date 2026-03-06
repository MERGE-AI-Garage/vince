// ABOUTME: Voice visualizer switcher that renders the selected visualizer style.
// ABOUTME: Supports multiple visualizer presets selected via admin settings.

import React from 'react';
import { VisualizerProps, VisualizerStyle, LightPillarSettings, ClassicWaveSettings, Codrops3DOrbSettings } from './types';
import { ClassicWaveVisualizer } from './ClassicWaveVisualizer';
import { Codrops3DOrbVisualizer } from './Codrops3DOrbVisualizer';
import { LightPillarVisualizer } from './LightPillarVisualizer';
import { HyperspeedVisualizer, HyperspeedSettings } from './HyperspeedVisualizer';

interface ScoutVisualizerProps extends VisualizerProps {
  style: VisualizerStyle;
  lightPillarSettings?: Partial<LightPillarSettings>;
  hyperspeedSettings?: Partial<HyperspeedSettings>;
  classicWaveSettings?: Partial<ClassicWaveSettings>;
  codrops3DOrbSettings?: Partial<Codrops3DOrbSettings>;
}

export const ScoutVisualizer: React.FC<ScoutVisualizerProps> = ({
  style,
  isActive,
  volumeRef,
  isUserSpeaking,
  className,
  lightPillarSettings,
  hyperspeedSettings,
  classicWaveSettings,
  codrops3DOrbSettings,
}) => {
  switch (style) {
    case 'codrops_3d_orb':
      return (
        <Codrops3DOrbVisualizer
          isActive={isActive}
          volumeRef={volumeRef}
          isUserSpeaking={isUserSpeaking}
          className={className}
          settings={codrops3DOrbSettings}
        />
      );
    case 'light_pillar':
      return (
        <LightPillarVisualizer
          isActive={isActive}
          volumeRef={volumeRef}
          isUserSpeaking={isUserSpeaking}
          className={className}
          settings={lightPillarSettings}
        />
      );
    case 'hyperspeed':
      return (
        <HyperspeedVisualizer
          isActive={isActive}
          volumeRef={volumeRef}
          isUserSpeaking={isUserSpeaking}
          className={className}
          settings={hyperspeedSettings}
        />
      );
    case 'classic_wave':
    default:
      return (
        <ClassicWaveVisualizer
          isActive={isActive}
          volumeRef={volumeRef}
          isUserSpeaking={isUserSpeaking}
          className={className}
          settings={classicWaveSettings}
        />
      );
  }
};
