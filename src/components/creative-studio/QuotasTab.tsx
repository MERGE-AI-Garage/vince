// ABOUTME: Admin tab for managing per-user Creative Studio generation quotas
// ABOUTME: Sortable table with search, real cost tracking, user detail dialog, and quota editing

import { useState, useMemo } from 'react';
import {
  Users,
  Pencil,
  Loader2,
  DollarSign,
  Search,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Image,
  Video,
  CheckCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  useAllUsersQuotaUsage,
  useUpdateUserQuotaLimit,
  useWeeklyUserCosts,
} from '@/hooks/useCreativeStudioQuota';
import { useGenerationsByUser } from '@/hooks/useCreativeStudioGenerations';
import type { UserQuotaDisplay, GenerationWithDetails } from '@/types/creative-studio';
import type { WeeklyUserCost } from '@/hooks/useCreativeStudioQuota';
import { TabHeroHeader } from '@/components/creative-studio/TabHeroHeader';
import { MergeLogo } from '@/components/ai-pulse/vendorLogos';

// ── Types ────────────────────────────────────────────────────────────────────

type QuotaSortColumn = 'full_name' | 'image_generations_used' | 'video_generations_used' | 'cost' | 'status';
type SortDirection = 'asc' | 'desc';

interface EditingQuotaUser {
  user_id: string;
  full_name: string;
  image_limit: number;
  video_limit: number;
  is_unlimited: boolean;
}

