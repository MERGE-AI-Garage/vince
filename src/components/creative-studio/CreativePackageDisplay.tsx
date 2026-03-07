// ABOUTME: Displays interleaved creative package results (text + images).
// ABOUTME: Renders alternating copy blocks and generated images from Gemini interleaved output.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, Check, Clock, Layers, Sparkles, ShieldCheck, MonitorPlay } from 'lucide-react';
import { toast } from 'sonner';

export interface PackagePart {
  type: 'text' | 'image';
  content?: string;
  image_base64?: string;
  mime_type?: string;
}

interface DeliverableGroup {
  name: string;
  index: number;
  text?: string;
  imageUrl?: string;
}

interface BrandAlignment {
  score: number;
  dimensions: {
    visual_identity: boolean;
    photography: boolean;
    color_system: boolean;
    brand_voice: boolean;
  };
}

interface CreativePackageDisplayProps {
  parts: PackagePart[];
  imageUrls: string[];
  latencyMs: number;
  brandName: string;
  model: string;
  brief?: string;
  deliverableNames?: string[];
  brandAlignment?: BrandAlignment;
  onLoadToCanvas?: (imageUrl: string) => void;
}

function groupParts(parts: PackagePart[], deliverableNames: string[]): DeliverableGroup[] {
  const groups: DeliverableGroup[] = [];
  let pendingText: string | undefined;
  let imageIndex = 0;

  for (const part of parts) {
    if (part.type === 'text' && part.content) {
      if (pendingText !== undefined) {
        // Flush text-only block before starting new one
        groups.push({
          name: deliverableNames[imageIndex] || `Deliverable ${imageIndex + 1}`,
          index: imageIndex,
          text: pendingText,
        });
      }
      pendingText = part.content;
    } else if (part.type === 'image') {
      const imageUrl = part.content || (part.image_base64
        ? `data:${part.mime_type || 'image/png'};base64,${part.image_base64}`
        : undefined);

      groups.push({
        name: deliverableNames[imageIndex] || `Deliverable ${imageIndex + 1}`,
        index: imageIndex,
        text: pendingText,
        imageUrl,
      });
      pendingText = undefined;
      imageIndex++;
    }
  }

  // Any trailing text-only block
  if (pendingText !== undefined) {
    groups.push({
      name: deliverableNames[imageIndex] || 'Package Notes',
      index: imageIndex,
      text: pendingText,
    });
  }

  return groups;
}

export function CreativePackageDisplay({
  parts,
  imageUrls,
  latencyMs,
  brandName,
  model,
  brief,
  deliverableNames = [],
  brandAlignment,
  onLoadToCanvas,
}: CreativePackageDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const imageCount = parts.filter(p => p.type === 'image').length;
  const groups = groupParts(parts, deliverableNames);

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Copied to clipboard');
  };

  const handleDownloadImage = (url: string, name: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${brandName.toLowerCase().replace(/\s+/g, '-')}-${name.toLowerCase().replace(/\s+/g, '-')}-${index + 1}.png`;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-purple-500/20">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Layers className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
              Creative Package
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground">{brandName}</p>
          {brief && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{brief}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          <Badge variant="outline" className="gap-1 text-[10px] h-5 px-1.5">
            <Sparkles className="w-2.5 h-2.5" />
            {imageCount}
          </Badge>
          <Badge variant="outline" className="gap-1 text-[10px] h-5 px-1.5">
            <Clock className="w-2.5 h-2.5" />
            {(latencyMs / 1000).toFixed(1)}s
          </Badge>
        </div>
      </div>

      {/* Brand Alignment Score */}
      {brandAlignment && (
        <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-md bg-emerald-500/5 border border-emerald-500/15">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${brandAlignment.score >= 75 ? 'text-emerald-400' : brandAlignment.score >= 50 ? 'text-amber-400' : 'text-red-400'}`} />
            <span className="text-xs font-medium text-foreground/80">Brand Alignment</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[
                { key: 'visual_identity', label: 'Visual' },
                { key: 'photography', label: 'Photo' },
                { key: 'color_system', label: 'Color' },
                { key: 'brand_voice', label: 'Voice' },
              ].map(({ key, label }) => {
                const active = brandAlignment.dimensions[key as keyof typeof brandAlignment.dimensions];
                return (
                  <span
                    key={key}
                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted/30 text-muted-foreground/40'}`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
            <span className={`text-sm font-bold tabular-nums ${brandAlignment.score >= 75 ? 'text-emerald-400' : brandAlignment.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {brandAlignment.score}%
            </span>
          </div>
        </div>
      )}

      {/* Deliverable sections */}
      <div className="space-y-6">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-2">
            {/* Section label */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 shrink-0">
                {group.name}
              </span>
              <div className="flex-1 h-px bg-purple-500/20" />
              <span className="text-[9px] text-muted-foreground/40 shrink-0">
                {groupIdx + 1}/{groups.length}
              </span>
            </div>

            {/* Copy block */}
            {group.text && (
              <div className="relative group/text">
                {group.text.trim().length <= 120 ? (
                  // Short text = headline — render large and bold
                  <div className="bg-muted/10 rounded-md px-3 py-3 border border-border/20 pr-10">
                    <p className="text-base font-bold text-foreground leading-tight tracking-tight">
                      {group.text.trim()}
                    </p>
                  </div>
                ) : group.text.trim().length <= 400 ? (
                  // Medium text = subheadline / hook
                  <div className="bg-muted/10 rounded-md px-3 py-2.5 border border-border/20 pr-10">
                    <p className="text-sm font-semibold text-foreground/90 leading-snug">
                      {group.text.trim()}
                    </p>
                  </div>
                ) : (
                  // Long text = body copy
                  <div className="bg-muted/20 rounded-md p-3 pr-10 border border-border/30">
                    <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap">
                      {group.text.trim()}
                    </p>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/text:opacity-100 transition-opacity"
                  onClick={() => handleCopyText(group.text!, group.index)}
                >
                  {copiedIndex === group.index ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            )}

            {/* Image */}
            {group.imageUrl && (
              <div className="relative group/image rounded-lg overflow-hidden border border-border/30 bg-muted/10">
                <img
                  src={group.imageUrl}
                  alt={group.name}
                  className="w-full h-auto block"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                      {group.name}
                    </span>
                    {(imageUrls[group.index] || group.imageUrl) && (
                      <div className="flex items-center gap-1.5">
                        {onLoadToCanvas && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 gap-1.5 text-xs bg-purple-600 hover:bg-purple-500"
                            onClick={() => {
                              onLoadToCanvas(imageUrls[group.index] || group.imageUrl!);
                              toast.success('Loaded to canvas');
                            }}
                          >
                            <MonitorPlay className="w-3 h-3" />
                            Use in Canvas
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => handleDownloadImage(
                            imageUrls[group.index] || group.imageUrl!,
                            group.name,
                            group.index
                          )}
                        >
                          <Download className="w-3 h-3" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-[10px] text-muted-foreground/40 text-right pt-2 border-t border-border/20">
        {model} · {(latencyMs / 1000).toFixed(1)}s
      </div>
    </div>
  );
}
