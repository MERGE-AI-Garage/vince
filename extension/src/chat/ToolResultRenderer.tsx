// ABOUTME: Renders a tool result payload — creative package, images, videos, or competitor analysis.
// ABOUTME: Used by both VoiceStrip and ChatMessage to display rich visual outputs.

import React from 'react';
import type { ToolResult } from '../hooks/useVinceVoice';
import { CreativePackageCard } from './CreativePackageCard';
import { ImageResultCard } from './ImageResultCard';
import { VideoResultCard } from './VideoResultCard';
import { CompetitorAnalysisCard } from './CompetitorAnalysisCard';
import { GenerationHistoryCard } from './GenerationHistoryCard';
import type { PackagePart } from './CreativePackageCard';

interface Props {
  result: ToolResult;
  /** Called when user clicks a campaign direction from competitor analysis */
  onSelectCampaignDirection?: (text: string) => void;
}

export function ToolResultRenderer({ result, onSelectCampaignDirection }: Props) {
  const containerStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '12px',
    marginTop: '6px',
  };

  if (result.type === 'creative_package') {
    const d = result.data;
    return (
      <div style={containerStyle}>
        <CreativePackageCard
          parts={(d.parts as PackagePart[]) || []}
          imageUrls={(d.image_urls as string[]) || []}
          latencyMs={(d.latency_ms as number) || 0}
          brandName={(d.brand_name as string) || ''}
          model={(d.model as string) || ''}
          brief={d.brief as string | undefined}
          deliverableNames={(d.deliverable_names as string[]) || []}
          brandAlignment={d.brand_alignment as { score: number; dimensions: { visual_identity: boolean; photography: boolean; color_system: boolean; brand_voice: boolean } } | undefined}
        />
      </div>
    );
  }

  if (result.type === 'generated_images') {
    return (
      <div style={containerStyle}>
        <ImageResultCard imageUrls={result.data.image_urls} />
      </div>
    );
  }

  if (result.type === 'generated_videos') {
    return (
      <div style={containerStyle}>
        <VideoResultCard videoUrls={result.data.video_urls} />
      </div>
    );
  }

  if (result.type === 'competitor_analysis') {
    return (
      <div style={containerStyle}>
        <CompetitorAnalysisCard
          data={result.data}
          onSelectDirection={onSelectCampaignDirection
            ? (dir, i) => onSelectCampaignDirection(`Let's go with direction ${i + 1}: ${dir.title}`)
            : undefined}
        />
      </div>
    );
  }

  if (result.type === 'generation_history') {
    return (
      <div style={containerStyle}>
        <GenerationHistoryCard generations={result.data.generations} />
      </div>
    );
  }

  return null;
}
