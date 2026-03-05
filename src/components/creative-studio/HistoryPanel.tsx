// ABOUTME: Sidebar panel showing user's generation history
// ABOUTME: Thumbnails of recent generations with click to load

import { useState, useCallback } from 'react';
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
import { Image, Video, Clock, ChevronRight, Loader2, ImageOff, Trash2, Info, PanelLeftClose } from 'lucide-react';
import { useMyGenerations, useInvalidateGenerations } from '@/hooks/useCreativeStudioGenerations';
import { supabase } from '@/integrations/supabase/client';
import { GenerationInfoDialog } from './GenerationInfoDialog';
import type { GenerationWithDetails } from '@/types/creative-studio';

interface HistoryPanelProps {
  onSelectGeneration?: (generation: GenerationWithDetails) => void;
  selectedId?: string;
  onClose?: () => void;
}

export function HistoryPanel({ onSelectGeneration, selectedId, onClose }: HistoryPanelProps) {
  const { data: generations, isLoading } = useMyGenerations(100);
  const invalidateGenerations = useInvalidateGenerations();
  const [brokenThumbnails, setBrokenThumbnails] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearBroken, setConfirmClearBroken] = useState(false);
  const [infoGeneration, setInfoGeneration] = useState<GenerationWithDetails | null>(null);

  const markThumbnailBroken = useCallback((generationId: string) => {
    setBrokenThumbnails(prev => new Set(prev).add(generationId));
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
        return;
      }
      invalidateGenerations();
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(generationId);
        return next;
      });
    }
  }, [invalidateGenerations]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, generationId: string) => {
    e.stopPropagation();
    setConfirmDeleteId(generationId);
  }, []);

  const handleInfoClick = useCallback((e: React.MouseEvent, gen: GenerationWithDetails) => {
    e.stopPropagation();
    setInfoGeneration(gen);
  }, []);

  const handleClearBrokenConfirmed = useCallback(async () => {
    if (!generations) return;
    const brokenIds = generations
      .filter(g =>
        g.status === 'failed' ||
        (g.status === 'completed' && (!g.output_urls || g.output_urls.length === 0)) ||
        brokenThumbnails.has(g.id)
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
        return;
      }
      setBrokenThumbnails(new Set());
      invalidateGenerations();
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

  const handleDragStart = (e: React.DragEvent, gen: GenerationWithDetails) => {
    const url = gen.output_urls?.[0];
    if (!url) return;
    const publicUrl = convertGcsUri(url);
    e.dataTransfer.setData('text/uri-list', publicUrl);
    e.dataTransfer.setData('text/plain', publicUrl);
    e.dataTransfer.effectAllowed = 'copy';
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
            {(brokenThumbnails.size > 0 || generations?.some(g => g.status === 'failed')) && (
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
            <Badge variant="secondary" className="text-xs">
              {generations?.length || 0}
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
          {generations?.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No generations yet</p>
              <p className="text-xs mt-1">Start creating!</p>
            </div>
          ) : (
            generations?.map((gen) => (
              <button
                key={gen.id}
                onClick={() => onSelectGeneration?.(gen)}
                draggable={!!gen.output_urls?.[0]}
                onDragStart={(e) => handleDragStart(e, gen)}
                className={`w-full text-left rounded-lg overflow-hidden border transition-all hover:border-primary cursor-grab active:cursor-grabbing ${
                  selectedId === gen.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-transparent'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-square bg-muted group/thumb">
                  {gen.output_urls?.[0] && !brokenThumbnails.has(gen.id) ? (
                    gen.generation_type.includes('video') ? (
                      <video
                        src={convertGcsUri(gen.output_urls[0])}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                        onLoadedData={(e) => {
                          // Seek to 0.1s to capture a frame for thumbnail
                          const video = e.currentTarget;
                          if (video.duration > 0.1) video.currentTime = 0.1;
                        }}
                        onError={() => markThumbnailBroken(gen.id)}
                      />
                    ) : (
                      <img
                        src={convertGcsUri(gen.output_urls[0])}
                        alt={gen.prompt_text?.substring(0, 50) || 'Generation'}
                        className="w-full h-full object-cover"
                        onError={() => markThumbnailBroken(gen.id)}
                      />
                    )
                  ) : gen.status === 'processing' ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : brokenThumbnails.has(gen.id) ? (
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
                    <button
                      onClick={(e) => handleDeleteClick(e, gen.id)}
                      disabled={deletingIds.has(gen.id)}
                      className="w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600"
                      title="Delete generation"
                    >
                      {deletingIds.has(gen.id) ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-2.5 w-2.5" />
                      )}
                    </button>
                  </div>

                  {/* Type badge */}
                  <div className="absolute bottom-1 left-1">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1 py-0 bg-black/50 text-white"
                    >
                      {getGenerationTypeIcon(gen.generation_type)}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-1.5 bg-background">
                  <p className="text-[10px] text-muted-foreground truncate">
                    {gen.prompt_text?.substring(0, 30) || 'No prompt'}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {formatTime(gen.created_at)}
                  </div>
                </div>
              </button>
            ))
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
                if (confirmDeleteId) handleDeleteConfirmed(confirmDeleteId);
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
