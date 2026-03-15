// ABOUTME: Main editor canvas for Creative Studio
// ABOUTME: Displays current image/video with upload, drag-and-drop, clear, and frame capture

import { Upload, X, Camera } from 'lucide-react';
import { useCreativeStudioStore } from '@/store/creative-studio-store';
import { useCreativeStudioEditStore } from '@/store/creative-studio-edit-store';
import { Button } from '@/components/ui/button';
import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { stripBase64Prefix } from '@/lib/image-utils';
import { WelcomeScreen } from './WelcomeScreen';
import type { CreativeStudioBrand } from '@/types/creative-studio';
import type { BrandStats } from '@/hooks/useCreativeStudioBrandIntelligence';

interface EditorCanvasProps {
  selectedBrand?: CreativeStudioBrand;
  brandStats?: BrandStats;
  onOpenBrandDNA?: () => void;
  onOpenArtDirection?: () => void;
  onOpenPromptLibrary?: () => void;
  onOpenBrandAgent?: () => void;
  onOpenGuidelines?: () => void;
  onQuickPromptClick?: (prompt: string) => void;
  onDemoClick?: () => void;
}

export function EditorCanvas({
  selectedBrand,
  brandStats,
  onOpenBrandDNA,
  onOpenArtDirection,
  onOpenPromptLibrary,
  onOpenBrandAgent,
  onOpenGuidelines,
  onQuickPromptClick,
  onDemoClick,
}: EditorCanvasProps) {
  const {
    currentImage,
    setCurrentImage,
    history,
    currentHistoryIndex,
    updateVideoParams,
  } = useCreativeStudioStore();

  const {
    activeTool,
    expansionDirection,
    setCurrentMask,
    setPaddedInputImage,
  } = useCreativeStudioEditStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const currentRecord = currentHistoryIndex >= 0 ? history[currentHistoryIndex] : null;

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const loadImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported');
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      const dataUrl = `data:${file.type};base64,${base64}`;
      setCurrentImage(dataUrl);
      toast.success('Image loaded to canvas');
    } catch (error) {
      console.error('Failed to load image:', error);
      toast.error('Failed to load image');
    }
  }, [setCurrentImage]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await loadImageFile(file);
  };

  const handleClear = () => {
    setCurrentImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper: detect if currentImage points to a video
  const isVideoUrl = (url: string) => {
    if (!url) return false;
    return url.startsWith('data:video') || /\.mp4(\?|#|$)/i.test(url) || url.includes('video');
  };

  // Drag-and-drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if we're leaving the container (not entering a child)
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // Check for files (OS drag-and-drop)
    if (e.dataTransfer.files.length > 0) {
      await loadImageFile(e.dataTransfer.files[0]);
      return;
    }

    // Check for URL (from history items or media library)
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (url && (url.startsWith('http') || url.startsWith('data:'))) {
      setCurrentImage(url);
      toast.success('Image loaded to canvas');
    }
  }, [loadImageFile, setCurrentImage]);

  // Generate expansion mask automatically when direction changes
  useEffect(() => {
    if (activeTool === 'canvas-expand' && expansionDirection && currentImage && !isVideoUrl(currentImage)) {
      generateExpansionMask();
    }
  }, [activeTool, expansionDirection, currentImage]);

  const generateExpansionMask = async () => {
    if (!currentImage) return;

    // Fetch image as blob to avoid tainted canvas from cross-origin img elements
    let bitmap: ImageBitmap;
    try {
      if (currentImage.startsWith('data:')) {
        const res = await fetch(currentImage);
        const blob = await res.blob();
        bitmap = await createImageBitmap(blob);
      } else {
        const res = await fetch(currentImage, { mode: 'cors' });
        const blob = await res.blob();
        bitmap = await createImageBitmap(blob);
      }
    } catch (e) {
      console.error('Failed to load image for expansion:', e);
      toast.error('Could not load image for expansion');
      return;
    }

    const originalWidth = bitmap.width;
    const originalHeight = bitmap.height;

    // Calculate expanded dimensions (50% expansion)
    const expansionAmount = 0.5;
    let newWidth = originalWidth;
    let newHeight = originalHeight;
    let offsetX = 0;
    let offsetY = 0;

    switch (expansionDirection) {
      case 'left':
        newWidth = originalWidth * (1 + expansionAmount);
        offsetX = originalWidth * expansionAmount;
        break;
      case 'right':
        newWidth = originalWidth * (1 + expansionAmount);
        offsetX = 0;
        break;
      case 'top':
        newHeight = originalHeight * (1 + expansionAmount);
        offsetY = originalHeight * expansionAmount;
        break;
      case 'bottom':
        newHeight = originalHeight * (1 + expansionAmount);
        offsetY = 0;
        break;
    }

    // Create mask canvas (white = generate, black = preserve)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = newWidth;
    maskCanvas.height = newHeight;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    maskCtx.fillStyle = 'white';
    maskCtx.fillRect(0, 0, newWidth, newHeight);
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(offsetX, offsetY, originalWidth, originalHeight);

    const maskBase64 = maskCanvas.toDataURL('image/png').split(',')[1];
    setCurrentMask(maskBase64);

    // Create padded input image at expanded dimensions
    const paddedCanvas = document.createElement('canvas');
    paddedCanvas.width = newWidth;
    paddedCanvas.height = newHeight;
    const paddedCtx = paddedCanvas.getContext('2d');
    if (!paddedCtx) return;

    paddedCtx.fillStyle = '#808080';
    paddedCtx.fillRect(0, 0, newWidth, newHeight);
    paddedCtx.drawImage(bitmap, offsetX, offsetY, originalWidth, originalHeight);

    const paddedBase64 = paddedCanvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    setPaddedInputImage(paddedBase64);
    bitmap.close();

    toast.success(`Expansion mask created for ${expansionDirection} expansion`);
  };

  // Capture current frame from video
  const handleCaptureFrame = () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error('Failed to create canvas context');
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameDataUrl = canvas.toDataURL('image/png');

      updateVideoParams({
        startingFrame: stripBase64Prefix(frameDataUrl)
      });

      toast.success('Frame captured! Switch to "Image to Video" mode to use it as your starting image.');
    } catch (error) {
      console.error('Failed to capture frame:', error);
      toast.error('Failed to capture frame from video');
    }
  };

  // Calculate expansion preview styles
  const getExpansionStyles = () => {
    if (activeTool !== 'canvas-expand' || !expansionDirection || !imageRef.current) return null;

    const expansionAmount = 50;

    switch (expansionDirection) {
      case 'left':
        return { paddingLeft: `${expansionAmount}%` };
      case 'right':
        return { paddingRight: `${expansionAmount}%` };
      case 'top':
        return { paddingTop: `${expansionAmount}%` };
      case 'bottom':
        return { paddingBottom: `${expansionAmount}%` };
      default:
        return null;
    }
  };

  const expansionStyles = getExpansionStyles();
  const showExpansionPreview = activeTool === 'canvas-expand' && expansionDirection && currentImage && !isVideoUrl(currentImage);

  return (
    <div
      className={cn(
        'flex-1 rounded-xl border flex items-center justify-center relative transition-all duration-300',
        currentImage ? 'overflow-hidden' : 'overflow-y-auto',
        isDragOver
          ? 'border-primary bg-primary/5 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]'
          : currentImage
            ? 'border-border/50 bg-black/5'
            : 'border-[hsl(var(--cs-border-subtle))]'
      )}
      style={!currentImage && !isDragOver ? { backgroundColor: 'hsl(var(--cs-surface-0))' } : undefined}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-primary/10 backdrop-blur-sm">
          <div className="text-center space-y-2">
            <Upload className="w-12 h-12 mx-auto text-primary animate-bounce" />
            <p className="text-sm font-medium text-primary">Drop image here</p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
      {currentImage ? (
        <motion.div
          key="canvas-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center w-full h-full relative"
        >
          {isVideoUrl(currentImage) ? (
            <>
              <video
                ref={videoRef}
                src={currentImage}
                crossOrigin="anonymous"
                className="max-w-full max-h-full object-contain"
                controls
                playsInline
              >
                <source src={currentImage} type="video/mp4" />
              </video>

              {/* Capture Frame Button */}
              <Button
                size="default"
                variant="default"
                className="absolute bottom-4 right-4 shadow-lg"
                onClick={handleCaptureFrame}
                title="Capture current frame as starting image"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture This Frame
              </Button>
            </>
          ) : (
            <div
              className={`flex items-center justify-center transition-all duration-300 ${
                showExpansionPreview ? 'bg-muted/20' : ''
              }`}
              style={expansionStyles || undefined}
            >
              <div className="relative">
                <img
                  ref={imageRef}
                  src={currentImage}
                  alt="Current"
                  crossOrigin="anonymous"
                  className="max-w-full max-h-full object-contain"
                />

                {/* Expansion Preview Overlay */}
                {showExpansionPreview && (
                  <div className="absolute inset-0 pointer-events-none">
                    {expansionDirection === 'left' && (
                      <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-primary/10 border-l-2 border-primary border-dashed" />
                    )}
                    {expansionDirection === 'right' && (
                      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-primary/10 border-r-2 border-primary border-dashed" />
                    )}
                    {expansionDirection === 'top' && (
                      <div className="absolute left-0 top-0 right-0 h-1/3 bg-primary/10 border-t-2 border-primary border-dashed" />
                    )}
                    {expansionDirection === 'bottom' && (
                      <div className="absolute left-0 bottom-0 right-0 h-1/3 bg-primary/10 border-b-2 border-primary border-dashed" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clear Button */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-3 right-3 h-7 px-2 bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
            onClick={handleClear}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="canvas-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full relative"
        >
          <WelcomeScreen
            brand={selectedBrand}
            brandStats={brandStats}
            onUploadClick={() => fileInputRef.current?.click()}
            onOpenBrandDNA={onOpenBrandDNA}
            onOpenArtDirection={onOpenArtDirection}
            onOpenPromptLibrary={onOpenPromptLibrary}
            onOpenBrandAgent={onOpenBrandAgent}
            onOpenGuidelines={onOpenGuidelines}
            onQuickPromptClick={onQuickPromptClick}
            onDemoClick={onDemoClick}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
