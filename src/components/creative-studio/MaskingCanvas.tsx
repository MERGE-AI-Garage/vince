// ABOUTME: Brush-based mask painting canvas for Creative Studio editing tools
// ABOUTME: Overlays on current image, outputs black/white mask for Imagen 3 editing API

import { useRef, useEffect, useState, useCallback } from 'react';
import { Paintbrush, Eraser, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MaskingCanvasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  existingMask?: string | null;
  onApply: (maskBase64: string) => void;
}

type BrushMode = 'paint' | 'erase';

export function MaskingCanvas({
  open,
  onOpenChange,
  imageUrl,
  brushSize,
  onBrushSizeChange,
  existingMask,
  onApply,
}: MaskingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushMode, setBrushMode] = useState<BrushMode>('paint');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const imageObjRef = useRef<HTMLImageElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Load image and set up canvas dimensions when dialog opens
  useEffect(() => {
    if (!open || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageObjRef.current = img;

      // Fit image within a reasonable dialog size (max 800x600)
      const maxWidth = 800;
      const maxHeight = 600;
      const scale = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1);
      const width = Math.round(img.naturalWidth * scale);
      const height = Math.round(img.naturalHeight * scale);

      setCanvasSize({ width, height });
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error('Failed to load image for masking');
    };
    img.src = imageUrl;

    return () => {
      setImageLoaded(false);
      imageObjRef.current = null;
    };
  }, [open, imageUrl]);

  // Initialize canvas once size is set
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || canvasSize.width === 0) return;

    const canvas = canvasRef.current;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Start with transparent canvas (no mask)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load existing mask if provided
    if (existingMask) {
      const maskImg = new Image();
      maskImg.onload = () => {
        ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
      };
      maskImg.src = `data:image/png;base64,${existingMask}`;
    }
  }, [imageLoaded, canvasSize, existingMask]);

  // Get canvas-relative coordinates from a mouse/touch event
  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Draw a brush stroke at the given point
  const drawAt = useCallback((x: number, y: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = brushMode === 'paint' ? 'source-over' : 'destination-out';
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [brushMode, brushSize]);

  // Draw a line between two points for smooth strokes
  const drawLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = brushMode === 'paint' ? 'source-over' : 'destination-out';
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, [brushMode, brushSize]);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;

    setIsDrawing(true);
    lastPointRef.current = point;
    drawAt(point.x, point.y);
  }, [getCanvasPoint, drawAt]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const point = getCanvasPoint(e);
    if (!point) return;

    if (lastPointRef.current) {
      drawLine(lastPointRef.current, point);
    } else {
      drawAt(point.x, point.y);
    }
    lastPointRef.current = point;
  }, [isDrawing, getCanvasPoint, drawAt, drawLine]);

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  const handleClear = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObjRef.current) return;

    // Generate the final mask at the original image resolution
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = imageObjRef.current.naturalWidth;
    outputCanvas.height = imageObjRef.current.naturalHeight;
    const outCtx = outputCanvas.getContext('2d');
    if (!outCtx) return;

    // Fill with black (preserve area)
    outCtx.fillStyle = 'black';
    outCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

    // Draw the mask strokes scaled to original resolution (white = edit area)
    outCtx.drawImage(canvas, 0, 0, outputCanvas.width, outputCanvas.height);

    const dataUrl = outputCanvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    onApply(base64);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-fit p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Paint Mask</DialogTitle>
          <DialogDescription>
            Paint white over areas you want to edit. Black areas will be preserved.
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex gap-1">
            <Button
              variant={brushMode === 'paint' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBrushMode('paint')}
              className="gap-1.5"
            >
              <Paintbrush className="w-3.5 h-3.5" />
              Paint
            </Button>
            <Button
              variant={brushMode === 'erase' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBrushMode('erase')}
              className="gap-1.5"
            >
              <Eraser className="w-3.5 h-3.5" />
              Erase
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Brush Size */}
          <div className="flex items-center gap-2 min-w-[160px]">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Size</span>
            <Slider
              value={[brushSize]}
              onValueChange={([v]) => onBrushSizeChange(v)}
              min={5}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-6 text-right">{brushSize}</span>
          </div>

          <div className="h-6 w-px bg-border" />

          <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </Button>
        </div>

        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="relative bg-[#1a1a1a] flex items-center justify-center"
          style={{ minHeight: 300 }}
        >
          {imageLoaded && imageObjRef.current ? (
            <div className="relative" style={{ width: canvasSize.width, height: canvasSize.height }}>
              {/* Background image */}
              <img
                src={imageUrl}
                alt="Source"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                draggable={false}
              />

              {/* Checkerboard pattern for mask visibility */}
              <div
                className="absolute inset-0 pointer-events-none opacity-0"
                style={{
                  backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)',
                  backgroundSize: '16px 16px',
                }}
              />

              {/* Mask canvas overlay — semi-transparent red tint for painted areas */}
              <canvas
                ref={canvasRef}
                className={cn(
                  'absolute inset-0 w-full h-full',
                  isDrawing ? 'cursor-none' : 'cursor-crosshair'
                )}
                style={{ mixBlendMode: 'normal', opacity: 0.5 }}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              />

              {/* Brush cursor preview */}
              {!isDrawing && (
                <div
                  className="absolute pointer-events-none border-2 border-white/70 rounded-full"
                  style={{
                    width: brushSize,
                    height: brushSize,
                    transform: 'translate(-50%, -50%)',
                    display: 'none', // Shown via JS on mousemove
                  }}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Loading image...
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            White = areas to edit, Black = preserved
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="gap-1.5">
              <X className="w-3.5 h-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply} className="gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Apply Mask
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
