// ABOUTME: Collapsible cost calculator panel for all Creative Studio models
// ABOUTME: Reads pricing from model parameters (DB-driven), supports per-second and per-image pricing

import { useState } from 'react';
import { DollarSign, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreativeStudioModel, ModelPricingTier } from '@/types/creative-studio';

const CLIP_COUNTS = [1, 2, 4, 8] as const;
const SAMPLE_COUNTS = [1, 2, 4] as const;

/** Extract pricing tiers from model parameters, falling back to single cost_per_second rate */
function getPricingTiers(model: CreativeStudioModel): ModelPricingTier[] {
  const params = model.parameters as any;
  if (params?.pricing_tiers?.length > 0) return params.pricing_tiers;
  if (params?.cost_per_second) return [{ label: 'All resolutions', per_second: params.cost_per_second }];
  return [];
}

function getDurations(model: CreativeStudioModel): number[] {
  const params = model.parameters as any;
  return params?.durations || [8];
}

function getCostUnit(model: CreativeStudioModel): string {
  return (model.parameters as any)?.cost_unit || 'per_image';
}

function getMaxSamples(model: CreativeStudioModel): number {
  return (model.parameters as any)?.max_sample_count || 1;
}

interface ModelCostPanelProps {
  activeModel: CreativeStudioModel;
  allModels?: CreativeStudioModel[];
}

export function ModelCostPanel({ activeModel, allModels }: ModelCostPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const costUnit = getCostUnit(activeModel);

  return (
    <div className="rounded-lg border bg-muted/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors rounded-lg"
      >
        <DollarSign className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="text-xs font-medium flex-1 truncate">Cost Estimator</span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {costUnit === 'per_second' ? (
            <VideoCostEstimator activeModel={activeModel} allModels={allModels} />
          ) : (
            <ImageCostEstimator activeModel={activeModel} allModels={allModels} />
          )}
        </div>
      )}
    </div>
  );
}

