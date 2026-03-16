// ABOUTME: Admin tab for managing the Creative Studio welcome page images
// ABOUTME: Editable DB-backed prompts, model selection, image sets, batched generation, version history

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RefreshCw, Trash2, ImageIcon, Loader2, Upload, Eye, Library, FolderOpen,
  CheckCircle2, AlertCircle, Clock, Cpu, ChevronDown, ChevronUp,
  Save, Layers, FileText, Pencil, X, History, RotateCcw, Sparkles,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { MediaPickerDialog } from '@/components/cms/MediaPickerDialog';
import {
  useStudioWelcomeImages,
  WELCOME_IMAGE_LABELS,
  type WelcomeImageKey,
} from '@/hooks/useStudioWelcomeImages';
import { ImageGenerationConfirm, type PendingImageGeneration } from '@/components/ui/image-generation-confirm';
import { useCreativeStudioModels } from '@/hooks/useCreativeStudioModels';
import {
  useStudioWelcomeImagePrompts,
  useUpdateStudioWelcomeImagePrompt,
  useStudioWelcomeImagePromptVersions,
  useRestoreStudioWelcomeImagePromptVersion,
  type StudioWelcomeImagePrompt,
  type StudioWelcomeImagePromptVersion,
} from '@/hooks/useStudioWelcomeImagePrompts';
import {
  useStudioWelcomeImageSets,
  useSaveStudioWelcomeImageSet,
  useActivateStudioWelcomeImageSet,
  useRenameStudioWelcomeImageSet,
  useDeleteStudioWelcomeImageSet,
  type StudioWelcomeImageSet,
} from '@/hooks/useStudioWelcomeImageSets';

const ALL_KEYS: WelcomeImageKey[] = [
  'hero',
  'image_generation', 'video_generation', 'editing_suite', 'upscaling',
  'product_recontext', 'virtual_tryon', 'conversational_editing', 'camera_controls',
];

const BATCH_SIZE = 5;

