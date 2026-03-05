// ABOUTME: Reference image upload area for Gemini multi-image fusion
// ABOUTME: Drag-and-drop staging with per-image resolution controls, history picker, and token cost preview

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Images, X, Upload, Info, History, ImageIcon, Loader2, Search, FolderOpen } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useMyGenerations } from '@/hooks/useCreativeStudioGenerations';
import { useMediaLibraryAssets } from '@/hooks/useMediaLibraryAssets';
import { convertGcsUri, fetchImageAsBase64 } from '@/lib/image-utils';
import type { ReferenceIntent } from '@/types/creative-studio';
import { BrandReferencePicker } from './BrandReferencePicker';

export type { ReferenceIntent } from '@/types/creative-studio';

export interface StagedImage {
  id: string;
  src: string;
  mediaResolution: 'low' | 'medium' | 'high';
  referenceIntent: ReferenceIntent;
  referenceType?: 'product' | 'character' | 'style' | 'environment';
  sourceCollection?: string;
}

interface MultiImageStagingAreaProps {
  images: StagedImage[];
  onChange: (images: StagedImage[]) => void;
  maxImages: number;
  modelName?: string;
  brandId?: string;
}

const RESOLUTION_TOKENS: Record<string, number> = {
  low: 280,
  medium: 560,
  high: 1120,
};

