// ABOUTME: Rich model selector with educational hover cards for Creative Studio
// ABOUTME: Shows model icon, name, subtitle, cost, and detailed tooltip explaining capabilities

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CreativeStudioModel } from '@/types/creative-studio';

/** Format cost dropping unnecessary trailing zeros: $0.040 → $0.04, $0.800 → $0.80 */
export function formatCost(cost: number): string {
  if (cost >= 1) return cost.toFixed(2);
  const s = cost.toFixed(3);
  return s.endsWith('0') ? cost.toFixed(2) : s;
}

/** Educational metadata for each model family */
interface ModelMeta {
  name: string;
  subtitle: string;
  icon: string;
  learnMore: string;
  strengths: string[];
  bestFor: string;
}

/** Map model IDs to marketing display names, educational descriptors, and provider icons */
export function getModelMeta(model: CreativeStudioModel): ModelMeta {
  const id = model.model_id;

  // Gemini "Nano Banana" family — native image generation
  if (id.includes('gemini-3.1-flash')) return {
    name: 'Nano Banana 2',
    subtitle: 'Gemini 3.1 Flash · Speed optimized',
    icon: '🍌',
    learnMore: 'Second generation of Google\'s native multimodal image generation. Produces images directly from the language model without a separate diffusion step.',
    strengths: ['Fastest generation time', 'Strong text rendering', 'Good at following complex instructions', 'Low cost per generation'],
    bestFor: 'Quick iterations, social content, and text-heavy designs',
  };
  if (id.includes('gemini-3-pro')) return {
    name: 'Nano Banana Pro',
    subtitle: 'Gemini 3 Pro · Advanced reasoning',
    icon: '🍌',
    learnMore: 'Google\'s most capable multimodal model with advanced reasoning. Uses deeper understanding of prompts to produce higher-fidelity output.',
    strengths: ['Best prompt comprehension', 'Superior composition', 'Excellent at complex scenes', 'Strong brand voice interpretation'],
    bestFor: 'Hero images, campaign assets, and complex creative briefs',
  };
  if (id.includes('gemini-2.5-flash-image')) return {
    name: 'Nano Banana',
    subtitle: 'Gemini 2.5 Flash · Fast & efficient',
    icon: '🍌',
    learnMore: 'The original Gemini native image generation model. Fast and cost-effective with solid quality for everyday generation tasks.',
    strengths: ['Very fast generation', 'Low cost', 'Good general quality', 'Reliable consistency'],
    bestFor: 'Everyday generation, drafting concepts, and budget-conscious work',
  };

  // Imagen family — dedicated image models
  if (id.includes('imagen-4') && id.includes('ultra')) return {
    name: model.name,
    subtitle: 'Highest fidelity · Premium',
    icon: '📷',
    learnMore: 'Google\'s premium tier image model. Produces the highest resolution and most photorealistic output available, with exceptional detail and lighting.',
    strengths: ['Highest resolution output', 'Best photorealism', 'Exceptional detail rendering', 'Premium lighting quality'],
    bestFor: 'Print-ready assets, hero photography, and high-end campaign work',
  };
  if (id.includes('imagen-4') && id.includes('standard') && !id.includes('fast')) return {
    name: model.name,
    subtitle: 'Photorealistic · Balanced',
    icon: '📷',
    learnMore: 'Imagen 4\'s balanced tier — strong photorealism with reasonable generation times. The workhorse for most professional image generation needs.',
    strengths: ['Excellent photorealism', 'Good speed/quality balance', 'Strong compositional accuracy', 'Reliable brand colors'],
    bestFor: 'Product photography, lifestyle shoots, and standard campaign assets',
  };
  if (id.includes('imagen-4') && id.includes('fast')) return {
    name: model.name,
    subtitle: 'Quick iterations · Low cost',
    icon: '📷',
    learnMore: 'Speed-optimized Imagen 4 variant. Trades some fidelity for much faster generation — ideal for exploring directions quickly.',
    strengths: ['Fast generation speed', 'Lowest Imagen cost', 'Good for rapid exploration', 'Consistent style'],
    bestFor: 'Quick concept exploration, mood boards, and A/B testing variations',
  };
  if (id.includes('imagen-4') && id.includes('upscale')) return {
    name: model.name,
    subtitle: 'Enhance resolution up to 4x',
    icon: '📷',
    learnMore: 'AI-powered upscaling that adds genuine detail rather than simple interpolation. Enhances textures, sharpens edges, and improves clarity.',
    strengths: ['2x and 4x upscaling', 'Adds real detail', 'Preserves image character', 'Works with any source'],
    bestFor: 'Making social assets print-ready, enhancing older imagery, and preparing final deliverables',
  };
  if (id.includes('imagen-3') && id.includes('capability')) return {
    name: model.name,
    subtitle: 'Mask-based inpainting & editing',
    icon: '📷',
    learnMore: 'Specialized editing model that uses masks to selectively modify parts of an image. Enables precise object removal, replacement, and background swapping.',
    strengths: ['Precise mask-based editing', 'Natural object removal', 'Seamless background swaps', 'Context-aware fill'],
    bestFor: 'Retouching, object removal, background replacement, and selective editing',
  };
  if (id.includes('product-recontext')) return {
    name: model.name,
    subtitle: 'Place products in new scenes',
    icon: '📷',
    learnMore: 'Places product photography into AI-generated scenes with natural lighting and shadows. Maintains product fidelity while creating new environmental context.',
    strengths: ['Preserves product details', 'Natural lighting match', 'Realistic shadows', 'Scene-aware composition'],
    bestFor: 'E-commerce photography, seasonal campaigns, and lifestyle product shots',
  };
  if (id.includes('virtual-try-on')) return {
    name: model.name,
    subtitle: 'AI clothing visualization',
    icon: '📷',
    learnMore: 'Visualizes how clothing items look on models with realistic draping, fit, and fabric behavior. Reduces the need for physical photo shoots.',
    strengths: ['Realistic draping', 'Accurate fit representation', 'Multiple body types', 'Fabric-aware rendering'],
    bestFor: 'Fashion e-commerce, lookbooks, and virtual styling',
  };

  // Veo family — video generation
  if (id === 'veo-3.1-generate-preview') return {
    name: model.name,
    subtitle: 'Up to 4K · Audio · $0.40/sec',
    icon: '🎥',
    learnMore: 'Google\'s latest video generation model. Produces cinematic quality video with synchronized audio, camera controls, and up to 4K resolution.',
    strengths: ['4K resolution', 'Synchronized audio generation', 'Cinematic camera controls', 'Longest clip duration'],
    bestFor: 'Hero video content, social reels, and high-fidelity brand films',
  };
  if (id === 'veo-3.1-fast-generate-preview') return {
    name: model.name,
    subtitle: 'Up to 4K · Audio · $0.15/sec',
    icon: '🎥',
    learnMore: 'Speed-optimized Veo 3.1 variant with audio support. Faster generation at lower cost — great for exploring video directions before committing to premium output.',
    strengths: ['Faster than standard Veo', 'Lower cost', 'Still supports audio', 'Good for iteration'],
    bestFor: 'Video concepts, rapid prototyping, and budget-conscious video work',
  };
  if (id === 'veo-2.0-generate-001') return {
    name: model.name,
    subtitle: 'Prior gen · No audio · $0.35/sec',
    icon: '🎥',
    learnMore: 'Previous generation Veo model. Solid video quality without audio generation. Useful for scenarios where you\'ll add your own audio track.',
    strengths: ['Proven reliability', 'Consistent output', 'Good motion quality', 'No audio overhead'],
    bestFor: 'Video assets where you\'ll add your own audio, and proven production workflows',
  };

  return {
    name: model.name,
    subtitle: model.provider || 'AI model',
    icon: '✨',
    learnMore: 'AI generation model.',
    strengths: [],
    bestFor: 'General content creation',
  };
}

