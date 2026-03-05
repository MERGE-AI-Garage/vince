// ABOUTME: Panel for AI image upscaling with resolution preview
// ABOUTME: Single image upload with scaling factor selector and output resolution calculator

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpFromDot, ImagePlus, X, Info } from 'lucide-react';
import { useCreativeStudioStore } from '@/store/creative-studio-store';
import { cn } from '@/lib/utils';

interface UpscalePanelProps {
  onGenerate: (params: {
    generation_type: 'upscaling';
    input_image: string;
    upscale_factor: string;
    model_id: string;
  }) => void;
  isGenerating: boolean;
}

export function UpscalePanel({ onGenerate, isGenerating }: UpscalePanelProps) {
  const { currentImage } = useCreativeStudioStore();
  const [upscaleFactor, setUpscaleFactor] = useState<'x2' | 'x4'>('x2');
  const [inputDimensions, setInputDimensions] = useState<{ w: number; h: number } | null>(null);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setInputDimensions({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  const outputDimensions = inputDimensions
    ? {
        w: inputDimensions.w * (upscaleFactor === 'x2' ? 2 : 4),
        h: inputDimensions.h * (upscaleFactor === 'x2' ? 2 : 4),
      }
    : null;

  const megapixels = outputDimensions
    ? ((outputDimensions.w * outputDimensions.h) / 1_000_000).toFixed(1)
    : null;

  const handleUpscale = () => {
    if (!currentImage) return;
    onGenerate({
      generation_type: 'upscaling',
      input_image: currentImage,
      upscale_factor: upscaleFactor,
      model_id: 'imagen-4.0-upscale-preview',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ArrowUpFromDot className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Upscale Image</h3>
        <Badge variant="secondary" className="text-[9px]">$0.003</Badge>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg text-[11px] text-muted-foreground">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        <span>Upscale uses Imagen 4 to enhance resolution up to 17MP. No prompt needed — the AI preserves the original content.</span>
      </div>

      {/* Input preview */}
      <div className="space-y-1.5">
        <span className="text-xs text-muted-foreground">Source Image</span>
        {currentImage ? (
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
            <img
              src={currentImage}
              alt="Image to upscale"
              className="w-full h-full object-contain"
              onLoad={handleImageLoad}
            />
            {inputDimensions && (
              <Badge variant="secondary" className="absolute bottom-1.5 right-1.5 text-[9px]">
                {inputDimensions.w} x {inputDimensions.h}
              </Badge>
            )}
          </div>
        ) : (
          <div className="aspect-video bg-muted/50 rounded-lg border border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImagePlus className="w-6 h-6 opacity-50" />
            <span className="text-xs">Load an image to upscale</span>
            <span className="text-[10px] opacity-60">Drag from history or upload</span>
          </div>
        )}
      </div>

      {/* Factor selector */}
      <div className="space-y-1.5">
        <span className="text-xs text-muted-foreground">Scale Factor</span>
        <div className="grid grid-cols-2 gap-2">
          {(['x2', 'x4'] as const).map((factor) => (
            <button
              key={factor}
              onClick={() => setUpscaleFactor(factor)}
              className={cn(
                'py-2.5 rounded-lg border text-sm font-medium transition-all',
                upscaleFactor === factor
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-muted-foreground/50'
              )}
            >
              {factor === 'x2' ? '2x' : '4x'}
              {outputDimensions && (
                <div className="text-[10px] font-normal mt-0.5 opacity-70">
                  {factor === 'x2'
                    ? `${inputDimensions!.w * 2} x ${inputDimensions!.h * 2}`
                    : `${inputDimensions!.w * 4} x ${inputDimensions!.h * 4}`}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Output info */}
      {outputDimensions && (
        <div className="p-2.5 bg-muted/50 rounded-lg space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Output Resolution</span>
            <span className="font-medium">{outputDimensions.w} x {outputDimensions.h}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Megapixels</span>
            <span className="font-medium">{megapixels} MP</span>
          </div>
          {Number(megapixels) > 17 && (
            <div className="text-[10px] text-amber-500 mt-1">
              Output exceeds 17MP limit — image will be scaled to fit
            </div>
          )}
        </div>
      )}

      {/* Upscale button */}
      <Button
        onClick={handleUpscale}
        disabled={!currentImage || isGenerating}
        className="w-full gap-2"
      >
        <ArrowUpFromDot className="w-4 h-4" />
        Upscale {upscaleFactor === 'x2' ? '2x' : '4x'}
      </Button>
    </div>
  );
}
