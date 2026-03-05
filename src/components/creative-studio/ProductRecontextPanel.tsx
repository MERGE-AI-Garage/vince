// ABOUTME: Panel for AI product recontextualization
// ABOUTME: Upload product image and describe new scene context for Imagen Product Recontext

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Package, X, Info, Upload, Sparkles } from 'lucide-react';
import { AssetPicker } from './AssetPicker';

interface ProductRecontextPanelProps {
  onGenerate: (params: {
    generation_type: 'product_recontext';
    input_image: string;
    prompt: string;
    num_outputs: number;
    model_id: string;
  }) => void;
  isGenerating: boolean;
}

export function ProductRecontextPanel({ onGenerate, isGenerating }: ProductRecontextPanelProps) {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [scenePrompt, setScenePrompt] = useState('');
  const [sampleCount, setSampleCount] = useState(2);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (url) {
      setProductImage(url);
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProductImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleGenerate = () => {
    if (!productImage || !scenePrompt.trim()) return;
    onGenerate({
      generation_type: 'product_recontext',
      input_image: productImage,
      prompt: scenePrompt,
      num_outputs: sampleCount,
      model_id: 'imagen-product-recontext-preview-06-30',
    });
  };

  const sceneSuggestions = [
    { label: 'Beach Setup', prompt: 'On a sandy beach with ocean waves in the background, golden hour lighting' },
    { label: 'Modern Kitchen', prompt: 'On a clean marble kitchen counter with natural window light' },
    { label: 'Studio White', prompt: 'On a pure white background with professional studio lighting' },
    { label: 'Outdoor Café', prompt: 'On an outdoor café table with blurred city street in the background' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Product Shot</h3>
        <Badge variant="secondary" className="text-[9px]">$0.04</Badge>
      </div>

      <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg text-[11px] text-muted-foreground">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        <span>Place your product in any scene. Upload the product, describe the new context, and AI generates the composite. Output is 1024x1024.</span>
      </div>

      {/* Product image upload */}
      <div className="space-y-1.5">
        <span className="text-xs text-muted-foreground">Product Image</span>
        {productImage ? (
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden border max-w-[200px]">
            <img
              src={productImage}
              alt="Product"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setProductImage(null)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <AssetPicker
            mediaType="image"
            outputFormat="data-url"
            onSelect={setProductImage}
            side="right"
            trigger={
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="aspect-square max-w-[200px] bg-muted/50 rounded-lg border border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="w-6 h-6 opacity-50" />
                <span className="text-xs text-center px-3">Drop product image or click to upload</span>
              </div>
            }
          />
        )}
      </div>

      {/* Scene description */}
      <div className="space-y-1.5">
        <span className="text-xs text-muted-foreground">Scene Description</span>
        <textarea
          value={scenePrompt}
          onChange={(e) => setScenePrompt(e.target.value)}
          placeholder="Describe the scene for your product..."
          className="w-full h-16 px-3 py-2 bg-background border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground text-sm"
        />
      </div>

      {/* Quick scene suggestions */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" />
          Quick Scenes
        </span>
        <div className="flex flex-wrap gap-1.5">
          {sceneSuggestions.map((s) => (
            <button
              key={s.label}
              onClick={() => setScenePrompt(s.prompt)}
              className="text-[10px] px-2 py-1 rounded-full border hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
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
        disabled={!productImage || !scenePrompt.trim() || isGenerating}
        className="w-full gap-2"
      >
        <Package className="w-4 h-4" />
        Generate Product Shot
      </Button>
    </div>
  );
}
