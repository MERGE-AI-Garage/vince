// ABOUTME: Displays interleaved creative package results (text + images).
// ABOUTME: Renders alternating copy blocks and generated images from Gemini interleaved output.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Copy, Check, Clock, Sparkles, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export interface PackagePart {
  type: 'text' | 'image';
  content?: string;
  image_base64?: string;
  mime_type?: string;
}

interface CreativePackageDisplayProps {
  parts: PackagePart[];
  imageUrls: string[];
  latencyMs: number;
  brandName: string;
  model: string;
}

export function CreativePackageDisplay({
  parts,
  imageUrls,
  latencyMs,
  brandName,
  model,
}: CreativePackageDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const imageCount = parts.filter(p => p.type === 'image').length;
  const textCount = parts.filter(p => p.type === 'text').length;

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Copied to clipboard');
  };

  const handleDownloadImage = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${brandName.toLowerCase().replace(/\s+/g, '-')}-package-${index + 1}.png`;
    link.click();
  };

  let imageIndex = 0;

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {brandName}
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          {imageCount} image{imageCount !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {(latencyMs / 1000).toFixed(1)}s
        </Badge>
        <span className="text-xs text-muted-foreground ml-auto">{model}</span>
      </div>

      {/* Interleaved content */}
      <div className="space-y-4">
        {parts.map((part, i) => {
          if (part.type === 'text' && part.content) {
            return (
              <Card key={i} className="bg-muted/30 border-border/50">
                <CardContent className="p-4 relative group">
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {part.content}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopyText(part.content!, i)}
                  >
                    {copiedIndex === i ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          }

          if (part.type === 'image') {
            const currentImageIndex = imageIndex++;
            const imageUrl = part.content || (part.image_base64
              ? `data:${part.mime_type || 'image/png'};base64,${part.image_base64}`
              : null);

            if (!imageUrl) return null;

            return (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-border/50">
                <img
                  src={imageUrl}
                  alt={`Creative package deliverable ${currentImageIndex + 1}`}
                  className="w-full h-auto"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    {imageUrls[currentImageIndex] && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 gap-1.5"
                        onClick={() => handleDownloadImage(imageUrls[currentImageIndex], currentImageIndex)}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Summary footer */}
      <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/30">
        {textCount} copy block{textCount !== 1 ? 's' : ''} + {imageCount} image{imageCount !== 1 ? 's' : ''} generated in {(latencyMs / 1000).toFixed(1)}s
      </div>
    </div>
  );
}
