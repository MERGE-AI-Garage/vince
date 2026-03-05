// ABOUTME: Fullscreen lightbox for previewing Creative Studio generated images/videos
// ABOUTME: Supports keyboard navigation, download, copy URL, and load-to-canvas

import { useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  X, ChevronLeft, ChevronRight, Download, Copy, ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  urls: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onLoadToCanvas?: (url: string) => void;
  isVideo?: boolean;
}

export function ImageLightbox({
  open,
  onOpenChange,
  urls,
  currentIndex,
  onIndexChange,
  onLoadToCanvas,
  isVideo = false,
}: ImageLightboxProps) {
  const currentUrl = urls[currentIndex];
  const hasNext = currentIndex < urls.length - 1;
  const hasPrev = currentIndex > 0;

  const goNext = useCallback(() => {
    if (hasNext) onIndexChange(currentIndex + 1);
  }, [hasNext, currentIndex, onIndexChange]);

  const goPrev = useCallback(() => {
    if (hasPrev) onIndexChange(currentIndex - 1);
  }, [hasPrev, currentIndex, onIndexChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          goNext();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
        case 'Escape':
          onOpenChange(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goNext, goPrev, onOpenChange]);

  const handleDownload = () => {
    if (!currentUrl) return;
    const link = document.createElement('a');
    link.href = currentUrl;
    link.download = `sample-${currentIndex + 1}.${isVideo ? 'mp4' : 'png'}`;
    link.click();
  };

  const handleCopyUrl = async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast.success('URL copied to clipboard');
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const handleLoadToCanvas = () => {
    if (!currentUrl || !onLoadToCanvas) return;
    onLoadToCanvas(currentUrl);
    onOpenChange(false);
    toast.success('Loaded to canvas');
  };

  if (!currentUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/95 border-none overflow-hidden">
        {/* Top Action Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/60 to-transparent">
          <span className="text-sm text-white/80">
            {currentIndex + 1} / {urls.length}
          </span>
          <div className="flex items-center gap-1">
            {onLoadToCanvas && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadToCanvas}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <ImageIcon className="w-4 h-4 mr-1.5" />
                Load to Canvas
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyUrl}
              className="text-white/80 hover:text-white hover:bg-white/10"
              title="Copy URL"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-white/80 hover:text-white hover:bg-white/10"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white/80 hover:text-white hover:bg-white/10"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Arrows */}
        {hasPrev && (
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Image/Video Display */}
        <div className="flex items-center justify-center w-full h-[85vh]">
          {isVideo ? (
            <video
              src={currentUrl}
              className="max-w-full max-h-full object-contain"
              controls
              autoPlay
              loop
              playsInline
            />
          ) : (
            <img
              src={currentUrl}
              alt={`Sample ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