export function MultiImageStagingArea({ images, onChange, maxImages, modelName, brandId }: MultiImageStagingAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [brandRefsOpen, setBrandRefsOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [loadingUrls, setLoadingUrls] = useState<Set<string>>(new Set());

  const { data: generations } = useMyGenerations(30);
  const { data: mediaImages } = useMediaLibraryAssets('image', 50);

  const totalTokens = images.reduce((sum, img) => sum + RESOLUTION_TOKENS[img.mediaResolution], 0);
  const slotsRemaining = maxImages - images.length;

  const addImages = useCallback((srcs: string[]) => {
    const toAdd = srcs.slice(0, maxImages - images.length);
    if (toAdd.length === 0) return;
    onChange([
      ...images,
      ...toAdd.map(src => ({
        id: crypto.randomUUID(),
        src,
        mediaResolution: 'medium' as const,
        referenceIntent: 'subject' as const,
      })),
    ]);
  }, [images, maxImages, onChange]);

  const removeImage = useCallback((id: string) => {
    onChange(images.filter((img) => img.id !== id));
  }, [images, onChange]);

  const updateResolution = useCallback((id: string, res: 'low' | 'medium' | 'high') => {
    onChange(images.map((img) => img.id === id ? { ...img, mediaResolution: res } : img));
  }, [images, onChange]);

  const updateIntent = useCallback((id: string, intent: ReferenceIntent) => {
    onChange(images.map((img) => img.id === id ? { ...img, referenceIntent: intent } : img));
  }, [images, onChange]);

  /** Add pre-built StagedImage objects from brand reference collections */
  const addCollectionImages = useCallback((newImages: StagedImage[]) => {
    const toAdd = newImages.slice(0, maxImages - images.length);
    if (toAdd.length === 0) return;
    onChange([...images, ...toAdd]);
  }, [images, maxImages, onChange]);

  /** Add an image from a URL, converting to base64 first */
  const addImageFromUrl = useCallback(async (url: string) => {
    setLoadingUrls(prev => new Set(prev).add(url));
    try {
      const base64 = await fetchImageAsBase64(url);
      addImages([base64]);
    } catch (err) {
      console.error('Failed to fetch image:', err);
      // Fallback: add URL directly (edge function has URL fallback)
      addImages([url]);
    } finally {
      setLoadingUrls(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  }, [addImages]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (images.length >= maxImages) return;

    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (url && (url.startsWith('http') || url.startsWith('data:'))) {
      if (url.startsWith('data:')) {
        addImages([url]);
      } else {
        addImageFromUrl(url);
      }
      return;
    }

    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    const filesToProcess = files.slice(0, maxImages - images.length);
    if (filesToProcess.length === 0) return;

    const results: string[] = [];
    let loaded = 0;
    for (const file of filesToProcess) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        results.push(ev.target?.result as string);
        loaded++;
        if (loaded === filesToProcess.length) {
          addImages(results);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [images, maxImages, addImages, addImageFromUrl]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const filesToProcess = files.slice(0, maxImages - images.length);
    if (filesToProcess.length === 0) return;

    const results: string[] = [];
    let loaded = 0;
    for (const file of filesToProcess) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        results.push(ev.target?.result as string);
        loaded++;
        if (loaded === filesToProcess.length) {
          addImages(results);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [maxImages, images.length, addImages]);

  // Filter generations to completed images with output URLs
  const imageGenerations = (generations || []).filter(
    g => g.status === 'completed' && g.output_urls && g.output_urls.length > 0 && !g.generation_type.includes('video')
  );

  const handleHistorySelect = (url: string) => {
    const publicUrl = convertGcsUri(url);
    addImageFromUrl(publicUrl);
    if (slotsRemaining <= 1) {
      setHistoryOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Images className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium">Reference Images</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[9px]">
            {images.length}/{maxImages}
          </Badge>
          {totalTokens > 0 && (
            <Badge variant="outline" className="text-[9px]">
              ~{totalTokens} tokens
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <span>Up to {maxImages} reference images. Set each image's role:</span>
          <div className="grid grid-cols-3 gap-x-2 text-[9px]">
            <span><strong>Subject</strong> — what to depict</span>
            <span><strong>Style</strong> — visual treatment</span>
            <span><strong>Structure</strong> — composition</span>
          </div>
        </div>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {images.map((img) => (
          <div key={img.id} className="relative group">
            <div className="aspect-square bg-muted rounded-md overflow-hidden border">
              <img src={img.src} alt="Reference" className="w-full h-full object-cover" />
            </div>

            {/* Collection badge */}
            {img.sourceCollection && (
              <div className="absolute top-0.5 right-6 text-[7px] bg-primary/80 text-primary-foreground px-1 rounded-sm truncate max-w-[60px]">
                {img.sourceCollection}
              </div>
            )}

            {/* Remove button */}
            <button
              onClick={() => removeImage(img.id)}
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="w-2.5 h-2.5" />
            </button>

            {/* Intent selector */}
            <div className="absolute top-0.5 left-0.5">
              <Select
                value={img.referenceIntent}
                onValueChange={(v) => updateIntent(img.id, v as ReferenceIntent)}
              >
                <SelectTrigger className="h-5 text-[8px] bg-black/60 text-white border-0 rounded-sm px-1 w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subject" className="text-[10px]">
                    <div>Subject <span className="text-muted-foreground">— what to depict</span></div>
                  </SelectItem>
                  <SelectItem value="style" className="text-[10px]">
                    <div>Style <span className="text-muted-foreground">— visual treatment</span></div>
                  </SelectItem>
                  <SelectItem value="structure" className="text-[10px]">
                    <div>Structure <span className="text-muted-foreground">— composition</span></div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resolution selector */}
            <div className="absolute bottom-0.5 left-0.5 right-0.5">
              <Select
                value={img.mediaResolution}
                onValueChange={(v) => updateResolution(img.id, v as 'low' | 'medium' | 'high')}
              >
                <SelectTrigger className="h-5 text-[8px] bg-black/60 text-white border-0 rounded-sm px-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-[10px]">Low (280t)</SelectItem>
                  <SelectItem value="medium" className="text-[10px]">Med (560t)</SelectItem>
                  <SelectItem value="high" className="text-[10px]">High (1120t)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}

        {/* Add image slots */}
        {slotsRemaining > 0 && (
          <>
            {/* Upload from files */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square bg-muted/30 rounded-md border border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <Upload className="w-4 h-4 opacity-50" />
              <span className="text-[8px]">Upload</span>
            </div>

            {/* Pick from history */}
            <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
              <PopoverTrigger asChild>
                <div className="aspect-square bg-muted/30 rounded-md border border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
                  <History className="w-4 h-4 opacity-50" />
                  <span className="text-[8px]">History</span>
                </div>
              </PopoverTrigger>
              <PopoverContent side="left" align="start" className="w-72 p-2">
                <div className="text-xs font-medium mb-2">Pick from recent generations</div>
                <ScrollArea className="max-h-[300px]">
                  {imageGenerations.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground py-4 text-center">No image generations yet</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-1">
                      {imageGenerations.flatMap(gen =>
                        (gen.output_urls || []).map((url, i) => {
                          const publicUrl = convertGcsUri(url);
                          const isLoading = loadingUrls.has(publicUrl);
                          return (
                            <button
                              key={`${gen.id}-${i}`}
                              onClick={() => handleHistorySelect(url)}
                              disabled={isLoading || slotsRemaining <= 0}
                              className="relative aspect-square bg-muted rounded overflow-hidden border hover:border-primary hover:ring-1 hover:ring-primary transition-all disabled:opacity-50"
                              title={gen.prompt_text?.substring(0, 80) || 'Generation'}
                            >
                              <img
                                src={publicUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              {isLoading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                                </div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Pick from media library */}
            <Popover open={libraryOpen} onOpenChange={setLibraryOpen}>
              <PopoverTrigger asChild>
                <div className="aspect-square bg-muted/30 rounded-md border border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
                  <ImageIcon className="w-4 h-4 opacity-50" />
                  <span className="text-[8px]">Library</span>
                </div>
              </PopoverTrigger>
              <PopoverContent side="left" align="start" className="w-72 p-2">
                <div className="text-xs font-medium mb-2">Pick from media library</div>
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    placeholder="Search media..."
                    className="h-7 text-[10px] pl-7"
                  />
                </div>
                <ScrollArea className="max-h-[300px]">
                  {(() => {
                    const filtered = (mediaImages || []).filter(
                      (img) => !librarySearch || img.filename.toLowerCase().includes(librarySearch.toLowerCase())
                    );
                    return filtered.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground py-4 text-center">
                        {librarySearch ? 'No matching images' : 'No images in media library'}
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-1">
                        {filtered.map((img) => {
                          const publicUrl = convertGcsUri(img.url);
                          const isLoading = loadingUrls.has(publicUrl);
                          return (
                            <button
                              key={img.id}
                              onClick={() => {
                                addImageFromUrl(publicUrl);
                                if (slotsRemaining <= 1) setLibraryOpen(false);
                              }}
                              disabled={isLoading || slotsRemaining <= 0}
                              className="relative aspect-square bg-muted rounded overflow-hidden border hover:border-primary hover:ring-1 hover:ring-primary transition-all disabled:opacity-50"
                              title={img.filename}
                            >
                              <img
                                src={publicUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              {isLoading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Pick from brand reference collections */}
            {brandId && (
              <BrandReferencePicker
                brandId={brandId}
                currentImageCount={images.length}
                maxImages={maxImages}
                onAddImages={addCollectionImages}
                open={brandRefsOpen}
                onOpenChange={setBrandRefsOpen}
              >
                <div className="aspect-square bg-muted/30 rounded-md border border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
                  <FolderOpen className="w-4 h-4 opacity-50" />
                  <span className="text-[8px]">Brand Refs</span>
                </div>
              </BrandReferencePicker>
            )}
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {images.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange([])}
          className="w-full h-6 text-[10px] text-muted-foreground"
        >
          Clear all references
        </Button>
      )}
    </div>
  );
}
