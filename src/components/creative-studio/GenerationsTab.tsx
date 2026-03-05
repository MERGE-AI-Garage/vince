// ABOUTME: Full-featured generations browser for Creative Studio admin
// ABOUTME: Card/list view, filters, generation detail dialog, per-user drill-down

import { useState, useMemo } from 'react';
import {
  Image,
  Video,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  List,
  LayoutGrid,
  ExternalLink,
  User,
  Users,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  Copy,
  Check,
  Cpu,
  SlidersHorizontal,
  AlertTriangle,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAllGenerations } from '@/hooks/useCreativeStudioGenerations';
import { useAllCreativeStudioModels } from '@/hooks/useCreativeStudioModels';
import { useAllCreativeStudioBrands } from '@/hooks/useCreativeStudioBrands';
import type { GenerationWithDetails, GenerationStatus, GenerationType } from '@/types/creative-studio';
import { TabHeroHeader } from '@/components/creative-studio/TabHeroHeader';
import { MergeLogo } from '@/components/ai-pulse/vendorLogos';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeDate(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function getStatusBadge(status: GenerationStatus) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-500/20 text-green-600 border-green-500/50">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case 'processing':
      return (
        <Badge variant="secondary">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function convertGcsUri(uri: string) {
  if (uri.startsWith('gs://')) {
    return uri.replace('gs://', 'https://storage.googleapis.com/');
  }
  return uri;
}

type SortField = 'newest' | 'oldest' | 'duration' | 'cost';
type SortColumn = 'created_at' | 'generation_time_ms' | 'estimated_cost_usd' | 'status' | 'model_used';
type SortDirection = 'asc' | 'desc';

// ── Sortable table header ────────────────────────────────────────────────────

function SortableHeader({
  column,
  label,
  currentColumn,
  currentDirection,
  onSort,
}: {
  column: SortColumn;
  label: string;
  currentColumn: SortColumn;
  currentDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}) {
  return (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {currentColumn === column ? (
          currentDirection === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </div>
    </TableHead>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function GenerationsTab() {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortField>('newest');
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationWithDetails | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data: generations, isLoading } = useAllGenerations({ limit: 200 });
  const { data: models } = useAllCreativeStudioModels();
  const { data: brands } = useAllCreativeStudioBrands();

  // Get unique users from generations for filter dropdown
  const uniqueUsers = useMemo(() => {
    if (!generations) return [];
    const seen = new Map<string, string>();
    for (const g of generations) {
      if (g.user_id && g.user?.full_name && !seen.has(g.user_id)) {
        seen.set(g.user_id, g.user.full_name);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [generations]);

  const [userFilter, setUserFilter] = useState('all');

  const handleTableSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Filter + sort
  const filteredGenerations = useMemo(() => {
    if (!generations) return [];

    let result = [...generations];

    if (statusFilter !== 'all') {
      result = result.filter(g => g.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      result = result.filter(g => g.generation_type === typeFilter);
    }
    if (modelFilter !== 'all') {
      result = result.filter(g => g.model_used === modelFilter);
    }
    if (userFilter !== 'all') {
      result = result.filter(g => g.user_id === userFilter);
    }

    // Sort for card view
    if (viewMode === 'card') {
      result.sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return a.created_at.localeCompare(b.created_at);
          case 'duration':
            return (b.generation_time_ms || 0) - (a.generation_time_ms || 0);
          case 'cost':
            return (Number(b.estimated_cost_usd) || 0) - (Number(a.estimated_cost_usd) || 0);
          default:
            return b.created_at.localeCompare(a.created_at);
        }
      });
    } else {
      // Sort for list view (table)
      result.sort((a, b) => {
        const dir = sortDirection === 'asc' ? 1 : -1;
        switch (sortColumn) {
          case 'created_at':
            return dir * a.created_at.localeCompare(b.created_at);
          case 'generation_time_ms':
            return dir * ((a.generation_time_ms || 0) - (b.generation_time_ms || 0));
          case 'estimated_cost_usd':
            return dir * ((Number(a.estimated_cost_usd) || 0) - (Number(b.estimated_cost_usd) || 0));
          case 'status':
            return dir * a.status.localeCompare(b.status);
          case 'model_used':
            return dir * a.model_used.localeCompare(b.model_used);
          default:
            return 0;
        }
      });
    }

    return result;
  }, [generations, statusFilter, typeFilter, modelFilter, userFilter, sortBy, viewMode, sortColumn, sortDirection]);

  // Unique generation types for filter
  const uniqueTypes = useMemo(() => {
    if (!generations) return [];
    return [...new Set(generations.map(g => g.generation_type))];
  }, [generations]);

  const uniqueModels = useMemo(() => {
    if (!generations) return [];
    return [...new Set(generations.map(g => g.model_used))];
  }, [generations]);

  // Aggregate stats for hero header
  const stats = useMemo(() => {
    if (!generations || generations.length === 0) return null;
    const completed = generations.filter(g => g.status === 'completed');
    const totalCost = generations.reduce((sum, g) => sum + (Number(g.estimated_cost_usd) || 0), 0);
    const avgTime = completed.length > 0
      ? completed.reduce((sum, g) => sum + (g.generation_time_ms || 0), 0) / completed.length / 1000
      : 0;
    const imageCount = generations.filter(g => g.generation_type === 'text_to_image' || g.generation_type === 'image_to_image').length;
    const videoCount = generations.filter(g => g.generation_type === 'text_to_video' || g.generation_type === 'image_to_video').length;

    return {
      total: generations.length,
      completed: completed.length,
      successRate: Math.round((completed.length / generations.length) * 100),
      totalCost,
      avgTime,
      imageCount,
      videoCount,
      modelCount: uniqueModels.length,
      userCount: uniqueUsers.length,
    };
  }, [generations, uniqueModels, uniqueUsers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero header with stats */}
      <TabHeroHeader
        gradientLight="from-[#edf2f7] via-[#e2e8f0] to-[#cbd5e0]"
        gradientDark="dark:from-[#0f1318] dark:via-[#131a22] dark:to-[#171f2b]"
        watermark={<Image className="w-full h-full" />}
        watermarkSmall={<MergeLogo className="w-full h-full" />}
        badgeIcon={<Sparkles className="w-4 h-4 text-gray-700 dark:text-white/80" />}
        badgeLabel="Generation Activity"
        title="Generations"
        subtitle={stats
          ? `${stats.imageCount} images · ${stats.videoCount} videos · ${stats.modelCount} models · ${stats.userCount} users`
          : 'Image and video generation history'
        }
        actions={stats ? (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-white/60">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span className="font-medium">{stats.successRate}%</span> success
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-white/60">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">{stats.avgTime.toFixed(1)}s</span> avg
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-white/60">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="font-medium">${stats.totalCost.toFixed(2)}</span> total
            </div>
          </div>
        ) : undefined}
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map(t => (
              <SelectItem key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={modelFilter} onValueChange={setModelFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            {uniqueModels.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {uniqueUsers.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort (card mode) */}
        {viewMode === 'card' && (
          <div className="ml-auto flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
                <SelectItem value="cost">Cost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* View toggle */}
        <div className={`flex items-center gap-1 border rounded-md p-1 ${viewMode === 'card' ? '' : 'ml-auto'}`}>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-7 w-7 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'card' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('card')}
            className="h-7 w-7 p-0"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredGenerations.length} generation{filteredGenerations.length !== 1 ? 's' : ''}
        {(statusFilter !== 'all' || typeFilter !== 'all' || modelFilter !== 'all' || userFilter !== 'all') &&
          ` (filtered from ${generations?.length || 0})`}
      </p>

      {/* Card view */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGenerations.map((gen) => (
            <Card
              key={gen.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
              onClick={() => setSelectedGeneration(gen)}
            >
              {/* Thumbnail */}
              <div className="relative h-40 bg-muted">
                {gen.output_urls?.[0] ? (
                  gen.generation_type.includes('video') ? (
                    <video
                      src={convertGcsUri(gen.output_urls[0])}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={convertGcsUri(gen.output_urls[0])}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {gen.status === 'processing' ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : gen.status === 'failed' ? (
                      <XCircle className="h-8 w-8 text-destructive/50" />
                    ) : (
                      <Image className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>
                )}
                {/* Status overlay */}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(gen.status)}
                </div>
                {/* Type badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[10px]">
                    {gen.generation_type.includes('video') ? (
                      <Video className="h-3 w-3 mr-1" />
                    ) : (
                      <Image className="h-3 w-3 mr-1" />
                    )}
                    {gen.generation_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
                {/* Output count */}
                {gen.output_urls?.length > 1 && (
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[10px]">
                      {gen.output_urls.length} outputs
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-3 space-y-2">
                {/* User + model */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {gen.user?.avatar_url ? (
                        <img src={gen.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <span className="text-sm font-medium truncate">
                      {gen.user?.full_name || 'Unknown'}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{gen.model_used}</Badge>
                </div>

                {/* Prompt preview */}
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                  {gen.prompt_text || 'No prompt'}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t">
                  {gen.generation_time_ms != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {(gen.generation_time_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                  {gen.estimated_cost_usd != null && Number(gen.estimated_cost_usd) > 0 && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${Number(gen.estimated_cost_usd).toFixed(3)}
                    </span>
                  )}
                  <span className="ml-auto">{formatRelativeDate(gen.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Preview</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <SortableHeader
                      column="model_used"
                      label="Model"
                      currentColumn={sortColumn}
                      currentDirection={sortDirection}
                      onSort={handleTableSort}
                    />
                    <TableHead className="max-w-[200px]">Prompt</TableHead>
                    <SortableHeader
                      column="status"
                      label="Status"
                      currentColumn={sortColumn}
                      currentDirection={sortDirection}
                      onSort={handleTableSort}
                    />
                    <SortableHeader
                      column="generation_time_ms"
                      label="Time"
                      currentColumn={sortColumn}
                      currentDirection={sortDirection}
                      onSort={handleTableSort}
                    />
                    <SortableHeader
                      column="estimated_cost_usd"
                      label="Cost"
                      currentColumn={sortColumn}
                      currentDirection={sortDirection}
                      onSort={handleTableSort}
                    />
                    <SortableHeader
                      column="created_at"
                      label="Created"
                      currentColumn={sortColumn}
                      currentDirection={sortDirection}
                      onSort={handleTableSort}
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGenerations.map((gen) => (
                    <TableRow
                      key={gen.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedGeneration(gen)}
                    >
                      <TableCell>
                        {gen.output_urls?.[0] ? (
                          <img
                            src={convertGcsUri(gen.output_urls[0])}
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            {gen.status === 'processing' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Image className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {gen.user?.avatar_url ? (
                              <img src={gen.user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="h-3 w-3 text-primary" />
                            )}
                          </div>
                          <span className="text-sm">{gen.user?.full_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {gen.generation_type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{gen.model_used}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs truncate max-w-[200px] block">
                          {gen.prompt_text?.substring(0, 60) || '-'}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(gen.status)}</TableCell>
                      <TableCell>
                        {gen.generation_time_ms != null ? (
                          <span className="text-xs">{(gen.generation_time_ms / 1000).toFixed(1)}s</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {gen.estimated_cost_usd != null && Number(gen.estimated_cost_usd) > 0 ? (
                          <Badge variant="outline" className="text-[10px] text-green-600">
                            <DollarSign className="h-2.5 w-2.5 mr-0.5" />
                            {Number(gen.estimated_cost_usd).toFixed(3)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeDate(gen.created_at)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {filteredGenerations.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">No generations found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}

      {/* Generation Detail Dialog */}
      <GenerationDetailDialog
        generation={selectedGeneration}
        onClose={() => setSelectedGeneration(null)}
      />
    </div>
  );
}

// ── Generation Detail Dialog ─────────────────────────────────────────────────

function buildCopyText(gen: GenerationWithDetails): string {
  const lines: string[] = [];
  lines.push(`Generation: ${gen.id}`);
  lines.push(`Status: ${gen.status}`);
  lines.push(`Type: ${gen.generation_type.replace(/_/g, ' ')}`);
  lines.push(`Model: ${gen.model_used}`);
  lines.push(`User: ${gen.user?.full_name || 'Unknown'}`);
  lines.push(`Created: ${formatDate(gen.created_at)}`);
  if (gen.completed_at) lines.push(`Completed: ${formatDate(gen.completed_at)}`);
  if (gen.generation_time_ms != null) {
    lines.push(`Generation Time: ${(gen.generation_time_ms / 1000).toFixed(2)}s`);
  }
  if (gen.estimated_cost_usd != null) {
    lines.push(`Estimated Cost: $${Number(gen.estimated_cost_usd).toFixed(4)}`);
  }
  if (gen.brand_id) {
    lines.push(`Brand: ${gen.brand?.name || gen.brand_id}`);
  }
  if (gen.prompt_text) {
    lines.push(`\nPrompt:\n${gen.prompt_text}`);
  }
  if (gen.negative_prompt) {
    lines.push(`\nNegative Prompt:\n${gen.negative_prompt}`);
  }
  if (gen.error_message) {
    lines.push(`\nError:\n${gen.error_message}`);
  }
  if (gen.parameters && Object.keys(gen.parameters).length > 0) {
    lines.push(`\nParameters:\n${JSON.stringify(gen.parameters, null, 2)}`);
  }
  if (gen.metadata && Object.keys(gen.metadata).length > 0) {
    lines.push(`\nMetadata:\n${JSON.stringify(gen.metadata, null, 2)}`);
  }
  return lines.join('\n');
}

function GenerationDetailDialog({
  generation,
  onClose,
}: {
  generation: GenerationWithDetails | null;
  onClose: () => void;
}) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!generation) return null;

  const isVideo = generation.generation_type.includes('video');
  const outputUrls = (generation.output_urls || []).map(convertGcsUri);

  const handleCopyPrompt = async () => {
    if (!generation.prompt_text) return;
    await navigator.clipboard.writeText(generation.prompt_text);
    setCopiedPrompt(true);
    toast.success('Prompt copied');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(buildCopyText(generation));
    setCopiedAll(true);
    toast.success('Generation details copied');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <Dialog open={!!generation} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start gap-4">
            {/* User avatar */}
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              {generation.user?.avatar_url ? (
                <img src={generation.user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl">Generation Details</DialogTitle>
              <DialogDescription className="mt-1">
                {generation.user?.full_name || 'Unknown User'} — {formatDate(generation.created_at)}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleCopyAll}
              >
                {copiedAll ? (
                  <><Check className="h-3 w-3 mr-1" /> Copied</>
                ) : (
                  <><Copy className="h-3 w-3 mr-1" /> Copy All</>
                )}
              </Button>
              {getStatusBadge(generation.status)}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-6 pt-4 pb-2">
            {/* Output preview */}
            {outputUrls.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {isVideo ? <Video className="h-3.5 w-3.5 text-muted-foreground" /> : <Image className="h-3.5 w-3.5 text-muted-foreground" />}
                  <h3 className="text-sm font-medium">Output{outputUrls.length > 1 ? 's' : ''}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {outputUrls.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border bg-muted">
                      {isVideo ? (
                        <video
                          src={url}
                          className="w-full max-h-[300px] object-contain"
                          controls
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={url}
                          alt={`Output ${i + 1}`}
                          className="w-full max-h-[300px] object-contain"
                        />
                      )}
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt */}
            {generation.prompt_text && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Prompt</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleCopyPrompt}
                  >
                    {copiedPrompt ? (
                      <><Check className="h-3 w-3 mr-1" /> Copied</>
                    ) : (
                      <><Copy className="h-3 w-3 mr-1" /> Copy</>
                    )}
                  </Button>
                </div>
                <div className="bg-muted/50 border border-l-4 border-l-primary/30 rounded-lg p-4 whitespace-pre-wrap text-sm">
                  {generation.prompt_text}
                </div>
              </div>
            )}

            {/* Negative prompt */}
            {generation.negative_prompt && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">Negative Prompt</h3>
                </div>
                <div className="bg-muted/50 border rounded-lg p-3 whitespace-pre-wrap text-xs font-mono">
                  {generation.negative_prompt}
                </div>
              </div>
            )}

            {/* Technical details grid */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-sm font-medium">Technical Details</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-muted/30 border rounded-lg p-4">
                <DetailItem label="Model" value={generation.model_used} />
                <DetailItem label="Type" value={generation.generation_type.replace(/_/g, ' ')} />
                <DetailItem label="Status" value={generation.status} />
                {generation.generation_time_ms != null && (
                  <DetailItem
                    label="Generation Time"
                    value={`${(generation.generation_time_ms / 1000).toFixed(2)}s`}
                  />
                )}
                {generation.estimated_cost_usd != null && (
                  <DetailItem
                    label="Estimated Cost"
                    value={`$${Number(generation.estimated_cost_usd).toFixed(4)}`}
                  />
                )}
                {generation.actual_cost_usd != null && (
                  <DetailItem
                    label="Actual Cost"
                    value={`$${Number(generation.actual_cost_usd).toFixed(4)}`}
                  />
                )}
                <DetailItem label="Created" value={formatDate(generation.created_at)} />
                {generation.completed_at && (
                  <DetailItem label="Completed" value={formatDate(generation.completed_at)} />
                )}
                <DetailItem label="Generation ID" value={generation.id.substring(0, 12) + '...'} mono />
                {generation.brand_id && (
                  <DetailItem
                    label="Brand"
                    value={generation.brand?.name || generation.brand_id.substring(0, 8) + '...'}
                  />
                )}
                {generation.user_id && (
                  <DetailItem label="User ID" value={generation.user_id.substring(0, 12) + '...'} mono />
                )}
              </div>
            </div>

            {/* Generation time progress */}
            {generation.generation_time_ms != null && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Generation Time</span>
                  <span>{(generation.generation_time_ms / 1000).toFixed(1)}s / 30s</span>
                </div>
                <Progress value={Math.min((generation.generation_time_ms / 30000) * 100, 100)} className="h-2" />
              </div>
            )}

            {/* Error message */}
            {generation.error_message && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <h3 className="text-sm font-medium text-destructive">Error</h3>
                </div>
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-sm">
                  {generation.error_message}
                </div>
              </div>
            )}

            {/* Parameters */}
            {generation.parameters && Object.keys(generation.parameters).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Parameters</h3>
                </div>
                <div className="bg-muted/50 border rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                    {Object.entries(generation.parameters as Record<string, unknown>)
                      .filter(([, val]) => val !== undefined && val !== null && val !== '')
                      .map(([key, val]) => (
                        <div key={key} className="flex justify-between gap-2">
                          <span className="text-muted-foreground whitespace-nowrap">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium truncate font-mono">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            {generation.metadata && Object.keys(generation.metadata).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Metadata</h3>
                </div>
                <pre className="text-xs font-mono bg-muted/50 border rounded-lg p-4 overflow-auto max-h-[200px] leading-relaxed">
                  {JSON.stringify(generation.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── Detail item helper ───────────────────────────────────────────────────────

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  );
}
