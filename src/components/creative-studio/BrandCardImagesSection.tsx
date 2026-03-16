// ABOUTME: Admin section for managing Gemini-generated card images per brand
// ABOUTME: Grid of 5 icon slots with regenerate, upload, remove, and prompt editing

import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  RefreshCw, Trash2, ImageIcon, Loader2, Upload, Eye, Library, FolderOpen,
  CheckCircle2, AlertCircle, Clock, Cpu, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { MediaPickerDialog } from '@/components/cms/MediaPickerDialog';
import { useBrandCardImageHistory } from '@/hooks/useBrandCardImageHistory';
import {
  BRAND_CARD_IMAGE_LABELS,
  type BrandCardImageKey,
  type CreativeStudioBrand,
} from '@/types/creative-studio';
import { useBrand } from '@/hooks/useCreativeStudioBrands';
import { ImageGenerationConfirm, type PendingImageGeneration } from '@/components/ui/image-generation-confirm';

const ALL_CARD_KEYS: BrandCardImageKey[] = [
  'brand_dna', 'ai_guidelines', 'generation_prompt', 'templates', 'brand_agent', 'art_direction',
];

type PromptStyle = 'stacked_acrylic' | 'laser_cut' | 'murano_glass';

const STYLE_OPTIONS: { value: PromptStyle; label: string }[] = [
  { value: 'stacked_acrylic', label: 'Stacked Acrylic' },
  { value: 'laser_cut',       label: 'Laser Cut Metal' },
  { value: 'murano_glass',    label: 'Murano Glass' },
];

interface BrandCardImagesSectionProps {
  brand: CreativeStudioBrand;
  onUpdate: (data: { card_images?: Record<string, string>; card_image_prompts?: Record<string, string> }) => Promise<void>;
}

