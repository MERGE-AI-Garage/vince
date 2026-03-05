// ABOUTME: Tabbed popover for selecting images or videos from upload, history, or media library
// ABOUTME: Reusable across Creative Studio — supports custom triggers and multiple output formats

import { useState, useRef, useCallback } from 'react';
import { Upload, History, ImageIcon, Loader2, Search, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useMyGenerations } from '@/hooks/useCreativeStudioGenerations';
import { useMediaLibraryAssets } from '@/hooks/useMediaLibraryAssets';
import { convertGcsUri, fetchImageAsBase64, stripBase64Prefix, fileToBase64, fileToDataUrl } from '@/lib/image-utils';

type MediaType = 'image' | 'video';
type OutputFormat = 'base64' | 'data-url' | 'url';

interface AssetPickerProps {
  mediaType: MediaType;
  outputFormat: OutputFormat;
  onSelect: (value: string) => void;
  disabled?: boolean;
  trigger?: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
}

export function AssetPicker({
  mediaType,
  outputFormat,
  onSelect,
  disabled,
  trigger,
  side = 'left',
  align = 'start',
}: AssetPickerProps) {
  const [open, setOpen] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [librarySearch, setLibrarySearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: generations } = useMyGenerations(30);
  const { data: mediaAssets } = useMediaLibraryAssets(mediaType, 50);

  const isVideo = mediaType === 'video';

  const filteredGenerations = (generations || []).filter((g) => {
    if (g.status !== 'completed' || !g.output_urls?.length) return false;
    return isVideo
      ? g.generation_type.includes('video')
      : !g.generation_type.includes('video');
  });

  const filteredMedia = (mediaAssets || []).filter(
    (asset) => !librarySearch || asset.filename.toLowerCase().includes(librarySearch.toLowerCase())
  );

  const accept = isVideo ? 'video/*' : 'image/*';

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let result: string;
    if (outputFormat === 'base64') {
      result = await fileToBase64(file);
    } else {
      // data-url or url (local files always become data URLs)
      result = await fileToDataUrl(file);
    }

    onSelect(result);
    setOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [onSelect, outputFormat]);

  const handleRemoteSelect = useCallback(async (url: string) => {
    if (outputFormat === 'url') {
      onSelect(convertGcsUri(url));
      setOpen(false);
      return;
    }

    setLoadingUrl(url);
    try {
      const dataUrl = await fetchImageAsBase64(url);
      const result = outputFormat === 'base64' ? stripBase64Prefix(dataUrl) : dataUrl;
      onSelect(result);
      setOpen(false);
    } catch (err) {
      console.error('Failed to fetch asset:', err);
    } finally {
      setLoadingUrl(null);
    }
  }, [onSelect, outputFormat]);

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled}
      className="w-full h-8 text-[10px]"
    >
      {isVideo ? <Film className="w-3 h-3 mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
      {isVideo ? 'Select Video' : 'Add Image'}
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-80 p-0">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="w-full h-8 rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="upload" className="flex-1 h-8 text-[10px] rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              <Upload className="w-3 h-3 mr-1" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 h-8 text-[10px] rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              <History className="w-3 h-3 mr-1" />
              History
            </TabsTrigger>
            <TabsTrigger value="library" className="flex-1 h-8 text-[10px] rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              {isVideo ? <Film className="w-3 h-3 mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />}
              Library
            </TabsTrigger>
          </TabsList>

          {/* Upload tab */}
          <TabsContent value="upload" className="p-3 mt-0">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              {isVideo ? <Film className="w-6 h-6 text-muted-foreground" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
              <span className="text-xs text-muted-foreground">
                Click to upload {isVideo ? 'a video' : 'an image'}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileUpload}
              className="hidden"
            />
          </TabsContent>

          {/* History tab */}
          <TabsContent value="history" className="mt-0">
            <ScrollArea className="max-h-[300px]">
              <div className="p-2">
                {filteredGenerations.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground py-6 text-center">
                    No {isVideo ? 'video' : 'image'} generations yet
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-1">
                    {filteredGenerations.flatMap((gen) =>
                      (gen.output_urls || []).map((url, i) => {
                        const publicUrl = convertGcsUri(url);
                        const isLoading = loadingUrl === url;
                        return (
                          <button
                            key={`${gen.id}-${i}`}
                            onClick={() => handleRemoteSelect(url)}
                            disabled={isLoading}
                            className="relative aspect-square bg-muted rounded overflow-hidden border hover:border-primary hover:ring-1 hover:ring-primary transition-all disabled:opacity-50"
                            title={gen.prompt_text?.substring(0, 80) || 'Generation'}
                          >
                            {isVideo ? (
                              <video
                                src={publicUrl}
                                preload="metadata"
                                className="w-full h-full object-cover"
                                playsInline
                                muted
                              />
                            ) : (
                              <img
                                src={publicUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            )}
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
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Library tab */}
          <TabsContent value="library" className="mt-0">
            <div className="p-2 pb-0">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder="Search media..."
                  className="h-7 text-[10px] pl-7"
                />
              </div>
            </div>
            <ScrollArea className="max-h-[300px]">
              <div className="p-2">
                {filteredMedia.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground py-6 text-center">
                    {librarySearch ? `No matching ${isVideo ? 'videos' : 'images'}` : `No ${isVideo ? 'videos' : 'images'} in media library`}
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-1">
                    {filteredMedia.map((asset) => {
                      const publicUrl = convertGcsUri(asset.url);
                      const isLoading = loadingUrl === asset.url;
                      return (
                        <button
                          key={asset.id}
                          onClick={() => handleRemoteSelect(asset.url)}
                          disabled={isLoading}
                          className="relative aspect-square bg-muted rounded overflow-hidden border hover:border-primary hover:ring-1 hover:ring-primary transition-all disabled:opacity-50"
                          title={asset.filename}
                        >
                          {isVideo ? (
                            <video
                              src={publicUrl}
                              preload="metadata"
                              className="w-full h-full object-cover"
                              playsInline
                              muted
                            />
                          ) : (
                            <img
                              src={publicUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )}
                          {isLoading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 className="w-3 h-3 text-white animate-spin" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
