// ABOUTME: Horizontal strip of generated output samples below the canvas
// ABOUTME: Displays outputs from DB-backed generation data with view/download/lightbox actions

import { useState } from 'react';
import { Download, Eye, Maximize2, CheckCircle } from 'lucide-react';
import type { GenerationWithDetails } from '@/types/creative-studio';
import { ImageLightbox } from './ImageLightbox';
import { cn } from '@/lib/utils';

interface SamplesPanelProps {
  generation: GenerationWithDetails | null;
  onLoadToCanvas?: (url: string) => void;
}

export function SamplesPanel({ generation, onLoadToCanvas }: SamplesPanelProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [loadedIndex, setLoadedIndex] = useState<number | null>(null);

  const isVideo = generation?.generation_type?.includes('video') ?? false;

  const convertGcsUri = (uri: string) => {
    if (uri.startsWith('gs://')) {
      return uri.replace('gs://', 'https://storage.googleapis.com/');
    }
    return uri;
  };

  const samples = (generation?.output_urls || []).map(convertGcsUri);

  const handleSelectSample = (url: string, index: number) => {
    onLoadToCanvas?.(url);
    setLoadedIndex(index);
  };

  const handleDownloadSample = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `sample-${index + 1}.${isVideo ? 'mp4' : 'png'}`;
    link.click();
  };

  const handleViewFullscreen = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (samples.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] text-muted-foreground font-medium">
          {samples.length} {isVideo ? 'video' : 'sample'}{samples.length > 1 ? 's' : ''}
        </span>
        <span className="text-[10px] text-muted-foreground">
          Click to load — hover for actions
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {samples.map((url, i) => (
          <div
            key={i}
            onClick={() => handleSelectSample(url, i)}
            className={cn(
              'relative shrink-0 w-20 h-20 rounded-lg border overflow-hidden cursor-pointer group transition-all',
              loadedIndex === i
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border/50 hover:border-primary/50'
            )}
          >
            {isVideo ? (
              <video
                src={url}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
                onError={(e) => {
                  console.error('Video load error:', {
                    url: url.substring(0, 100) + '...',
                    error: e.currentTarget.error,
                  });
                }}
              />
            ) : (
              <img
                src={url}
                alt={`Sample ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Image load error:', {
                    url: url.substring(0, 100) + '...',
                  });
                }}
              />
            )}

            {/* Sample number */}
            <div className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-full text-[10px] text-white font-medium">
              {loadedIndex === i ? (
                <CheckCircle className="w-3 h-3 text-green-400" />
              ) : (
                i + 1
              )}
            </div>

            {/* Hover actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleViewFullscreen(i); }}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-md text-white transition-colors"
                title="View fullscreen"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleSelectSample(url, i); }}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-md text-white transition-colors"
                title="Load to canvas"
              >
                <Eye className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDownloadSample(url, i); }}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-md text-white transition-colors"
                title="Download"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <ImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        urls={samples}
        currentIndex={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onLoadToCanvas={onLoadToCanvas}
        isVideo={isVideo}
      />
    </div>
  );
}