interface ModelSelectorProps {
  models: CreativeStudioModel[] | undefined;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  label: string;
  className?: string;
}

export function ModelSelector({
  models,
  selectedModelId,
  onModelChange,
  label,
  className,
}: ModelSelectorProps) {
  const selectedModel = models?.find(m => m.model_id === selectedModelId);
  const selectedMeta = selectedModel ? getModelMeta(selectedModel) : null;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {selectedModel && (
          <span className="text-[10px] text-muted-foreground font-mono">
            ${formatCost(selectedModel.cost_per_generation)}/gen
          </span>
        )}
      </div>

      <HoverCard openDelay={300} closeDelay={100}>
        <HoverCardTrigger asChild>
          <div>
            <Select value={selectedModelId} onValueChange={onModelChange}>
              <SelectTrigger className="h-9 text-xs border-border/60 bg-card shadow-sm">
                <SelectValue placeholder={`Select ${label.toLowerCase()}`}>
                  {selectedMeta && (
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{selectedMeta.icon}</span>
                      <span className="font-medium">{selectedMeta.name}</span>
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[400px] min-w-[260px]">
                {models?.map((model) => {
                  const meta = getModelMeta(model);
                  return (
                    <SelectItem key={model.model_id} value={model.model_id} textValue={meta.name}>
                      <div className="flex flex-col gap-0.5 py-0.5">
                        <span className="text-xs font-medium">
                          {meta.icon} {meta.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{meta.subtitle}</span>
                          <span>·</span>
                          <span>${formatCost(model.cost_per_generation)}/gen</span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </HoverCardTrigger>

        {selectedModel && selectedMeta && (
          <HoverCardContent side="left" align="start" className="w-72 p-0 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-muted/50 border-b">
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedMeta.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{selectedMeta.name}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedMeta.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedMeta.learnMore}
              </p>

              {selectedMeta.strengths.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Strengths</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedMeta.strengths.map((s) => (
                      <Badge key={s} variant="secondary" className="text-[9px] h-5 px-1.5 font-normal">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-1 border-t">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-medium">Best for:</span> {selectedMeta.bestFor}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                <span>Cost per generation</span>
                <span className="font-mono font-medium">${formatCost(selectedModel.cost_per_generation)}</span>
              </div>
            </div>
          </HoverCardContent>
        )}
      </HoverCard>
    </div>
  );
}