interface SelectedUser {
  user_id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  is_unlimited: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getQuotaColor(used: number, limit: number, isUnlimited: boolean): string {
  if (isUnlimited) return 'bg-purple-500';
  const pct = limit > 0 ? (used / limit) * 100 : 0;
  if (pct >= 100) return 'bg-red-500';
  if (pct >= 80) return 'bg-orange-500';
  return 'bg-green-500';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function convertGcsUri(uri: string) {
  if (uri.startsWith('gs://')) {
    return uri.replace('gs://', 'https://storage.googleapis.com/');
  }
  return uri;
}

// ── Sortable header ──────────────────────────────────────────────────────────

function SortableHeader({
  column,
  label,
  currentColumn,
  currentDirection,
  onSort,
}: {
  column: QuotaSortColumn;
  label: string;
  currentColumn: QuotaSortColumn;
  currentDirection: SortDirection;
  onSort: (column: QuotaSortColumn) => void;
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

// ── User Detail Dialog ───────────────────────────────────────────────────────

function UserDetailDialog({
  user,
  costData,
  onClose,
}: {
  user: SelectedUser | null;
  costData: WeeklyUserCost | undefined;
  onClose: () => void;
}) {
  const { data: generations, isLoading } = useGenerationsByUser(user?.user_id || null);

  // Filter to current week only
  const weekStart = useMemo(() => {
    const now = new Date();
    const day = now.getUTCDay();
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - day + (day === 0 ? -6 : 1));
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
  }, []);

  const weeklyGenerations = useMemo(() => {
    if (!generations) return [];
    return generations.filter(g => new Date(g.created_at) >= weekStart);
  }, [generations, weekStart]);

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        {user && (
          <>
            <DialogHeader className="border-b pb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-bold text-lg">
                      {(user.full_name || user.email || '?')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-xl">{user.full_name || user.email || 'Unknown User'}</DialogTitle>
                  <DialogDescription>Weekly generation activity and cost breakdown</DialogDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Cost breakdown summary */}
              {costData && (
                <div className="flex items-center gap-6 pt-3">
                  <div className="text-center">
                    <p className="text-lg font-bold tabular-nums">${costData.total_cost.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total Cost</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Image className="h-3.5 w-3.5 text-blue-500" />
                      <p className="text-lg font-bold tabular-nums">{costData.image_count}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">${costData.image_cost.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Video className="h-3.5 w-3.5 text-purple-500" />
                      <p className="text-lg font-bold tabular-nums">{costData.video_count}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">${costData.video_cost.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    {user.is_unlimited ? (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-600">Unlimited</Badge>
                    ) : (
                      <Badge variant="outline">Standard</Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Tier</p>
                  </div>
                </div>
              )}
            </DialogHeader>

            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : weeklyGenerations.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No generations this week</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Preview</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead className="max-w-[200px]">Prompt</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyGenerations.map((gen) => (
                      <TableRow key={gen.id}>
                        <TableCell>
                          {gen.output_urls?.[0] ? (
                            <img
                              src={convertGcsUri(gen.output_urls[0])}
                              alt=""
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <Image className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {gen.generation_type.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{gen.model_used}</TableCell>
                        <TableCell>
                          <span className="text-xs truncate max-w-[200px] block">
                            {gen.prompt_text?.substring(0, 60) || '-'}
                          </span>
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
                        <TableCell className="text-xs tabular-nums">
                          {gen.estimated_cost_usd != null && Number(gen.estimated_cost_usd) > 0
                            ? `$${Number(gen.estimated_cost_usd).toFixed(3)}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(gen.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function QuotasTab() {
  const { data: quotaUsage, isLoading: quotaLoading } = useAllUsersQuotaUsage();
  const { data: weeklyCosts } = useWeeklyUserCosts();
  const updateUserQuotaLimit = useUpdateUserQuotaLimit();

  // Sort & search state
  const [sortColumn, setSortColumn] = useState<QuotaSortColumn>('cost');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Quota editor state
  const [editingQuotaUser, setEditingQuotaUser] = useState<EditingQuotaUser | null>(null);

  // User detail dialog state
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

  const getUserCost = (userId: string): number => {
    return weeklyCosts?.get(userId)?.total_cost ?? 0;
  };

  const handleSort = (column: QuotaSortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Filter + sort
  const filteredAndSortedUsers = useMemo(() => {
    if (!quotaUsage) return [];
    let result = [...quotaUsage];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u => u.full_name?.toLowerCase().includes(term));
    }

    // Sort
    const dir = sortDirection === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      switch (sortColumn) {
        case 'full_name':
          return dir * (a.full_name || '').localeCompare(b.full_name || '');
        case 'image_generations_used':
          return dir * (a.image_generations_used - b.image_generations_used);
        case 'video_generations_used':
          return dir * (a.video_generations_used - b.video_generations_used);
        case 'cost':
          return dir * (getUserCost(a.user_id) - getUserCost(b.user_id));
        case 'status':
          return dir * (Number(a.is_unlimited) - Number(b.is_unlimited));
        default:
          return 0;
      }
    });

    return result;
  }, [quotaUsage, searchTerm, sortColumn, sortDirection, weeklyCosts]);

  // Aggregate total cost
  const totalCost = useMemo(() => {
    if (!weeklyCosts) return 0;
    let sum = 0;
    for (const entry of weeklyCosts.values()) {
      sum += entry.total_cost;
    }
    return sum;
  }, [weeklyCosts]);

  const handleOpenQuotaEditor = (e: React.MouseEvent, quota: UserQuotaDisplay) => {
    e.stopPropagation();
    setEditingQuotaUser({
      user_id: quota.user_id,
      full_name: quota.full_name,
      image_limit: quota.image_limit,
      video_limit: quota.video_limit,
      is_unlimited: quota.is_unlimited,
    });
  };

  const handleSaveQuota = async () => {
    if (!editingQuotaUser) return;
    try {
      await updateUserQuotaLimit.mutateAsync({
        user_id: editingQuotaUser.user_id,
        image_generations_limit: editingQuotaUser.image_limit,
        video_generations_limit: editingQuotaUser.video_limit,
        is_unlimited: editingQuotaUser.is_unlimited,
      });
      setEditingQuotaUser(null);
      toast.success('Quota updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update quota');
    }
  };

  const handleRowClick = (quota: UserQuotaDisplay) => {
    setSelectedUser({
      user_id: quota.user_id,
      full_name: quota.full_name,
      avatar_url: quota.avatar_url,
      is_unlimited: quota.is_unlimited,
    });
  };

  return (
    <div className="space-y-6">
      <TabHeroHeader
        gradientLight="from-[#e8ecf0] via-[#d6dde4] to-[#c2cdd8]"
        gradientDark="dark:from-[#0a1219] dark:via-[#0c1820] dark:to-[#0e1e28]"
        watermark={<Users className="w-full h-full" />}
        watermarkSmall={<MergeLogo className="w-full h-full" />}
        badgeIcon={<Users className="w-4 h-4 text-gray-700 dark:text-white/80" />}
        badgeLabel="Access Management"
        title="User Quotas"
        subtitle="Weekly generation limits · usage tracking · per-user overrides"
      />

      {/* Toolbar: search + summary badges */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="gap-1 py-1">
            <DollarSign className="h-3 w-3" />
            Weekly Cost: ${totalCost.toFixed(2)}
          </Badge>
          <Badge variant="outline" className="gap-1 py-1">
            <Users className="h-3 w-3" />
            {quotaUsage?.length || 0} users
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm">
        {quotaLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader
                  column="full_name"
                  label="User"
                  currentColumn={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  column="image_generations_used"
                  label="Image Usage"
                  currentColumn={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  column="video_generations_used"
                  label="Video Usage"
                  currentColumn={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  column="cost"
                  label="Cost"
                  currentColumn={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  column="status"
                  label="Status"
                  currentColumn={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No users match your search' : 'No quota data yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedUsers.map((quota) => {
                  const imgPct = quota.is_unlimited ? 0 : quota.image_limit > 0
                    ? Math.min((quota.image_generations_used / quota.image_limit) * 100, 100) : 0;
                  const vidPct = quota.is_unlimited ? 0 : quota.video_limit > 0
                    ? Math.min((quota.video_generations_used / quota.video_limit) * 100, 100) : 0;
                  const cost = getUserCost(quota.user_id);
                  const userCostData = weeklyCosts?.get(quota.user_id);

                  return (
                    <TableRow
                      key={quota.user_id}
                      className="even:bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => handleRowClick(quota)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {quota.avatar_url ? (
                            <img src={quota.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {quota.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <span>{quota.full_name}</span>
                        </div>
                      </TableCell>

                      {/* Image usage */}
                      <TableCell>
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex justify-between text-xs">
                            <span>{quota.image_generations_used}</span>
                            <span className="text-muted-foreground">
                              {quota.is_unlimited ? '∞' : quota.image_limit}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getQuotaColor(quota.image_generations_used, quota.image_limit, quota.is_unlimited)}`}
                              style={{ width: quota.is_unlimited ? '10%' : `${imgPct}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Video usage */}
                      <TableCell>
                        <div className="space-y-1 min-w-[120px]">
                          <div className="flex justify-between text-xs">
                            <span>{quota.video_generations_used}</span>
                            <span className="text-muted-foreground">
                              {quota.is_unlimited ? '∞' : quota.video_limit}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getQuotaColor(quota.video_generations_used, quota.video_limit, quota.is_unlimited)}`}
                              style={{ width: quota.is_unlimited ? '10%' : `${vidPct}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Cost — clickable with breakdown hint */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="text-sm font-medium tabular-nums">
                            ${cost.toFixed(2)}
                          </span>
                          {userCostData && (userCostData.image_count > 0 || userCostData.video_count > 0) && (
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              {userCostData.image_count > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Image className="h-2.5 w-2.5" />
                                  ${userCostData.image_cost.toFixed(2)}
                                </span>
                              )}
                              {userCostData.video_count > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Video className="h-2.5 w-2.5" />
                                  ${userCostData.video_cost.toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {quota.is_unlimited ? (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-600">
                            Unlimited
                          </Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleOpenQuotaEditor(e, quota)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* User Detail Dialog */}
      <UserDetailDialog
        user={selectedUser}
        costData={selectedUser ? weeklyCosts?.get(selectedUser.user_id) : undefined}
        onClose={() => setSelectedUser(null)}
      />

      {/* Quota Edit Dialog */}
      <Dialog open={!!editingQuotaUser} onOpenChange={() => setEditingQuotaUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Quota — {editingQuotaUser?.full_name}</DialogTitle>
            <DialogDescription>
              Set weekly generation limits for this user
            </DialogDescription>
          </DialogHeader>

          {editingQuotaUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label>Unlimited</Label>
                <Switch
                  checked={editingQuotaUser.is_unlimited}
                  onCheckedChange={(checked) => setEditingQuotaUser(prev =>
                    prev ? { ...prev, is_unlimited: checked } : null
                  )}
                />
              </div>

              {!editingQuotaUser.is_unlimited && (
                <>
                  <div className="space-y-2">
                    <Label>Image Weekly Limit</Label>
                    <Input
                      type="number"
                      value={editingQuotaUser.image_limit}
                      onChange={(e) => setEditingQuotaUser(prev =>
                        prev ? { ...prev, image_limit: parseInt(e.target.value) || 0 } : null
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Video Weekly Limit</Label>
                    <Input
                      type="number"
                      value={editingQuotaUser.video_limit}
                      onChange={(e) => setEditingQuotaUser(prev =>
                        prev ? { ...prev, video_limit: parseInt(e.target.value) || 0 } : null
                      )}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuotaUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuota}
              disabled={updateUserQuotaLimit.isPending}
            >
              {updateUserQuotaLimit.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
