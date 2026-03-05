// ABOUTME: Panel for virtual try-on using Imagen Virtual Try-On model
// ABOUTME: Upload person and garment images to visualize clothing on a model

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Shirt, Upload, X, Info, ArrowRight } from 'lucide-react';
import { AssetPicker } from './AssetPicker';

interface VirtualTryOnPanelProps {
  onGenerate: (params: {
    generation_type: 'virtual_try_on';
    person_image: string;
    garment_image: string;
    num_outputs: number;
    model_id: string;
  }) => void;
  isGenerating: boolean;
}

function ImageDropZone({
  label,
  image,
  onImageSet,
  onClear,
}: {
  label: string;
  image: string | null;
  onImageSet: (src: string) => void;
  onClear: () => void;
}) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (url) { onImageSet(url); return; }
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => onImageSet(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, [onImageSet]);

  return (
    <div className="space-y-1.5 flex-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {image ? (
        <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden border">
          <img src={image} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={onClear}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <AssetPicker
          mediaType="image"
          outputFormat="data-url"
          onSelect={onImageSet}
          side="right"
          trigger={
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="aspect-[3/4] bg-muted/50 rounded-lg border border-dashed flex flex-col items-center justify-center gap-1.5 text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-5 h-5 opacity-50" />
              <span className="text-[10px] text-center px-2">Drop or click</span>
            </div>
          }
        />
      )}
    </div>
  );
}

export function VirtualTryOnPanel({ onGenerate, isGenerating }: VirtualTryOnPanelProps) {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [sampleCount, setSampleCount] = useState(2);

  const handleGenerate = () => {
    if (!personImage || !garmentImage) return;
    onGenerate({
      generation_type: 'virtual_try_on',
      person_image: personImage,
      garment_image: garmentImage,
      num_outputs: sampleCount,
      model_id: 'virtual-try-on-001',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shirt className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Virtual Try-On</h3>
        <Badge variant="secondary" className="text-[9px]">$0.04</Badge>
      </div>

      <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg text-[11px] text-muted-foreground">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        <span>Upload a photo of a person and a garment image. AI will visualize the garment on the person.</span>
      </div>

      {/* Side-by-side image upload */}
      <div className="flex gap-3 items-start">
        <ImageDropZone
          label="Person"
          image={personImage}
          onImageSet={setPersonImage}
          onClear={() => setPersonImage(null)}
        />
        <div className="flex items-center pt-12">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <ImageDropZone
          label="Garment"
          image={garmentImage}
          onImageSet={setGarmentImage}
          onClear={() => setGarmentImage(null)}
        />
      </div>

      {/* Sample count */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Variations</span>
          <span className="text-xs font-medium">{sampleCount}</span>
        </div>
        <Slider
          value={[sampleCount]}
          onValueChange={([v]) => setSampleCount(v)}
          min={1}
          max={4}
          step={1}
        />
      </div>

      {/* Generate */}
      <Button
        onClick={handleGenerate}
        disabled={!personImage || !garmentImage || isGenerating}
        className="w-full gap-2"
      >
        <Shirt className="w-4 h-4" />
        Generate Try-On
      </Button>
    </div>
  );
}