export function WelcomeImagesTab() {
  const { data: images, isLoading } = useStudioWelcomeImages();
  const updateSetting = useUpdateSiteSetting();
  const queryClient = useQueryClient();

  const { data: allModels } = useCreativeStudioModels('image');
  const imageModels = (allModels || []).filter(m =>
    (m.capabilities as string[])?.includes('text_to_image'),
  );

  const { data: prompts } = useStudioWelcomeImagePrompts();
  const updatePrompt = useUpdateStudioWelcomeImagePrompt();
  const restoreVersion = useRestoreStudioWelcomeImagePromptVersion();

  const { data: sets } = useStudioWelcomeImageSets();
  const saveSet = useSaveStudioWelcomeImageSet();
  const activateSet = useActivateStudioWelcomeImageSet();
  const renameSet = useRenameStudioWelcomeImageSet();
  const deleteSet = useDeleteStudioWelcomeImageSet();

  const [selectedModel, setSelectedModel] = useState<string>('');
  const effectiveModel = selectedModel || imageModels[0]?.model_id || 'gemini-3-pro-image-preview';

  const [regeneratingKeys, setRegeneratingKeys] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState<WelcomeImageKey | null>(null);
  const [pendingGen, setPendingGen] = useState<PendingImageGeneration | null>(null);
  const [mediaPickerKey, setMediaPickerKey] = useState<WelcomeImageKey | null>(null);

  // Prompts panel state
  const [promptsExpanded, setPromptsExpanded] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingPromptText, setEditingPromptText] = useState('');
  const [versionHistoryPromptId, setVersionHistoryPromptId] = useState<string | null>(null);
  const [enhancingPromptId, setEnhancingPromptId] = useState<string | null>(null);
  const [enhancedPromptId, setEnhancedPromptId] = useState<string | null>(null);
  const [enhancedPromptText, setEnhancedPromptText] = useState('');

  // Sets panel state
  const [setsExpanded, setSetsExpanded] = useState(false);
  const [saveSetOpen, setSaveSetOpen] = useState(false);
  const [saveSetName, setSaveSetName] = useState('');
  const [renamingSetId, setRenamingSetId] = useState<string | null>(null);
  const [renamingSetName, setRenamingSetName] = useState('');
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null);

  const presentCount = ALL_KEYS.filter(k => images?.[k]).length;
  const missingCount = ALL_KEYS.length - presentCount;

  const handleRegenerate = async (key: WelcomeImageKey) => {
    setRegeneratingKeys(prev => new Set([...prev, key]));
    try {
      const { error } = await supabase.functions.invoke('generate-studio-welcome-images', {
        body: { sections: [key], model: effectiveModel },
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
    let totalSuccess = 0;
    let totalFailed = 0;

    try {
      for (let i = 0; i < keys.length; i += BATCH_SIZE) {
        const batch = keys.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(keys.length / BATCH_SIZE);

        if (totalBatches > 1) {
          toast.info(`Generating batch ${batchNum}/${totalBatches} (${batch.length} images)...`);
        }

        const { data, error } = await supabase.functions.invoke('generate-studio-welcome-images', {
          body: { sections: batch, model: effectiveModel },
        });

        if (error) {
          toast.error(`Batch ${batchNum} failed: ${error.message}`);
          totalFailed += batch.length;
          continue;
        }

        totalSuccess += data?.summary?.success ?? 0;
        queryClient.invalidateQueries({ queryKey: ['studio-welcome-images'] });
      }

      if (totalFailed === 0) {
        toast.success(`${totalSuccess} image${totalSuccess !== 1 ? 's' : ''} generated`);
      } else {
        toast.warning(`${totalSuccess} generated, ${totalFailed} failed`);
      }
    } finally {
      setRegeneratingKeys(new Set());
    }
  };

  const handleSaveSet = async () => {
    if (!saveSetName.trim()) return;
    const promptSnapshot = prompts?.reduce((acc, p) => {
      acc[p.image_key] = { prompt: p.prompt, aspect_ratio: p.aspect_ratio };
      return acc;
    }, {} as Record<string, { prompt: string; aspect_ratio: string }>);

    try {
      await saveSet.mutateAsync({
        name: saveSetName.trim(),
        model_used: effectiveModel,
        images: (images as Record<string, string>) || {},
        prompts: promptSnapshot,
      });
      toast.success(`Set "${saveSetName.trim()}" saved`);
      setSaveSetName('');
      setSaveSetOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save set');
    }
  };

  const handleActivateSet = async (setId: string) => {
    try {
      await activateSet.mutateAsync(setId);
      toast.success('Image set applied to welcome page');
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate set');
    }
  };

  const handleRenameSet = async () => {
    if (!renamingSetId || !renamingSetName.trim()) return;
    try {
      await renameSet.mutateAsync({ id: renamingSetId, name: renamingSetName.trim() });
      setRenamingSetId(null);
      setRenamingSetName('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to rename set');
    }
  };

  const handleDeleteSet = async () => {
    if (!deletingSetId) return;
    try {
      await deleteSet.mutateAsync(deletingSetId);
      setDeletingSetId(null);
      toast.success('Set deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete set');
    }
  };

  const handleEditPrompt = (p: StudioWelcomeImagePrompt) => {
    setEditingPromptId(p.id);
    setEditingPromptText(p.prompt);
  };

  const handleSavePrompt = async (p: StudioWelcomeImagePrompt) => {
    try {
      await updatePrompt.mutateAsync({
        id: p.id,
        prompt: editingPromptText,
        aspect_ratio: p.aspect_ratio,
        changeSummary: 'Manual edit',
      });
      setEditingPromptId(null);
      toast.success(`${p.label} prompt saved`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save prompt');
    }
  };

  const handleEnhancePrompt = async (p: StudioWelcomeImagePrompt) => {
    setEnhancingPromptId(p.id);
    setEnhancedPromptId(null);
    setEnhancedPromptText('');
    try {
      const { data, error } = await supabase.functions.invoke('enhance-image-prompt', {
        body: { prompt: p.prompt, label: p.label, image_key: p.image_key },
      });
      if (error) throw error;
      if (!data?.enhanced_prompt) throw new Error('No enhanced prompt returned');
      setEnhancedPromptId(p.id);
      setEnhancedPromptText(data.enhanced_prompt);
    } catch (err: any) {
      toast.error(err.message || 'Failed to enhance prompt');
    } finally {
      setEnhancingPromptId(null);
    }
  };

  const handleAcceptEnhanced = (p: StudioWelcomeImagePrompt) => {
    setEditingPromptId(p.id);
    setEditingPromptText(enhancedPromptText);
    setEnhancedPromptId(null);
    setEnhancedPromptText('');
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
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Model selector */}
        {imageModels.length > 0 && (
          <Select value={effectiveModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-64 h-8 text-xs">
              <Cpu className="h-3 w-3 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {imageModels.map(m => (
                <SelectItem key={m.model_id} value={m.model_id} className="text-xs">
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

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
          <Button
            variant="outline" size="sm"
            onClick={() => { setSaveSetName(''); setSaveSetOpen(true); }}
            disabled={!images || Object.keys(images).length === 0}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />Save Set
          </Button>
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

      {/* Prompts section — collapsible */}
      <div className="border rounded-lg">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
          onClick={() => setPromptsExpanded(!promptsExpanded)}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>Generation Prompts</span>
            {prompts && (
              <Badge variant="secondary" className="text-[10px]">{prompts.length}</Badge>
            )}
          </div>
          {promptsExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {promptsExpanded && prompts && (
          <div className="border-t divide-y">
            {prompts.map(p => (
              <div key={p.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{p.label}</span>
                    <Badge variant="outline" className="text-[10px]">{p.aspect_ratio}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1"
                      onClick={() => setVersionHistoryPromptId(p.id)}
                    >
                      <History className="h-3 w-3" />Versions
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1"
                      onClick={() => handleEnhancePrompt(p)}
                      disabled={enhancingPromptId === p.id}
                      title="Enhance with Gemini"
                    >
                      {enhancingPromptId === p.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      Enhance
                    </Button>
                    {editingPromptId === p.id ? (
                      <>
                        <Button
                          variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground"
                          onClick={() => setEditingPromptId(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm" className="h-6 px-2 text-xs"
                          onClick={() => handleSavePrompt(p)}
                          disabled={updatePrompt.isPending}
                        >
                          {updatePrompt.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <><Save className="h-3 w-3 mr-1" />Save</>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={() => handleEditPrompt(p)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {editingPromptId === p.id ? (
                  <Textarea
                    value={editingPromptText}
                    onChange={e => setEditingPromptText(e.target.value)}
                    className="text-xs min-h-[100px] resize-y font-mono"
                    autoFocus
                  />
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {p.prompt}
                  </p>
                )}

                {/* Enhanced prompt suggestion */}
                {enhancedPromptId === p.id && (
                  <div className="mt-2 rounded-md border border-purple-200 bg-purple-50/50 dark:border-purple-800/40 dark:bg-purple-950/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />Enhanced suggestion
                      </span>
                      <Button
                        variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground"
                        onClick={() => { setEnhancedPromptId(null); setEnhancedPromptText(''); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <Textarea
                      value={enhancedPromptText}
                      onChange={e => setEnhancedPromptText(e.target.value)}
                      className="text-xs min-h-[80px] resize-y font-mono"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm" className="h-6 px-2 text-xs"
                        onClick={() => handleAcceptEnhanced(p)}
                      >
                        Accept &amp; Edit
                      </Button>
                      <Button
                        variant="outline" size="sm" className="h-6 px-2 text-xs"
                        onClick={async () => {
                          try {
                            await updatePrompt.mutateAsync({
                              id: p.id,
                              prompt: enhancedPromptText,
                              aspect_ratio: p.aspect_ratio,
                              changeSummary: 'AI enhanced',
                            });
                            setEnhancedPromptId(null);
                            setEnhancedPromptText('');
                            toast.success(`${p.label} prompt saved`);
                          } catch (err: any) {
                            toast.error(err.message || 'Failed to save');
                          }
                        }}
                        disabled={updatePrompt.isPending}
                      >
                        {updatePrompt.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Directly'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Sets section — collapsible */}
      <div className="border rounded-lg">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
          onClick={() => setSetsExpanded(!setsExpanded)}
        >
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span>Image Sets</span>
            {sets && sets.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">{sets.length}</Badge>
            )}
          </div>
          {setsExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {setsExpanded && (
          <div className="border-t">
            {sets && sets.length > 0 ? (
              <div className="divide-y">
                {sets.map(set => (
                  <div key={set.id} className="px-4 py-3">
                    {renamingSetId === set.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={renamingSetName}
                          onChange={e => setRenamingSetName(e.target.value)}
                          className="h-7 text-xs flex-1"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRenameSet();
                            if (e.key === 'Escape') setRenamingSetId(null);
                          }}
                        />
                        <Button size="sm" className="h-7 px-2 text-xs" onClick={handleRenameSet}
                          disabled={renameSet.isPending}>
                          Save
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                          onClick={() => setRenamingSetId(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {set.is_active && (
                            <Star className="h-3 w-3 text-amber-500 shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">{set.name}</span>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            <Cpu className="h-2.5 w-2.5 mr-1" />
                            {set.model_used.split('-').slice(0, 3).join('-')}
                          </Badge>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {set.image_count} imgs
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!set.is_active && (
                            <Button
                              variant="outline" size="sm" className="h-6 px-2 text-xs"
                              onClick={() => handleActivateSet(set.id)}
                              disabled={activateSet.isPending}
                            >
                              {activateSet.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Apply'
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost" size="sm" className="h-6 w-6 p-0"
                            onClick={() => {
                              setRenamingSetId(set.id);
                              setRenamingSetName(set.name);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                            onClick={() => setDeletingSetId(set.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">No sets saved yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Generate images and click "Save Set" to snapshot this run.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      {selectedKey && (
        <WelcomeImageDetailDialog
          open={!!selectedKey}
          onOpenChange={(open) => { if (!open) setSelectedKey(null); }}
          sectionKey={selectedKey}
          label={WELCOME_IMAGE_LABELS[selectedKey].label}
          currentUrl={images?.[selectedKey] || null}
          prompt={prompts?.find(p => p.image_key === selectedKey) || null}
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

      {/* Save set dialog */}
      <AlertDialog open={saveSetOpen} onOpenChange={setSaveSetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Image Set</AlertDialogTitle>
            <AlertDialogDescription>
              Snapshot the current images and prompts as a named set. You can apply any saved set to the welcome page later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder={`${imageModels.find(m => m.model_id === effectiveModel)?.name || effectiveModel} — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
            value={saveSetName}
            onChange={e => setSaveSetName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSaveSet()}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveSet} disabled={saveSet.isPending || !saveSetName.trim()}>
              {saveSet.isPending ? 'Saving...' : 'Save Set'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete set confirm */}
      <AlertDialog open={!!deletingSetId} onOpenChange={(open) => !open && setDeletingSetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image Set</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the set. The generated images are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSet}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Version history dialog */}
      {versionHistoryPromptId && (
        <PromptVersionHistoryDialog
          open={!!versionHistoryPromptId}
          onOpenChange={(open) => !open && setVersionHistoryPromptId(null)}
          promptId={versionHistoryPromptId}
          promptLabel={prompts?.find(p => p.id === versionHistoryPromptId)?.label || ''}
          onRestore={async (version) => {
            try {
              await restoreVersion.mutateAsync({ promptId: versionHistoryPromptId, version });
              toast.success('Prompt restored');
              setVersionHistoryPromptId(null);
            } catch (err: any) {
              toast.error(err.message || 'Failed to restore');
            }
          }}
        />
      )}
    </div>
  );
}

// ── Prompt version history dialog ────────────────────────────────────────

interface PromptVersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptId: string;
  promptLabel: string;
  onRestore: (version: StudioWelcomeImagePromptVersion) => void;
}

function PromptVersionHistoryDialog({
  open, onOpenChange, promptId, promptLabel, onRestore,
}: PromptVersionHistoryDialogProps) {
  const { data: versions, isLoading } = useStudioWelcomeImagePromptVersions(promptId);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto brand-guidelines-panel">
        <DialogHeader>
          <DialogTitle>{promptLabel} — Version History</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />Loading versions...
          </div>
        ) : !versions?.length ? (
          <p className="text-sm text-muted-foreground py-4">No version history yet. Save an edit to start tracking versions.</p>
        ) : (
          <div className="space-y-2">
            {versions.map((v, idx) => (
              <div key={v.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={idx === 0 ? 'default' : 'secondary'} className="text-[10px]">
                      v{v.version_number}
                    </Badge>
                    {v.change_summary && (
                      <span className="text-xs text-muted-foreground">{v.change_summary}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{formatDate(v.created_at)}</span>
                    {idx > 0 && (
                      <Button
                        variant="outline" size="sm" className="h-6 px-2 text-xs gap-1"
                        onClick={() => onRestore(v)}
                      >
                        <RotateCcw className="h-3 w-3" />Restore
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{v.prompt}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Detail dialog ─────────────────────────────────────────────────────────

interface WelcomeImageDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionKey: WelcomeImageKey;
  label: string;
  currentUrl: string | null;
  prompt: StudioWelcomeImagePrompt | null;
  onImageSwapped: (key: WelcomeImageKey, url: string) => void;
  onRegenerate: (key: WelcomeImageKey) => void;
  isRegenerating: boolean;
}

function WelcomeImageDetailDialog({
  open, onOpenChange, sectionKey, label, currentUrl, prompt,
  onImageSwapped, onRegenerate, isRegenerating,
}: WelcomeImageDetailDialogProps) {
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [editPromptText, setEditPromptText] = useState('');
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePrompt = useUpdateStudioWelcomeImagePrompt();

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
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Only image files are supported'); return; }
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

  const handleSavePrompt = async () => {
    if (!prompt) return;
    try {
      await updatePrompt.mutateAsync({
        id: prompt.id,
        prompt: editPromptText,
        aspect_ratio: prompt.aspect_ratio,
        changeSummary: 'Edited from detail panel',
      });
      setEditingPrompt(false);
      toast.success('Prompt saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save prompt');
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto brand-guidelines-panel">
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
            <Button variant="outline" size="sm" onClick={() => onRegenerate(sectionKey)} disabled={isRegenerating}>
              {isRegenerating ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Generating...</>
              ) : (
                <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Regenerate</>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading...</>
              ) : (
                <><Upload className="h-3.5 w-3.5 mr-1.5" />Upload</>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMediaPickerOpen(true)}>
              <Library className="h-3.5 w-3.5 mr-1.5" />Browse Library
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
              className="hidden"
            />
          </div>

          {/* Editable prompt */}
          {prompt && (
            <div className="border rounded-lg">
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-sm font-medium text-muted-foreground">Prompt</span>
                <div className="flex items-center gap-1">
                  {editingPrompt ? (
                    <>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={() => setEditingPrompt(false)}>
                        <X className="h-3 w-3" />
                      </Button>
                      <Button size="sm" className="h-6 px-2 text-xs"
                        onClick={handleSavePrompt} disabled={updatePrompt.isPending}>
                        {updatePrompt.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Save className="h-3 w-3 mr-1" />Save</>}
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                      onClick={() => { setEditingPrompt(true); setEditPromptText(prompt.prompt); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="px-3 pb-3 border-t pt-2.5">
                {editingPrompt ? (
                  <Textarea
                    value={editPromptText}
                    onChange={e => setEditPromptText(e.target.value)}
                    className="text-xs min-h-[100px] resize-y font-mono"
                    autoFocus
                  />
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{prompt.prompt}</p>
                )}
              </div>
            </div>
          )}

          {/* Generation metadata from latest run */}
          {latestGeneration && (
            <div className="border rounded-lg">
              <button
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors"
                onClick={() => setPromptExpanded(!promptExpanded)}
              >
                <span className="font-medium text-muted-foreground">Last Generation</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    <Cpu className="h-2.5 w-2.5 mr-1" />{latestGeneration.model_used}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    <Clock className="h-2.5 w-2.5 mr-1" />{formatDate(latestGeneration.created_at)}
                  </Badge>
                  {latestGeneration.generation_time_ms && (
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {(latestGeneration.generation_time_ms / 1000).toFixed(1)}s
                    </Badge>
                  )}
                  {promptExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </button>
              {promptExpanded && (
                <div className="px-3 pb-3 border-t">
                  <p className="text-xs text-muted-foreground leading-relaxed pt-2.5 whitespace-pre-wrap line-clamp-6">
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
                      onClick={() => !isCurrent && onImageSwapped(sectionKey, gen.image_url)}
                      title={isCurrent ? 'Current image' : `Restore — ${formatDate(gen.created_at)}`}
                    >
                      <img
                        src={gen.image_url}
                        alt={`Version from ${formatDate(gen.created_at)}`}
                        className={cn('object-cover', sectionKey === 'hero' ? 'w-32 h-12' : 'w-16 h-16')}
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
        onSelect={(media) => { onImageSwapped(sectionKey, media.url); setMediaPickerOpen(false); toast.success(`${label} updated from library`); }}
        mediaType="images"
      />
    </>
  );
}
