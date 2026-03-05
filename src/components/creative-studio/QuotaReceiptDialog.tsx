// ABOUTME: Weekly quota receipt dialog showing generation history with thumbnails and costs
// ABOUTME: Includes model pricing reference and "Request More" button

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Image,
  Video,
  Clock,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCreativeStudioFullQuota } from '@/hooks/useCreativeStudioQuota';
import { useCreativeStudioModels } from '@/hooks/useCreativeStudioModels';
import { convertGcsUri } from '@/lib/image-utils';
import { cn } from '@/lib/utils';
import type { GenerationWithDetails, CreativeStudioModel } from '@/types/creative-studio';

interface QuotaReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useWeeklyGenerations() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['creative-studio-generations', 'weekly-receipt', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Start of current week (Monday UTC)
      const now = new Date();
      const day = now.getUTCDay();
      const monday = new Date(now);
      monday.setUTCDate(now.getUTCDate() - day + (day === 0 ? -6 : 1));
      monday.setUTCHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('creative_studio_generations')
        .select(`
          *,
          model:creative_studio_models(id, name, model_id, model_type, cost_per_generation, parameters)
        `)
        .eq('user_id', profile.id)
        .gte('created_at', monday.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(gen => ({
        ...gen,
        parameters: gen.parameters as Record<string, unknown>,
        metadata: (gen.metadata || {}) as Record<string, unknown>,
        model: gen.model ? {
          ...gen.model,
          capabilities: [] as string[],
          parameters: gen.model.parameters as Record<string, unknown>,
        } : undefined,
      })) as GenerationWithDetails[];
    },
    enabled: !!profile?.id,
    staleTime: 15000,
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}, ${time}`;
}

function formatCost(cost: number | undefined): string {
  if (!cost) return '$0.00';
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}

function GenerationRow({ gen }: { gen: GenerationWithDetails }) {
  const isVideo = gen.generation_type?.includes('video');
  const thumbUrl = gen.output_urls?.[0] ? convertGcsUri(gen.output_urls[0]) : null;
  const isFailed = gen.status === 'failed';

  return (
    <div className={cn(
      'flex items-center gap-3 py-2 px-2 rounded-md',
      isFailed && 'opacity-50',
    )}>
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0 border">
        {thumbUrl && !isFailed ? (
          isVideo ? (
            <video
              src={thumbUrl}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            <img
              src={thumbUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isFailed ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : isVideo ? (
              <Video className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Image className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium truncate">
            {gen.model?.name || gen.model_used}
          </span>
          {gen.output_urls?.length > 1 && (
            <Badge variant="outline" className="text-[9px] px-1 py-0">
              ×{gen.output_urls.length}
            </Badge>
          )}
          {isFailed && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 text-red-500 border-red-500/30">
              Failed
            </Badge>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground truncate">
          {formatDate(gen.created_at)}
        </div>
      </div>

      {/* Cost */}
      <div className="text-right flex-shrink-0">
        <div className="text-xs font-medium tabular-nums">
          {formatCost(gen.estimated_cost_usd)}
        </div>
      </div>
    </div>
  );
}

function ModelPricingReference({ models }: { models: CreativeStudioModel[] }) {
  const [expanded, setExpanded] = useState(false);

  const imageModels = models.filter(m => m.model_type === 'image');
  const videoModels = models.filter(m => m.model_type === 'video');

  return (
    <div className="border-t pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 text-left hover:text-foreground transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground flex-1">Model Pricing Reference</span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="mt-2 space-y-3">
          {imageModels.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Image Models</div>
              {imageModels.map(m => (
                <div key={m.model_id} className="flex items-center justify-between py-0.5">
                  <span className="text-[11px] text-muted-foreground">{m.name}</span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {formatCost(m.cost_per_generation)}/image
                  </span>
                </div>
              ))}
            </div>
          )}
          {videoModels.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Video Models</div>
              {videoModels.map(m => {
                const params = m.parameters as Record<string, unknown>;
                const tiers = (params?.pricing_tiers as Array<{ label: string; per_second: number }>) || [];
                const costPerSec = (params?.cost_per_second as number) || 0;
                return (
                  <div key={m.model_id} className="flex items-center justify-between py-0.5">
                    <span className="text-[11px] text-muted-foreground">{m.name}</span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {tiers.length > 0
                        ? `$${tiers[0].per_second.toFixed(2)}–$${tiers[tiers.length - 1].per_second.toFixed(2)}/sec`
                        : `$${costPerSec.toFixed(2)}/sec`
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function QuotaReceiptDialog({ open, onOpenChange }: QuotaReceiptDialogProps) {
  const { data: quota } = useCreativeStudioFullQuota();
  const { data: generations, isLoading } = useWeeklyGenerations();
  const { data: imageModels } = useCreativeStudioModels('image');
  const { data: videoModels } = useCreativeStudioModels('video');

  const allModels = useMemo(() => [
    ...(imageModels || []),
    ...(videoModels || []),
  ], [imageModels, videoModels]);

  const stats = useMemo(() => {
    if (!generations) return { totalCost: 0, imageCount: 0, videoCount: 0, failedCount: 0 };

    let totalCost = 0;
    let imageCount = 0;
    let videoCount = 0;
    let failedCount = 0;

    for (const gen of generations) {
      if (gen.status === 'failed') {
        failedCount++;
        continue;
      }
      const cost = Number(gen.estimated_cost_usd) || 0;
      totalCost += cost;
      if (gen.generation_type?.includes('video')) {
        videoCount++;
      } else {
        imageCount++;
      }
    }

    return { totalCost, imageCount, videoCount, failedCount };
  }, [generations]);

  if (!quota) return null;

  const imagePercent = quota.image.limit_value > 0
    ? ((quota.image.limit_value - quota.image.remaining) / quota.image.limit_value) * 100
    : 0;
  const videoPercent = quota.video.limit_value > 0
    ? ((quota.video.limit_value - quota.video.remaining) / quota.video.limit_value) * 100
    : 0;

  const now = new Date();
  const resetEnd = new Date(quota.period_end);
  const daysUntilReset = Math.max(0, Math.ceil((resetEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return '[&>div]:bg-red-500';
    if (percent >= 80) return '[&>div]:bg-orange-500';
    return '[&>div]:bg-green-500';
  };

  const completedGenerations = generations?.filter(g => g.status === 'completed') || [];
  const failedGenerations = generations?.filter(g => g.status === 'failed') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Weekly Quota</span>
            <Badge variant="outline" className="text-xs font-normal">
              <Clock className="w-3 h-3 mr-1" />
              Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Quota Bars */}
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  Images
                </span>
                <span className="font-medium tabular-nums">
                  {quota.image.limit_value - quota.image.remaining} / {quota.image.limit_value}
                </span>
              </div>
              <Progress value={imagePercent} className={`h-2 ${getProgressColor(imagePercent)}`} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  Videos
                </span>
                <span className="font-medium tabular-nums">
                  {quota.video.limit_value - quota.video.remaining} / {quota.video.limit_value}
                </span>
              </div>
              <Progress value={videoPercent} className={`h-2 ${getProgressColor(videoPercent)}`} />
            </div>

            {/* Running total */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Estimated cost this week</span>
              <span className="text-sm font-semibold tabular-nums">
                ${stats.totalCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Generation History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                This Week's Generations
              </span>
              <span className="text-xs text-muted-foreground">
                {stats.imageCount} image{stats.imageCount !== 1 ? 's' : ''}
                {stats.videoCount > 0 && `, ${stats.videoCount} video${stats.videoCount !== 1 ? 's' : ''}`}
              </span>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
            ) : completedGenerations.length === 0 && failedGenerations.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No generations this week yet.
              </div>
            ) : (
              <div className="space-y-0.5">
                {/* Group by day */}
                {completedGenerations.map((gen) => (
                  <GenerationRow key={gen.id} gen={gen} />
                ))}

                {/* Failed generations at the bottom */}
                {failedGenerations.length > 0 && (
                  <>
                    <div className="text-[10px] text-muted-foreground pt-2 pb-1">
                      {failedGenerations.length} failed (no cost)
                    </div>
                    {failedGenerations.map((gen) => (
                      <GenerationRow key={gen.id} gen={gen} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Model Pricing Reference (collapsible) */}
          {allModels.length > 0 && (
            <ModelPricingReference models={allModels} />
          )}
        </div>

        {/* Request More */}
        <div className="border-t pt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Need more generations?
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = 'mailto:ai-enablement@mergeworld.com?subject=Creative%20Studio%20Quota%20Increase%20Request&body=I%20would%20like%20to%20request%20an%20increase%20to%20my%20weekly%20Creative%20Studio%20generation%20quota.%0A%0ACurrent%20usage%3A%20' +
                encodeURIComponent(`${stats.imageCount} images, ${stats.videoCount} videos`) +
                '%0AReason%3A%20';
            }}
          >
            <Mail className="w-3.5 h-3.5 mr-1.5" />
            Request More
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
