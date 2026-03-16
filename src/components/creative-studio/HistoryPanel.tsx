// ABOUTME: Sidebar panel showing user's generation history
// ABOUTME: Thumbnails of recent generations with click to load

import { useState, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Image, Video, Clock, Loader2, ImageOff, Trash2, Info, PanelLeftClose, EyeOff, Eye } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMyGenerations, useAllGenerations, useInvalidateGenerations, useRealtimeGenerations } from '@/hooks/useCreativeStudioGenerations';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GenerationInfoDialog } from './GenerationInfoDialog';
import type { GenerationWithDetails } from '@/types/creative-studio';

interface HistoryPanelProps {
  onSelectGeneration?: (generation: GenerationWithDetails) => void;
  selectedId?: string;
  onClose?: () => void;
}

export function HistoryPanel({ onSelectGeneration, selectedId, onClose }: HistoryPanelProps) {
  const { userRole, profile } = useAuth();
  const isAdmin = userRole === 'admin';
  const { data: myGenerations, isLoading: myLoading } = useMyGenerations(100);
  const { data: allGenerations, isLoading: allLoading } = useAllGenerations({ limit: 100 });
  const generations = isAdmin ? allGenerations : myGenerations;
  const isLoading = isAdmin ? allLoading : myLoading;
  const invalidateGenerations = useInvalidateGenerations();
  const queryClient = useQueryClient();
  useRealtimeGenerations();

  // Fetch AI-generated media items as a fallback for generations that never got DB records
  const { data: aiMediaItems } = useQuery({
    queryKey: ['history-media-fallback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media')
        .select('id, url, title, filename, created_at, custom_metadata')
        .is('deleted_at', null)
        .eq('hidden_from_history', false)
        .contains('auto_tags', ['ai-generated'])
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const [showHidden, setShowHidden] = useState(false);

  // Fetch hidden generations (for count + show-hidden mode)
  const { data: hiddenGenerations } = useQuery({
    queryKey: ['history-hidden-generations', profile?.id, isAdmin],
    queryFn: async () => {
      let q = supabase
        .from('creative_studio_generations')
        .select('id, output_urls, generation_type, status, created_at, prompt_text, model_used, parameters, metadata, completed_at, media_ids')
        .eq('hidden_from_history', true)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!isAdmin && profile?.id) {
        q = q.or(`user_id.eq.${profile.id},user_id.is.null`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(gen => ({
        ...gen,
        parameters: gen.parameters as Record<string, unknown>,
        metadata: gen.metadata as Record<string, unknown>,
      })) as GenerationWithDetails[];
    },
    enabled: !!(profile?.id || isAdmin),
  });

  // Fetch hidden media items (for count + show-hidden mode)
  const { data: hiddenMediaItems } = useQuery({
    queryKey: ['history-hidden-media'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media')
        .select('id, url, title, filename, created_at, custom_metadata')
        .is('deleted_at', null)
        .eq('hidden_from_history', true)
        .contains('auto_tags', ['ai-generated'])
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const hiddenCount = (hiddenGenerations?.length || 0) + (hiddenMediaItems?.length || 0);

  // item.key is `${gen.id}-${idx}` for package expansions, gen.id otherwise
  interface DisplayItem {
    key: string;
    gen: GenerationWithDetails;
    displayUrl: string | undefined;
    label: string;
    isPackageItem: boolean;
    fromMedia: boolean;
    mediaId?: string;
    isHidden?: boolean;
  }

  const displayItems = useMemo<DisplayItem[]>(() => {
    const genItems: DisplayItem[] = (generations || []).flatMap<DisplayItem>(gen => {
      if (gen.generation_type === 'creative_package' && gen.output_urls && gen.output_urls.length > 1) {
        const names = gen.metadata?.deliverable_names as string[] | undefined;
        return gen.output_urls.map((url, idx) => ({
          key: `${gen.id}-${idx}`,
          gen,
          displayUrl: url,
          label: names?.[idx] || `Deliverable ${idx + 1}`,
          isPackageItem: true,
          fromMedia: false,
        }));
      }
      return [{
        key: gen.id,
        gen,
        displayUrl: gen.output_urls?.[0],
        label: gen.prompt_text || 'No prompt',
        isPackageItem: false,
        fromMedia: false,
      }];
    });

    // Build a set of all URLs already covered by generation records
    const coveredUrls = new Set<string>(
      (generations || []).flatMap(gen => gen.output_urls || [])
    );

    // Synthesize display items from media entries not already covered
    const mediaItems: DisplayItem[] = (aiMediaItems || [])
      .filter(m => !coveredUrls.has(m.url))
      .map(m => {
        const meta = m.custom_metadata as Record<string, unknown> | null;
        const genType = (meta?.generation_type as string) || 'text_to_image';
        const brandName = (meta?.brand_name as string) || '';
        const syntheticGen: GenerationWithDetails = {
          id: `media-${m.id}`,
          generation_type: genType as GenerationWithDetails['generation_type'],
          status: 'completed',
          output_urls: [m.url],
          media_ids: [],
          created_at: m.created_at,
          prompt_text: brandName ? `${brandName} creative package` : undefined,
          model_used: '',
          parameters: {},
          metadata: (meta as Record<string, unknown>) ?? {},
          completed_at: m.created_at,
        };
        return {
          key: `media-${m.id}`,
          gen: syntheticGen,
          displayUrl: m.url,
          label: m.title || m.filename || 'Generated image',
          isPackageItem: genType === 'creative_package',
          fromMedia: true,
          mediaId: m.id,
        };
      });

    const visible = [...genItems, ...mediaItems].sort(
      (a, b) => new Date(b.gen.created_at).getTime() - new Date(a.gen.created_at).getTime()
    );

    if (!showHidden) return visible;

    // Build hidden items from both sources, sorted descending
    const hiddenGenItems: DisplayItem[] = (hiddenGenerations || []).flatMap<DisplayItem>(gen => {
      if (gen.generation_type === 'creative_package' && gen.output_urls && gen.output_urls.length > 1) {
        const names = gen.metadata?.deliverable_names as string[] | undefined;
        return gen.output_urls.map((url, idx) => ({
          key: `hidden-${gen.id}-${idx}`,
          gen,
          displayUrl: url,
          label: names?.[idx] || `Deliverable ${idx + 1}`,
          isPackageItem: true,
          fromMedia: false,
          isHidden: true,
        }));
      }
      return [{
        key: `hidden-${gen.id}`,
        gen,
        displayUrl: gen.output_urls?.[0],
        label: gen.prompt_text || 'No prompt',
        isPackageItem: false,
        fromMedia: false,
        isHidden: true,
      }];
    });

    const coveredHiddenUrls = new Set<string>((hiddenGenerations || []).flatMap(g => g.output_urls || []));
    const hiddenMediaDisplayItems: DisplayItem[] = (hiddenMediaItems || [])
      .filter(m => !coveredHiddenUrls.has(m.url))
      .map(m => {
        const meta = m.custom_metadata as Record<string, unknown> | null;
        const genType = (meta?.generation_type as string) || 'text_to_image';
        const brandName = (meta?.brand_name as string) || '';
        const syntheticGen: GenerationWithDetails = {
          id: `media-${m.id}`,
          generation_type: genType as GenerationWithDetails['generation_type'],
          status: 'completed',
          output_urls: [m.url],
          media_ids: [],
          created_at: m.created_at,
          prompt_text: brandName ? `${brandName} creative package` : undefined,
          model_used: '',
          parameters: {},
          metadata: (meta as Record<string, unknown>) ?? {},
          completed_at: m.created_at,
        };
        return {
          key: `hidden-media-${m.id}`,
          gen: syntheticGen,
          displayUrl: m.url,
          label: m.title || m.filename || 'Generated image',
          isPackageItem: genType === 'creative_package',
          fromMedia: true,
          mediaId: m.id,
          isHidden: true,
        };
      });

    const hiddenItems = [...hiddenGenItems, ...hiddenMediaDisplayItems].sort(
      (a, b) => new Date(b.gen.created_at).getTime() - new Date(a.gen.created_at).getTime()
    );

    return [...visible, ...hiddenItems];
  }, [generations, aiMediaItems, showHidden, hiddenGenerations, hiddenMediaItems]);

  const [brokenThumbnails, setBrokenThumbnails] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearBroken, setConfirmClearBroken] = useState(false);
  const [infoGeneration, setInfoGeneration] = useState<GenerationWithDetails | null>(null);

  const markThumbnailBroken = useCallback((itemKey: string) => {
    setBrokenThumbnails(prev => new Set(prev).add(itemKey));
  }, []);

  const handleDeleteConfirmed = useCallback(async (generationId: string) => {
    setDeletingIds(prev => new Set(prev).add(generationId));
    try {
      const { error } = await supabase
        .from('creative_studio_generations')
        .delete()
        .eq('id', generationId);
      if (error) {
        console.error('Failed to delete generation:', error);
        toast.error('Delete failed: ' + error.message);
        return;
      }
      invalidateGenerations();
      toast.success('Deleted');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(generationId);
        return next;
      });
    }
  }, [invalidateGenerations]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  }, []);

  const handleDeleteConfirmedMedia = useCallback(async (mediaId: string) => {
    setDeletingIds(prev => new Set(prev).add(`media-${mediaId}`));
    try {
      const { error } = await supabase.rpc('admin_soft_delete_media', { media_ids: [mediaId] });
      if (error) {
        toast.error('Delete failed: ' + error.message);
        return;
      }
      invalidateGenerations();
      toast.success('Deleted');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(`media-${mediaId}`);
        return next;
      });
    }
  }, [invalidateGenerations]);

  const handleHideClick = useCallback(async (e: React.MouseEvent, item: DisplayItem) => {
    e.stopPropagation();
    if (item.fromMedia && item.mediaId) {
      const { error } = await supabase.rpc('hide_media_from_history', {
        p_media_id: item.mediaId,
        p_hidden: true,
      });
      if (error) { toast.error('Failed to hide: ' + error.message); return; }
      queryClient.invalidateQueries({ queryKey: ['history-media-fallback'] });
      queryClient.invalidateQueries({ queryKey: ['history-hidden-media'] });
    } else {
      const { error } = await supabase.rpc('hide_generation_from_history', {
        p_generation_id: item.gen.id,
        p_hidden: true,
      });
      if (error) { toast.error('Failed to hide: ' + error.message); return; }
      invalidateGenerations();
      queryClient.invalidateQueries({ queryKey: ['history-hidden-generations'] });
    }
  }, [invalidateGenerations, queryClient]);

  const handleUnhideClick = useCallback(async (e: React.MouseEvent, item: DisplayItem) => {
    e.stopPropagation();
    if (item.fromMedia && item.mediaId) {
      const { error } = await supabase.rpc('hide_media_from_history', {
        p_media_id: item.mediaId,
        p_hidden: false,
      });
      if (error) { toast.error('Failed to restore: ' + error.message); return; }
      queryClient.invalidateQueries({ queryKey: ['history-media-fallback'] });
      queryClient.invalidateQueries({ queryKey: ['history-hidden-media'] });
    } else {
      const { error } = await supabase.rpc('hide_generation_from_history', {
        p_generation_id: item.gen.id,
        p_hidden: false,
      });
      if (error) { toast.error('Failed to restore: ' + error.message); return; }
      invalidateGenerations();
      queryClient.invalidateQueries({ queryKey: ['history-hidden-generations'] });
    }
  }, [invalidateGenerations, queryClient]);

  const handleInfoClick = useCallback((e: React.MouseEvent, gen: GenerationWithDetails) => {
    e.stopPropagation();
    setInfoGeneration(gen);
  }, []);

  const handleClearBrokenConfirmed = useCallback(async () => {
    if (!generations) return;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    // Collect gen.ids where any display item for that gen is broken
    const brokenGenIds = new Set(
      displayItems
        .filter(item => brokenThumbnails.has(item.key))
        .map(item => item.gen.id)
    );
    const brokenIds = generations
      .filter(g =>
        g.status === 'failed' ||
        (g.status === 'completed' && (!g.output_urls || g.output_urls.length === 0)) ||
        (g.status === 'processing' && new Date(g.created_at) < thirtyMinutesAgo) ||
        brokenGenIds.has(g.id)
      )
      .map(g => g.id);
    if (brokenIds.length === 0) return;
    setDeletingIds(new Set(brokenIds));
    try {
      const { error } = await supabase
        .from('creative_studio_generations')
        .delete()
        .in('id', brokenIds);
      if (error) {
        console.error('Failed to clear broken generations:', error);
        toast.error('Clear failed: ' + error.message);
        return;
      }
      setBrokenThumbnails(new Set());
      invalidateGenerations();
      toast.success(`Removed ${brokenIds.length} failed item${brokenIds.length !== 1 ? 's' : ''}`);
    } finally {
      setDeletingIds(new Set());
    }
  }, [generations, brokenThumbnails, invalidateGenerations]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getGenerationTypeIcon = (type: string) => {
    if (type.includes('video')) {
      return <Video className="h-3 w-3" />;
    }
    return <Image className="h-3 w-3" />;
  };

  const convertGcsUri = (uri: string) => {
    if (uri.startsWith('gs://')) {
      return uri.replace('gs://', 'https://storage.googleapis.com/');
    }
    return uri;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">History</h3>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">History</h3>
          <div className="flex items-center gap-1">
            {(brokenThumbnails.size > 0 || generations?.some(g =>
              g.status === 'failed' ||
              (g.status === 'processing' && new Date(Date.now() - 30 * 60 * 1000) > new Date(g.created_at))
            ) || displayItems.some(item => brokenThumbnails.has(item.key))) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setConfirmClearBroken(true)}
                title="Remove broken/failed entries"
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            )}
            {hiddenCount > 0 && (
              <button
                onClick={() => setShowHidden(prev => !prev)}
                className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                  showHidden
                    ? 'bg-muted text-foreground border-border'
                    : 'text-muted-foreground border-transparent hover:border-border hover:text-foreground'
                }`}
                title={showHidden ? 'Hide hidden items' : 'Show hidden items'}
              >
                <EyeOff className="h-2.5 w-2.5" />
                {hiddenCount}
              </button>
            )}
            <Badge variant="secondary" className="text-xs">
              {showHidden ? displayItems.filter(i => !i.isHidden).length : displayItems.length}
            </Badge>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={onClose}
                title="Close history"
              >
                <PanelLeftClose className="h-3 w-3 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {displayItems.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No generations yet</p>
              <p className="text-xs mt-1">Start creating!</p>
            </div>
          ) : (
            displayItems.map((item, idx) => {
              const { gen, displayUrl, label, isPackageItem, fromMedia, mediaId, isHidden } = item;
              const isBroken = brokenThumbnails.has(item.key);
              const isDeleting = deletingIds.has(fromMedia ? `media-${mediaId}` : gen.id);
              const genToSelect = isPackageItem
                ? { ...gen, output_urls: [displayUrl!, ...(gen.output_urls || [])] }
                : gen;
              const isFirstHidden = isHidden && (idx === 0 || !displayItems[idx - 1].isHidden);
              return (
                <div key={item.key}>
                  {isFirstHidden && (
                    <div className="flex items-center gap-2 py-1 px-1">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <EyeOff className="h-2.5 w-2.5" /> Hidden
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                <button
                  onClick={() => onSelectGeneration?.(genToSelect)}
                  draggable={!!displayUrl && !isHidden}
                  onDragStart={(e) => {
                    if (!displayUrl) return;
                    const publicUrl = convertGcsUri(displayUrl);
                    e.dataTransfer.setData('text/uri-list', publicUrl);
                    e.dataTransfer.setData('text/plain', publicUrl);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className={`w-full text-left rounded-lg overflow-hidden border transition-all hover:border-primary cursor-grab active:cursor-grabbing ${
                    isHidden ? 'opacity-50' : ''
                  } ${
                    selectedId === gen.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square bg-muted group/thumb">
                    {displayUrl && !isBroken ? (
                      gen.generation_type.includes('video') ? (
                        <video
                          src={convertGcsUri(displayUrl)}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                          onLoadedData={(e) => {
                            const video = e.currentTarget;
                            if (video.duration > 0.1) video.currentTime = 0.1;
                          }}
                          onError={() => markThumbnailBroken(item.key)}
                        />
                      ) : (
                        <img
                          src={convertGcsUri(displayUrl)}
                          alt={label.substring(0, 50)}
                          className="w-full h-full object-cover"
                          onError={() => markThumbnailBroken(item.key)}
                        />
                      )
                    ) : gen.status === 'processing' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : isBroken ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                        <ImageOff className="h-5 w-5 mb-1 opacity-50" />
                        <span className="text-[8px] opacity-50">Expired</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getGenerationTypeIcon(gen.generation_type)}
                      </div>
                    )}

                    {/* Status indicator */}
                    <div
                      className={`absolute top-1 right-1 w-2 h-2 rounded-full ${getStatusColor(gen.status)}`}
                    />

                    {/* Action buttons — visible on hover */}
                    <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleInfoClick(e, gen)}
                        className="w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-primary"
                        title="View details"
                      >
                        <Info className="h-2.5 w-2.5" />
                      </button>
                      {isHidden ? (
                        <button
                          onClick={(e) => handleUnhideClick(e, item)}
                          className="w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-green-600"
                          title="Restore to history"
                        >
                          <Eye className="h-2.5 w-2.5" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleHideClick(e, item)}
                          className="w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-yellow-600"
                          title="Hide from history"
                        >
                          <EyeOff className="h-2.5 w-2.5" />
                        </button>
                      )}
                      {(fromMedia ? !!mediaId : true) && (
                        <button
                          onClick={(e) => handleDeleteClick(e, fromMedia ? `media-${mediaId}` : gen.id)}
                          disabled={isDeleting}
                          className="w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600"
                          title="Delete generation"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-2.5 w-2.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Type badge */}
                    <div className="absolute bottom-1 left-1 flex gap-0.5">
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1 py-0 bg-black/50 text-white"
                      >
                        {getGenerationTypeIcon(gen.generation_type)}
                      </Badge>
                      {isPackageItem && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1 py-0 bg-primary/70 text-white"
                        >
                          PKG
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-1.5 bg-background">
                    <p className="text-[10px] text-muted-foreground truncate">
                      {label.substring(0, 30)}
                    </p>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {formatTime(gen.created_at)}
                    </div>
                  </div>
                </button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Delete single item confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete generation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this generation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDeleteId) {
                  if (confirmDeleteId.startsWith('media-')) {
                    handleDeleteConfirmedMedia(confirmDeleteId.slice(6));
                  } else {
                    handleDeleteConfirmed(confirmDeleteId);
                  }
                }
                setConfirmDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear broken/failed confirmation */}
      <AlertDialog open={confirmClearBroken} onOpenChange={setConfirmClearBroken}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove broken entries?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all failed and broken generations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                handleClearBrokenConfirmed();
                setConfirmClearBroken(false);
              }}
            >
              Remove All Broken
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generation details dialog */}
      <GenerationInfoDialog
        generation={infoGeneration}
        onClose={() => setInfoGeneration(null)}
      />
    </div>
  );
}