export function BrandCardImagesSection({ brand, onUpdate }: BrandCardImagesSectionProps) {
  const queryClient = useQueryClient();
  const [regeneratingKeys, setRegeneratingKeys] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState<BrandCardImageKey | null>(null);
  const [pendingGen, setPendingGen] = useState<PendingImageGeneration | null>(null);
  const [mediaPickerKey, setMediaPickerKey] = useState<BrandCardImageKey | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<PromptStyle>('stacked_acrylic');

  const { data: liveBrand } = useBrand(brand.id);
  const images = ((liveBrand?.card_images ?? brand.card_images) || {}) as Record<string, string>;
  const presentCount = ALL_CARD_KEYS.filter(k => images[k]).length;
  const missingCount = ALL_CARD_KEYS.length - presentCount;

  const applyResultsToCache = (results: Record<string, { status: string; url?: string }>) => {
    const newUrls: Record<string, string> = {};
    for (const [k, r] of Object.entries(results)) {
      if (r.status === 'success' && r.url) newUrls[k] = r.url;
    }
    if (Object.keys(newUrls).length === 0) return;
    const patch = (b: any) => b?.id === brand.id
      ? { ...b, card_images: { ...(b.card_images || {}), ...newUrls } }
      : b;
    queryClient.setQueryData(['creative-studio-brands', brand.id], patch);
    queryClient.setQueryData(['creative-studio-brands'], (old: any) =>
      Array.isArray(old) ? old.map(patch) : old,
    );
  };

  const handleRegenerate = async (key: BrandCardImageKey) => {
    setRegeneratingKeys(prev => new Set([...prev, key]));
    try {
      const { data, error } = await supabase.functions.invoke('generate-brand-card-images', {
        body: { brand_id: brand.id, card_keys: [key], prompt_style: selectedStyle },
      });
      if (error) throw error;
      applyResultsToCache(data?.results || {});
      queryClient.invalidateQueries({ queryKey: ['creative-studio-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brand-card-image-history', brand.id, key] });
      toast.success(`${BRAND_CARD_IMAGE_LABELS[key].label} regenerated`);
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

  const handleRemove = async (key: BrandCardImageKey) => {
    const updated = { ...images };
    delete updated[key];
    try {
      await onUpdate({ card_images: updated });
      toast.success(`${BRAND_CARD_IMAGE_LABELS[key].label} removed`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove image');
    }
  };

  const handleImageSwapped = async (key: BrandCardImageKey, url: string) => {
    const updated = { ...images, [key]: url };
    try {
      await onUpdate({ card_images: updated });
      queryClient.invalidateQueries({ queryKey: ['brand-card-image-history', brand.id, key] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update image');
    }
  };

  const handleGenerateAll = async (onlyMissing: boolean) => {
    const keys = onlyMissing
      ? ALL_CARD_KEYS.filter(k => !images[k])
      : ALL_CARD_KEYS;
    if (keys.length === 0) {
      toast.info('All images present. Use individual regenerate to replace.');
      return;
    }
    setRegeneratingKeys(new Set(keys));
    try {
      const { data, error } = await supabase.functions.invoke('generate-brand-card-images', {
        body: { brand_id: brand.id, card_keys: keys, prompt_style: selectedStyle },
      });
      if (error) throw error;
      applyResultsToCache(data?.results || {});
      queryClient.invalidateQueries({ queryKey: ['creative-studio-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brand-card-image-history'] });
      toast.success(`${keys.length} card image${keys.length > 1 ? 's' : ''} generated`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate images');
    } finally {
      setRegeneratingKeys(new Set());
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Card Images</Label>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-purple-500" />
            {presentCount}/{ALL_CARD_KEYS.length}
          </Badge>
          {missingCount > 0 && (
            <Button
              variant="outline" size="sm" className="h-7 text-xs"
              onClick={() => setPendingGen({
                label: `${missingCount} missing card images`,
                count: missingCount,
                onConfirm: () => handleGenerateAll(true),
              })}
              disabled={regeneratingKeys.size > 0}
            >
              {regeneratingKeys.size > 0 ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Generating...</>
              ) : (
                <><RefreshCw className="h-3 w-3 mr-1" />Generate Missing ({missingCount})</>
              )}
            </Button>
          )}
          <Button
            variant="outline" size="sm" className="h-7 text-xs"
            onClick={() => setPendingGen({
              label: `all ${ALL_CARD_KEYS.length} card images`,
              count: ALL_CARD_KEYS.length,
              onConfirm: () => handleGenerateAll(false),
            })}
            disabled={regeneratingKeys.size > 0}
          >
            {regeneratingKeys.size > 0 ? (
              <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Generating...</>
            ) : (
              <><RefreshCw className="h-3 w-3 mr-1" />Generate All</>
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Stylized 3D icon images for the brand welcome screen. Generated from brand colors using Gemini.
      </p>

      {/* Style preset selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground shrink-0">Style</span>
        <div className="flex items-center gap-1">
          {STYLE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelectedStyle(opt.value)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border',
                selectedStyle === opt.value
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of card image slots */}
      <div className="grid grid-cols-3 gap-2.5">
        {ALL_CARD_KEYS.map(key => {
          const url = images[key];
          const meta = BRAND_CARD_IMAGE_LABELS[key];
          const isRegenerating = regeneratingKeys.has(key);

          return (
            <div key={key} className="border rounded-lg overflow-hidden group">
              {/* Image / placeholder */}
              <div className="relative aspect-square bg-muted/30">
                {url ? (
                  <>
                    <img src={url} alt={meta.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="secondary" size="sm" className="h-6 text-[10px]"
                        onClick={() => setSelectedKey(key)}
                      >
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
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground/20" />
                    )}
                  </button>
                )}
                <div className={cn(
                  'absolute top-1 right-1 w-1.5 h-1.5 rounded-full',
                  url ? 'bg-purple-500' : 'bg-gray-400',
                )} />
              </div>

              {/* Footer */}
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-[10px] font-medium truncate">{meta.label}</span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost" size="sm" className="h-5 w-5 p-0"
                    onClick={() => setPendingGen({
                      label: meta.label,
                      count: 1,
                      onConfirm: () => handleRegenerate(key),
                    })}
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-2.5 w-2.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="h-5 w-5 p-0"
                    onClick={() => setMediaPickerKey(key)}
                    title="Replace from library"
                  >
                    <FolderOpen className="h-2.5 w-2.5" />
                  </Button>
                  {url && (
                    <Button
                      variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500"
                      onClick={() => handleRemove(key)}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail dialog */}
      {selectedKey && (
        <CardImageDetailDialog
          open={!!selectedKey}
          onOpenChange={(open) => { if (!open) setSelectedKey(null); }}
          brandId={brand.id}
          cardKey={selectedKey}
          label={BRAND_CARD_IMAGE_LABELS[selectedKey].label}
          currentUrl={images[selectedKey] || null}
          currentPromptOverride={(brand.card_image_prompts as Record<string, string> || {})[selectedKey] || ''}
          onImageSwapped={handleImageSwapped}
          onRegenerate={(key) => setPendingGen({
            label: BRAND_CARD_IMAGE_LABELS[key].label,
            count: 1,
            onConfirm: () => handleRegenerate(key),
          })}
          onPromptSave={async (key, prompt) => {
            const updated = { ...(brand.card_image_prompts as Record<string, string> || {}), [key]: prompt };
            if (!prompt) delete updated[key];
            await onUpdate({ card_image_prompts: updated });
          }}
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

interface CardImageDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  cardKey: BrandCardImageKey;
  label: string;
  currentUrl: string | null;
  currentPromptOverride: string;
  onImageSwapped: (key: BrandCardImageKey, url: string) => void;
  onRegenerate: (key: BrandCardImageKey) => void;
  onPromptSave: (key: BrandCardImageKey, prompt: string) => Promise<void>;
  isRegenerating: boolean;
}

function CardImageDetailDialog({
  open, onOpenChange, brandId, cardKey, label, currentUrl,
  currentPromptOverride, onImageSwapped, onRegenerate, onPromptSave, isRegenerating,
}: CardImageDetailDialogProps) {
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [promptEdit, setPromptEdit] = useState(currentPromptOverride);
  const [promptDirty, setPromptDirty] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: history, isLoading: historyLoading } = useBrandCardImageHistory(
    open ? brandId : null,
    open ? cardKey : null,
  );

  const latestGeneration = history?.[0];
  const displayPrompt = latestGeneration?.prompt || null;

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
      const filePath = `brand-cards/${brandId}/${cardKey}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('media')
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
      onImageSwapped(cardKey, publicUrl);
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
    onImageSwapped(cardKey, media.url);
    setMediaPickerOpen(false);
    toast.success(`${label} updated from library`);
  };

  const handleRestoreVersion = (url: string) => {
    onImageSwapped(cardKey, url);
    toast.success(`${label} restored from history`);
  };

  const handleSavePrompt = async () => {
    setSavingPrompt(true);
    try {
      await onPromptSave(cardKey, promptEdit.trim());
      setPromptDirty(false);
      toast.success('Prompt override saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save prompt');
    } finally {
      setSavingPrompt(false);
    }
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
          <div className="relative aspect-square max-h-64 bg-muted/30 rounded-lg overflow-hidden mx-auto">
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
              onClick={() => onRegenerate(cardKey)}
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

          {/* Generation prompt (from history) */}
          {displayPrompt && (
            <div className="border rounded-lg">
              <button
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors"
                onClick={() => setPromptExpanded(!promptExpanded)}
              >
                <span className="font-medium text-muted-foreground">Last Generation Prompt</span>
                <div className="flex items-center gap-2">
                  {latestGeneration && (
                    <>
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
                    </>
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
                    {displayPrompt}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Prompt override editor */}
          <div className="space-y-2">
            <Label className="text-xs">Prompt Override</Label>
            <Textarea
              placeholder="Leave empty to use the built-in default prompt with brand colors..."
              value={promptEdit}
              onChange={(e) => { setPromptEdit(e.target.value); setPromptDirty(true); }}
              rows={3}
              className="text-xs"
            />
            {promptDirty && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="sm" className="h-7 text-xs"
                  onClick={handleSavePrompt}
                  disabled={savingPrompt}
                >
                  {savingPrompt ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Save Prompt
                </Button>
                <Button
                  variant="ghost" size="sm" className="h-7 text-xs"
                  onClick={() => { setPromptEdit(currentPromptOverride); setPromptDirty(false); }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

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
                {history.map((gen) => {
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
                        className="w-16 h-16 object-cover"
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
