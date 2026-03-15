// ABOUTME: Admin tab for managing Gemini-generated icon images on the system welcome page
// ABOUTME: Grid of 9 image slots (8 capability cards + hero) with regenerate, upload, and remove

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RefreshCw, Trash2, ImageIcon, Loader2, Upload, Eye, Library, FolderOpen,
  CheckCircle2, AlertCircle, Clock, Cpu, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { useImageGenerationHistory } from '@/hooks/useImageGenerationHistory';
import { MediaPickerDialog } from '@/components/cms/MediaPickerDialog';
import {
  useStudioWelcomeImages,
  WELCOME_IMAGE_LABELS,
  type WelcomeImageKey,
} from '@/hooks/useStudioWelcomeImages';
import { ImageGenerationConfirm, type PendingImageGeneration } from '@/components/ui/image-generation-confirm';

const ALL_KEYS: WelcomeImageKey[] = [
  'hero',
  'image_generation', 'video_generation', 'editing_suite', 'upscaling',
  'product_recontext', 'virtual_tryon', 'conversational_editing', 'camera_controls',
];

export function WelcomeImagesTab() {
  const { data: images, isLoading } = useStudioWelcomeImages();
  const updateSetting = useUpdateSiteSetting();
  const queryClient = useQueryClient();

  const [regeneratingKeys, setRegeneratingKeys] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState<WelcomeImageKey | null>(null);
  const [pendingGen, setPendingGen] = useState<PendingImageGeneration | null>(null);
  const [mediaPickerKey, setMediaPickerKey] = useState<WelcomeImageKey | null>(null);

  const presentCount = ALL_KEYS.filter(k => images?.[k]).length;
  const missingCount = ALL_KEYS.length - presentCount;

  const handleRegenerate = async (key: WelcomeImageKey) => {
    setRegeneratingKeys(prev => new Set([...prev, key]));
    try {
      const { error } = await supabase.functions.invoke('generate-studio-welcome-images', {
        body: { sections: [key] },
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-images'] });
      toast.success(`${WELCOME_IMAGE_LABELS[key].label} regenerated`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate image');
    } finally {
      setRegeneratingKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleRemove = async (key: WelcomeImageKey) => {
    if (!images) return;
    const updated = { ...images };
    delete updated[key];
    try {
      await updateSetting.mutateAsync({
        key: 'creative_studio_welcome_images',
        value: updated,
      });
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-images'] });
      toast.success(`${WELCOME_IMAGE_LABELS[key].label} removed`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove image');
    }
  };

  const handleImageSwapped = async (key: WelcomeImageKey, url: string) => {
    const updated = { ...(images || {}), [key]: url };
    try {
      await updateSetting.mutateAsync({
        key: 'creative_studio_welcome_images',
        value: updated,
      });
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-images'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update image');
    }
  };

  const handleGenerateAll = async (onlyMissing: boolean) => {
    const keys = onlyMissing
      ? ALL_KEYS.filter(k => !images?.[k])
      : ALL_KEYS;
    if (keys.length === 0) {
      toast.info('All images present. Use individual regenerate to replace.');
      return;
    }
    setRegeneratingKeys(new Set(keys));
    try {
      const { error } = await supabase.functions.invoke('generate-studio-welcome-images', {
        body: { sections: keys },
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['studio-welcome-images'] });
      toast.success(`${keys.length} image${keys.length > 1 ? 's' : ''} generated`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate images');
    } finally {
      setRegeneratingKeys(new Set());
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="border rounded-lg h-32 animate-pulse bg-muted/30" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1 text-purple-500" />
          {presentCount}/{ALL_KEYS.length} present
        </Badge>
        {missingCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
            {missingCount} missing
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-2">
          {missingCount > 0 && (
            <Button
              variant="outline" size="sm"
              onClick={() => setPendingGen({
                label: `${missingCount} missing images`,
                count: missingCount,
                onConfirm: () => handleGenerateAll(true),
              })}
              disabled={regeneratingKeys.size > 0}
            >
              {regeneratingKeys.size > 0 ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Generating...</>
              ) : (
                <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Generate Missing ({missingCount})</>
              )}
            </Button>
          )}
          <Button
            variant="outline" size="sm"
            onClick={() => setPendingGen({
              label: `all ${ALL_KEYS.length} images`,
              count: ALL_KEYS.length,
              onConfirm: () => handleGenerateAll(false),
            })}
            disabled={regeneratingKeys.size > 0}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Generate All
          </Button>
        </div>
      </div>

      {/* Hero image — full width */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hero Banner</h3>
        <div className="border rounded-lg overflow-hidden group">
          <div className="relative aspect-[3/1] bg-muted/30">
            {images?.hero ? (
              <>
                <img src={images.hero} alt="Hero" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedKey('hero')}>
                    <Eye className="h-3.5 w-3.5 mr-1" />View
                  </Button>
                </div>
              </>
            ) : (
              <button
                className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setSelectedKey('hero')}
              >
                {regeneratingKeys.has('hero') ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
                )}
              </button>
            )}
            <div className={cn(
              'absolute top-2 right-2 w-2.5 h-2.5 rounded-full',
              images?.hero ? 'bg-purple-500' : 'bg-gray-400',
            )} />
          </div>
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-medium">Hero Banner</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost" size="sm" className="h-6 w-6 p-0"
                onClick={() => setPendingGen({
                  label: 'Hero Banner',
                  count: 1,
                  onConfirm: () => handleRegenerate('hero'),
                })}
                disabled={regeneratingKeys.has('hero')}
              >
                {regeneratingKeys.has('hero') ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost" size="sm" className="h-6 w-6 p-0"
                onClick={() => setMediaPickerKey('hero')}
                title="Replace from library"
              >
                <FolderOpen className="h-3 w-3" />
              </Button>
              {images?.hero && (
                <Button
                  variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                  onClick={() => handleRemove('hero')}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Capability cards — grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capability Cards</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ALL_KEYS.filter(k => k !== 'hero').map(key => {
            const url = images?.[key];
            const meta = WELCOME_IMAGE_LABELS[key];
            const isRegenerating = regeneratingKeys.has(key);

            return (
              <div key={key} className="border rounded-lg overflow-hidden group">
                <div className="relative aspect-square bg-muted/30">
                  {url ? (
                    <>
                      <img src={url} alt={meta.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => setSelectedKey(key)}>
                          <Eye className="h-3 w-3 mr-1" />View
                        </Button>
                      </div>
                    </>
                  ) : (
                    <button
                      className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={() => setSelectedKey(key)}
                    >
                      {isRegenerating ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground/20" />
                      )}
                    </button>
                  )}
                  <div className={cn(
                    'absolute top-1.5 right-1.5 w-2 h-2 rounded-full',
                    url ? 'bg-purple-500' : 'bg-gray-400',
                  )} />
                </div>
                <div className="px-2.5 py-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium truncate">{meta.label}</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      variant="ghost" size="sm" className="h-6 w-6 p-0"
                      onClick={() => setPendingGen({
                        label: meta.label,
                        count: 1,
                        onConfirm: () => handleRegenerate(key),
                      })}
                      disabled={isRegenerating}
                    >
                      {isRegenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-6 w-6 p-0"
                      onClick={() => setMediaPickerKey(key)}
                      title="Replace from library"
                    >
                      <FolderOpen className="h-3 w-3" />
                    </Button>
                    {url && (
                      <Button
                        variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                        onClick={() => handleRemove(key)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail dialog */}
      {selectedKey && (
        <WelcomeImageDetailDialog
          open={!!selectedKey}
          onOpenChange={(open) => { if (!open) setSelectedKey(null); }}
          sectionKey={selectedKey}
          label={WELCOME_IMAGE_LABELS[selectedKey].label}
          currentUrl={images?.[selectedKey] || null}
          onImageSwapped={handleImageSwapped}
          onRegenerate={(key) => setPendingGen({
            label: WELCOME_IMAGE_LABELS[key].label,
            count: 1,
            onConfirm: () => handleRegenerate(key),
          })}
          isRegenerating={regeneratingKeys.has(selectedKey)}
        />
      )}

      <ImageGenerationConfirm
        pending={pendingGen}
        onCancel={() => setPendingGen(null)}
      />

      <MediaPickerDialog
        open={!!mediaPickerKey}
        onOpenChange={(open) => !open && setMediaPickerKey(null)}
        onSelect={(media) => {
          if (mediaPickerKey) {
            handleImageSwapped(mediaPickerKey, media.url);
            setMediaPickerKey(null);
          }
        }}
        mediaType="images"
      />
    </div>
  );
}

// ── Detail dialog ───────────────────────────────────────────────────────

interface WelcomeImageDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionKey: WelcomeImageKey;
  label: string;
  currentUrl: string | null;
  onImageSwapped: (key: WelcomeImageKey, url: string) => void;
  onRegenerate: (key: WelcomeImageKey) => void;
  isRegenerating: boolean;
}

function WelcomeImageDetailDialog({
  open, onOpenChange, sectionKey, label, currentUrl,
  onImageSwapped, onRegenerate, isRegenerating,
}: WelcomeImageDetailDialogProps) {
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reuse the guidelines image history hook — works with any original_prompt/metadata pattern
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['studio-welcome-image-history', sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_image_generations')
        .select('id, prompt, image_url, model_used, generation_time_ms, created_at')
        .eq('status', 'completed')
        .eq('category', 'studio-welcome')
        .filter('metadata->>sectionKey', 'eq', sectionKey)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: open,
    staleTime: 2 * 60 * 1000,
  });

  const latestGeneration = history?.[0];

  const handleUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `studio-welcome/${sectionKey}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('media')
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
      onImageSwapped(sectionKey, publicUrl);
      toast.success(`${label} updated`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const handleMediaSelect = (media: { url: string }) => {
    onImageSwapped(sectionKey, media.url);
    setMediaPickerOpen(false);
    toast.success(`${label} updated from library`);
  };

  const handleRestoreVersion = (url: string) => {
    onImageSwapped(sectionKey, url);
    toast.success(`${label} restored from history`);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>

          {/* Image preview */}
          <div className={cn(
            'relative bg-muted/30 rounded-lg overflow-hidden',
            sectionKey === 'hero' ? 'aspect-[3/1]' : 'aspect-square max-h-64 mx-auto',
          )}>
            {currentUrl ? (
              <img src={currentUrl} alt={label} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => onRegenerate(sectionKey)}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Generating...</>
              ) : (
                <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Regenerate</>
              )}
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading...</>
              ) : (
                <><Upload className="h-3.5 w-3.5 mr-1.5" />Upload</>
              )}
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setMediaPickerOpen(true)}
            >
              <Library className="h-3.5 w-3.5 mr-1.5" />Browse Library
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Prompt metadata */}
          {latestGeneration && (
            <div className="border rounded-lg">
              <button
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors"
                onClick={() => setPromptExpanded(!promptExpanded)}
              >
                <span className="font-medium text-muted-foreground">Generation Prompt</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    <Cpu className="h-2.5 w-2.5 mr-1" />
                    {latestGeneration.model_used}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    <Clock className="h-2.5 w-2.5 mr-1" />
                    {formatDate(latestGeneration.created_at)}
                  </Badge>
                  {latestGeneration.generation_time_ms && (
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {(latestGeneration.generation_time_ms / 1000).toFixed(1)}s
                    </Badge>
                  )}
                  {promptExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </button>
              {promptExpanded && (
                <div className="px-3 pb-3 border-t">
                  <p className="text-xs text-muted-foreground leading-relaxed pt-2.5 whitespace-pre-wrap">
                    {latestGeneration.prompt}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* History strip */}
          {historyLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />Loading history...
            </div>
          )}

          {history && history.length > 1 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Generation History ({history.length})
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {history.map((gen: any) => {
                  const isCurrent = currentUrl === gen.image_url;
                  return (
                    <button
                      key={gen.id}
                      className={cn(
                        'shrink-0 rounded-md overflow-hidden border-2 transition-all hover:opacity-90',
                        isCurrent
                          ? 'border-purple-500 ring-1 ring-purple-500/30'
                          : 'border-transparent hover:border-muted-foreground/30',
                      )}
                      onClick={() => !isCurrent && handleRestoreVersion(gen.image_url)}
                      title={isCurrent ? 'Current image' : `Restore — ${formatDate(gen.created_at)}`}
                    >
                      <img
                        src={gen.image_url}
                        alt={`Version from ${formatDate(gen.created_at)}`}
                        className={cn(
                          'object-cover',
                          sectionKey === 'hero' ? 'w-32 h-12' : 'w-16 h-16',
                        )}
                      />
                      <div className="text-[9px] text-muted-foreground text-center py-0.5">
                        {formatDate(gen.created_at)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        onSelect={handleMediaSelect}
        mediaType="images"
      />
    </>
  );
}