/** Duration-based cost calculator for video models */
export function VideoCostEstimator({ activeModel, allModels }: { activeModel: CreativeStudioModel; allModels?: CreativeStudioModel[] }) {
  const tiers = getPricingTiers(activeModel);
  const durations = getDurations(activeModel);
  const hasAudio = (activeModel.parameters as any)?.supports_audio ?? false;

  const [duration, setDuration] = useState<number>(durations[durations.length - 1] || 8);
  const [clips, setClips] = useState<number>(1);

  const siblingModels = allModels?.filter(m => m.model_type === 'video') || [];

  return (
    <>
      {/* Rate table for selected model */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-medium text-primary">{activeModel.name}</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          {tiers.map((tier) => (
            <div key={tier.label} className="contents">
              <span className="text-[10px] text-muted-foreground">{tier.label}</span>
              <span className="text-[10px] text-muted-foreground text-right">${tier.per_second.toFixed(2)}/sec</span>
            </div>
          ))}
        </div>
        {hasAudio && (
          <div className="text-[10px] text-muted-foreground/60">Includes native audio</div>
        )}
      </div>

      {/* Interactive estimator */}
      <div className="space-y-2 pt-1 border-t border-border/50">
        <div className="text-[10px] font-medium text-muted-foreground">Estimate your cost</div>

        {/* Duration selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-12 shrink-0">Duration</span>
          <div className="flex gap-1">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] transition-colors',
                  duration === d
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground',
                )}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Clip count selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-12 shrink-0">Clips</span>
          <div className="flex gap-1">
            {CLIP_COUNTS.map((c) => (
              <button
                key={c}
                onClick={() => setClips(c)}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] transition-colors',
                  clips === c
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="bg-muted/50 rounded-md p-2 space-y-1">
          {tiers.map((tier) => {
            const totalCost = tier.per_second * duration * clips;
            return (
              <div key={tier.label} className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {clips} × {duration}s @ {tier.label}
                </span>
                <span className={cn(
                  'text-[11px] font-semibold tabular-nums',
                  totalCost >= 10 ? 'text-red-500' : totalCost >= 5 ? 'text-amber-500' : 'text-foreground',
                )}>
                  ${totalCost.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Warning for high costs */}
        {tiers.some(t => t.per_second * duration * clips >= 10) && (
          <div className="flex items-start gap-1.5 text-[10px] text-amber-500">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
            <span>Video costs add up fast. Consider a faster model for iterations.</span>
          </div>
        )}
      </div>

      {/* All video models comparison */}
      {siblingModels.length > 1 && (
        <div className="space-y-1.5 pt-1 border-t border-border/50">
          <div className="text-[10px] font-medium text-muted-foreground">
            All models · {duration}s × {clips} clip{clips > 1 ? 's' : ''}
          </div>
          {siblingModels.map((model) => {
            const modelTiers = getPricingTiers(model);
            if (modelTiers.length === 0) return null;
            const lowCost = modelTiers[0].per_second * duration * clips;
            const highCost = modelTiers[modelTiers.length - 1].per_second * duration * clips;
            const isActive = model.model_id === activeModel.model_id;
            return (
              <div key={model.model_id} className={cn(
                'flex items-center justify-between py-0.5',
                isActive && 'text-primary',
              )}>
                <span className={cn('text-[10px]', isActive ? 'font-medium' : 'text-muted-foreground')}>
                  🎥 {model.name}
                </span>
                <span className={cn('text-[10px] tabular-nums', isActive ? 'font-medium' : 'text-muted-foreground')}>
                  {lowCost === highCost
                    ? `$${lowCost.toFixed(2)}`
                    : `$${lowCost.toFixed(2)}–$${highCost.toFixed(2)}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/** Per-image cost calculator for image models */
export function ImageCostEstimator({ activeModel, allModels }: { activeModel: CreativeStudioModel; allModels?: CreativeStudioModel[] }) {
  const maxSamples = getMaxSamples(activeModel);
  const costPerImage = activeModel.cost_per_generation;
  const [samples, setSamples] = useState<number>(1);

  const siblingModels = allModels?.filter(m => m.model_type === 'image') || [];
  const availableSampleCounts = SAMPLE_COUNTS.filter(s => s <= maxSamples);

  return (
    <>
      {/* Current model cost */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-medium text-primary">{activeModel.name}</div>
        <div className="text-[10px] text-muted-foreground">
          ${costPerImage.toFixed(3)} per image · up to {maxSamples} per prompt
        </div>
      </div>

      {/* Sample count selector */}
      {maxSamples > 1 && (
        <div className="space-y-2 pt-1 border-t border-border/50">
          <div className="text-[10px] font-medium text-muted-foreground">Images per prompt</div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-12 shrink-0">Count</span>
            <div className="flex gap-1">
              {availableSampleCounts.map((s) => (
                <button
                  key={s}
                  onClick={() => setSamples(s)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] transition-colors',
                    samples === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-muted/50 rounded-md p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {samples} image{samples > 1 ? 's' : ''} × ${costPerImage.toFixed(3)}
              </span>
              <span className="text-[11px] font-semibold tabular-nums">
                ${(costPerImage * samples).toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* All image models comparison */}
      {siblingModels.length > 1 && (
        <div className="space-y-1.5 pt-1 border-t border-border/50">
          <div className="text-[10px] font-medium text-muted-foreground">
            All models · {samples} image{samples > 1 ? 's' : ''}
          </div>
          {siblingModels.map((model) => {
            const cost = model.cost_per_generation * samples;
            const isActive = model.model_id === activeModel.model_id;
            const modelMax = getMaxSamples(model);
            const canDoCount = samples <= modelMax;
            return (
              <div key={model.model_id} className={cn(
                'flex items-center justify-between py-0.5',
                isActive && 'text-primary',
                !canDoCount && 'opacity-40',
              )}>
                <span className={cn('text-[10px]', isActive ? 'font-medium' : 'text-muted-foreground')}>
                  📷 {model.name}
                  {!canDoCount && <span className="ml-1 text-[9px]">(max {modelMax})</span>}
                </span>
                <span className={cn('text-[10px] tabular-nums', isActive ? 'font-medium' : 'text-muted-foreground')}>
                  ${cost.toFixed(3)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
