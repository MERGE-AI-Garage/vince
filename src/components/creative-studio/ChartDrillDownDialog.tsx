// ABOUTME: Drill-down dialog for analytics charts — shows matching generations when a chart element is clicked
// ABOUTME: Sortable columns, clickable image/video previews, prompt popup, keyword/prompt drill-downs

import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Film,
  Image,
  Loader2,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGenerationsByFilter } from '@/hooks/useCreativeStudioGenerations';
import type { GenerationWithDetails } from '@/types/creative-studio';

export interface ChartDrillDown {
  source: 'trend' | 'type' | 'model' | 'cost' | 'keyword' | 'prompt';
  filterKey: 'date' | 'type' | 'model' | 'promptSearch' | 'promptExact';
  filterValue: string;
  label: string;
}

type SortField = 'user' | 'type' | 'model' | 'time' | 'cost' | 'created';
type SortDir = 'asc' | 'desc';

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'];

function convertGcsUri(uri: string) {
  if (uri.startsWith('gs://')) {
    return uri.replace('gs://', 'https://storage.googleapis.com/');
  }
  return uri;
}

function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getUserName(gen: GenerationWithDetails): string {
  const user = gen.user as { full_name: string } | null;
  return user?.full_name || 'Unknown';
}

function sortGenerations(
  gens: GenerationWithDetails[],
  field: SortField,
  dir: SortDir
): GenerationWithDetails[] {
  return [...gens].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'user':
        cmp = getUserName(a).localeCompare(getUserName(b));
        break;
      case 'type':
        cmp = a.generation_type.localeCompare(b.generation_type);
        break;
      case 'model':
        cmp = a.model_used.localeCompare(b.model_used);
        break;
      case 'time':
        cmp = (a.generation_time_ms || 0) - (b.generation_time_ms || 0);
        break;
      case 'cost':
        cmp = (Number(a.estimated_cost_usd) || 0) - (Number(b.estimated_cost_usd) || 0);
        break;
      case 'created':
        cmp = a.created_at.localeCompare(b.created_at);
        break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ── Sortable column header ───────────────────────────────────────────────────

function SortableHead({
  label,
  field,
  currentField,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentField === field;
  return (
    <TableHead className={className}>
      <button
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors text-xs"
        onClick={() => onSort(field)}
      >
        {label}
        {isActive ? (
          currentDir === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

// ── Image/Video lightbox ─────────────────────────────────────────────────────

function MediaLightbox({
  src,
  isVideo,
  onClose,
}: {
  src: string;
  isVideo: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8 cursor-zoom-out"
      onClick={onClose}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20 h-10 w-10 z-10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>
      {isVideo ? (
        <video
          src={src}
          controls
          autoPlay
          className="max-w-full max-h-full rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={src}
          alt=""
          className="max-w-full max-h-full rounded-lg object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}

// ── Prompt popup ─────────────────────────────────────────────────────────────

function PromptDialog({
  prompt,
  onClose,
}: {
  prompt: string;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[60vh] brand-guidelines-panel">
        <DialogHeader>
          <DialogTitle>Full Prompt</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[45vh] text-sm whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-lg p-4">
          {prompt}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main dialog ──────────────────────────────────────────────────────────────

export function ChartDrillDownDialog({
  drillDown,
  onClose,
}: {
  drillDown: ChartDrillDown | null;
  onClose: () => void;
}) {
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxIsVideo, setLightboxIsVideo] = useState(false);
  const [promptPopup, setPromptPopup] = useState<string | null>(null);

  const filter = useMemo(() => {
    if (!drillDown) return null;
    return {
      date: drillDown.filterKey === 'date' ? drillDown.filterValue : undefined,
      type: drillDown.filterKey === 'type' ? drillDown.filterValue : undefined,
      model: drillDown.filterKey === 'model' ? drillDown.filterValue : undefined,
      promptSearch: drillDown.filterKey === 'promptSearch' ? drillDown.filterValue : undefined,
      promptExact: drillDown.filterKey === 'promptExact' ? drillDown.filterValue : undefined,
    };
  }, [drillDown]);

  const { data: generations, isLoading } = useGenerationsByFilter(filter);

  const summary = useMemo(() => {
    if (!generations?.length) return null;
    const totalCost = generations.reduce((sum, g) => sum + (Number(g.estimated_cost_usd) || 0), 0);
    const uniqueUsers = new Set(generations.map(g => g.user_id)).size;
    return { count: generations.length, cost: totalCost, users: uniqueUsers };
  }, [generations]);

  const sorted = useMemo(() => {
    if (!generations) return [];
    return sortGenerations(generations, sortField, sortDir);
  }, [generations, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function openMedia(url: string) {
    const video = isVideoUrl(url);
    setLightboxIsVideo(video);
    setLightboxSrc(url);
  }

  return (
    <>
      <Dialog open={!!drillDown} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col [&>button.absolute]:hidden brand-guidelines-panel">
          {drillDown && (
            <>
              <DialogHeader className="border-b pb-4 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="capitalize">{drillDown.label}</DialogTitle>
                    <DialogDescription>
                      {summary
                        ? `${summary.count} generation${summary.count !== 1 ? 's' : ''} · ${summary.users} user${summary.users !== 1 ? 's' : ''} · $${summary.cost.toFixed(2)} estimated cost`
                        : 'Loading...'}
                    </DialogDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto min-h-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : sorted.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No generations found</p>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[50px]">Preview</TableHead>
                        <SortableHead label="User" field="user" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                        <SortableHead label="Type" field="type" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                        <SortableHead label="Model" field="model" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                        <TableHead className="max-w-[200px]">Prompt</TableHead>
                        <TableHead>Status</TableHead>
                        <SortableHead label="Time" field="time" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                        <SortableHead label="Cost" field="cost" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                        <SortableHead label="Created" field="created" currentField={sortField} currentDir={sortDir} onSort={handleSort} />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sorted.map((gen) => {
                        const user = gen.user as { full_name: string; avatar_url?: string; email?: string } | null;
                        const rawUrl = gen.output_urls?.[0];
                        const previewUrl = rawUrl ? convertGcsUri(rawUrl) : null;
                        const isVideo = previewUrl ? isVideoUrl(previewUrl) : false;
                        return (
                          <TableRow key={gen.id}>
                            <TableCell>
                              {previewUrl ? (
                                <button
                                  className="relative group cursor-zoom-in"
                                  onClick={() => openMedia(previewUrl)}
                                >
                                  {isVideo ? (
                                    <div className="w-10 h-10 rounded bg-purple-500/10 flex items-center justify-center">
                                      <Film className="h-4 w-4 text-purple-500" />
                                    </div>
                                  ) : (
                                    <img
                                      src={previewUrl}
                                      alt=""
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                  )}
                                  <div className="absolute inset-0 rounded bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                                    <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </button>
                              ) : (
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                  <Image className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                                  {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-primary font-medium text-[10px]">
                                      {(user?.full_name || '?')
                                        .split(' ')
                                        .map(n => n[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs truncate max-w-[100px]">{user?.full_name || 'Unknown'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {gen.generation_type.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{gen.model_used}</TableCell>
                            <TableCell>
                              {gen.prompt_text ? (
                                <button
                                  className="text-xs truncate max-w-[200px] block text-left hover:text-primary hover:underline transition-colors cursor-pointer"
                                  onClick={() => setPromptPopup(gen.prompt_text!)}
                                >
                                  {gen.prompt_text.substring(0, 60)}...
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {gen.status === 'completed' ? (
                                <Badge className="bg-green-500/20 text-green-600 border-green-500/50 text-[10px]">
                                  <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                                  Done
                                </Badge>
                              ) : gen.status === 'failed' ? (
                                <Badge variant="destructive" className="text-[10px]">Failed</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">{gen.status}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {gen.generation_time_ms != null
                                ? `${(gen.generation_time_ms / 1000).toFixed(1)}s`
                                : '-'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {gen.estimated_cost_usd != null && Number(gen.estimated_cost_usd) > 0
                                ? `$${Number(gen.estimated_cost_usd).toFixed(3)}`
                                : '-'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(gen.created_at)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-size media lightbox */}
      {lightboxSrc && (
        <MediaLightbox
          src={lightboxSrc}
          isVideo={lightboxIsVideo}
          onClose={() => setLightboxSrc(null)}
        />
      )}

      {/* Full prompt text popup */}
      {promptPopup && (
        <PromptDialog
          prompt={promptPopup}
          onClose={() => setPromptPopup(null)}
        />
      )}
    </>
  );
}
