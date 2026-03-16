// ABOUTME: Displays interleaved creative package results (text + images).
// ABOUTME: Renders alternating copy blocks and generated images from Gemini interleaved output.

import { useState, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, Check, Clock, Layers, Sparkles, ShieldCheck, MonitorPlay, Info } from 'lucide-react';
import { toast } from 'sonner';

export interface PackagePart {
  type: 'text' | 'image';
  content?: string;
  image_base64?: string;
  mime_type?: string;
  image_url?: string;
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
  onImageInfo?: (index: number, name: string, imageUrl: string) => void;
  onIterate?: (deliverableName: string, imageUrl: string) => void;
}

function cleanCopyText(text: string): string {
  return text
    // Strip markdown headings (###, ##, #) at line start
    .replace(/^#{1,6}\s*/gm, '')
    // Strip Gemini deliverable section markers like "*** Deliverable 2: LinkedIn Post"
    .replace(/^\*{2,3}\s*Deliverable\s*\d+[^*\n]*\*{0,3}\s*\n?/im, '')
    // Strip leading numbered section labels like "1. Hero Banner\n"
    .replace(/^\d+\.\s+[A-Z][^\n]*\n/m, '')
    // Strip "Here is the complete creative package for... \n" intro sentences
    .replace(/^Here is the complete creative package[^\n]*\n?/im, '')
    // Strip leading **Copy:** label (redundant)
    .replace(/^\*{1,2}Copy:\*{1,2}\s*/i, '')
    // Strip trailing **Image:** labels
    .replace(/\s*\*{1,2}Image:\*{1,2}\s*$/i, '')
    .trim();
}

// Renders text with **bold** markdown and structured **Label:** field detection
function renderCopyText(text: string): React.ReactNode {
  // Check if text contains structured **Label:** fields
  const hasStructuredFields = /\*{1,2}(Headline|Subheadline|CTA|Caption|Button|Body|Tagline)[^*]*\*{1,2}:/i.test(text);

  if (hasStructuredFields) {
    // Parse into label/value pairs
    const lines = text.split(/(?=\*{1,2}(?:Headline|Subheadline|CTA|Caption|Button|Body|Tagline)[^*]*\*{1,2}:)/i);
    return (
      <div className="space-y-2">
        {lines.map((line, i) => {
          const fieldMatch = line.match(/^\*{1,2}([\w\s]+)\*{1,2}:\s*([\s\S]*)/i);
          if (fieldMatch) {
            const label = fieldMatch[1].trim();
            const value = fieldMatch[2].trim().replace(/\*{1,2}/g, '');
            const isHeadline = /headline/i.test(label);
            const isCTA = /cta|button/i.test(label);
            return (
              <div key={i}>
                <span className="text-[9px] font-bold uppercase tracking-widest text-purple-400/60 block mb-0.5">{label}</span>
                <p className={isHeadline ? 'text-sm font-bold text-foreground leading-tight' : isCTA ? 'text-xs font-semibold text-purple-300' : 'text-xs text-foreground/85 leading-relaxed'}>
                  {value}
                </p>
              </div>
            );
          }
          // Plain text before the first field
          const stripped = line.replace(/\*{1,2}/g, '').trim();
          return stripped ? <p key={i} className="text-xs text-foreground/85 leading-relaxed">{stripped}</p> : null;
        })}
      </div>
    );
  }

  // Plain copy — render bold spans inline, preserve line breaks
  const parts = text.split(/(\*{1,2}[^*]+\*{1,2})/g);
  return (
    <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        const bold = part.match(/^\*{1,2}([^*]+)\*{1,2}$/);
        return bold ? <strong key={i} className="font-semibold text-foreground/95">{bold[1]}</strong> : <Fragment key={i}>{part}</Fragment>;
      })}
    </p>
  );
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
      pendingText = cleanCopyText(part.content);
    } else if (part.type === 'image') {
      const imageUrl = part.content || part.image_url || (part.image_base64
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
  onImageInfo,
  onIterate,
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

  const handleDownloadImage = async (url: string, name: string, index: number) => {
    // On iOS/Capacitor, link.click() navigates the WebView away — use share sheet instead
    if ('Capacitor' in window && navigator.share) {
      try {
        await navigator.share({ url, title: `${brandName} — ${name}` });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return; // user cancelled
      }
    }
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
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{brief}</p>
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
      {brandAlignment && (() => {
        const { score, dimensions } = brandAlignment;
        const tier = score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low';
        const color = tier === 'high' ? 'purple' : tier === 'mid' ? 'amber' : 'red';
        const containerCls = tier === 'high'
          ? 'bg-purple-500/5 border-purple-500/20'
          : tier === 'mid'
          ? 'bg-amber-500/5 border-amber-500/20'
          : 'bg-red-500/5 border-red-500/20';
        const iconCls = tier === 'high' ? 'text-purple-400' : tier === 'mid' ? 'text-amber-400' : 'text-red-400';
        const scoreCls = iconCls;
        const barCls = tier === 'high' ? 'bg-purple-400' : tier === 'mid' ? 'bg-amber-400' : 'bg-red-400';
        const pillActiveCls = tier === 'high'
          ? 'bg-purple-500/15 text-purple-400'
          : tier === 'mid'
          ? 'bg-amber-500/15 text-amber-400'
          : 'bg-red-500/15 text-red-400';

        return (
          <div className={`rounded-md border px-3 pt-2 pb-2 space-y-2 ${containerCls}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${iconCls}`} />
                <span className="text-xs font-medium text-foreground/80 truncate">Brand Alignment</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 flex-nowrap">
                  {[
                    { key: 'visual_identity', label: 'Visual' },
                    { key: 'photography', label: 'Photo' },
                    { key: 'color_system', label: 'Color' },
                    { key: 'brand_voice', label: 'Voice' },
                  ].map(({ key, label }) => {
                    const active = dimensions[key as keyof typeof dimensions];
                    return (
                      <span
                        key={key}
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${active ? pillActiveCls : 'bg-muted/20 text-muted-foreground/30 line-through'}`}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
                <span className={`text-sm font-bold tabular-nums ${scoreCls}`}>
                  {score}%
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-0.5 w-full bg-muted/20 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barCls}`} style={{ width: `${score}%` }} />
            </div>
            {/* Low score nudge */}
            {score < 50 && (
              <p className="text-[10px] text-muted-foreground/50">
                Run brand analysis to improve alignment score
              </p>
            )}
          </div>
        );
      })()}

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
                <div className="bg-muted/10 rounded-md p-3 pr-10 border border-border/20">
                  {renderCopyText(group.text)}
                </div>
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
                        {onImageInfo && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0"
                            title="Image info"
                            onClick={() => onImageInfo(group.index, group.name, imageUrls[group.index] || group.imageUrl!)}
                          >
                            <Info className="w-3 h-3" />
                          </Button>
                        )}
                        {onIterate && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1.5 text-xs"
                            onClick={() => onIterate(group.name, imageUrls[group.index] || group.imageUrl!)}
                          >
                            Iterate
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
