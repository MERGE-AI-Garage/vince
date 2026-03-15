// ABOUTME: Admin tab for browsing and promoting prompt history from the Chrome extension
// ABOUTME: Summary cards, filter bar, expandable prompt list, and promote-to-template dialog

import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Users,
  User,
  Bookmark,
  ArrowUpRight,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { isToday, isYesterday, format } from 'date-fns';
import { TabHeroHeader } from '@/components/creative-studio/TabHeroHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  usePromptHistoryAdmin,
  usePromptHistoryStats,
  usePromptHistoryUsers,
  usePromoteToTemplate,
  type PromptHistoryEntry,
  type PromptHistoryFilters,
} from '@/hooks/usePromptHistoryAdmin';
import { useCreativeStudioBrands } from '@/hooks/useCreativeStudioBrands';

const CATEGORY_LABELS: Record<string, string> = {
  image: 'Visual',
  text: 'Copy',
  presentation: 'Deck',
  general: 'General',
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type DateGroup = { dateLabel: string; entries: PromptHistoryEntry[] };

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

function groupByDate(entries: PromptHistoryEntry[]): DateGroup[] {
  const groups: DateGroup[] = [];
  let currentLabel = '';
  for (const entry of entries) {
    const label = getDateLabel(entry.created_at);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ dateLabel: label, entries: [] });
    }
    groups[groups.length - 1].entries.push(entry);
  }
  return groups;
}

export function PromptHistoryTab() {
  const [filters, setFilters] = useState<Partial<PromptHistoryFilters>>({
    date_range: '30d',
  });
  const [limit, setLimit] = useState(50);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [promoteEntry, setPromoteEntry] = useState<PromptHistoryEntry | null>(null);
  const [promoteName, setPromoteName] = useState('');
  const [promoteCategory, setPromoteCategory] = useState('general');

  const { data, isLoading } = usePromptHistoryAdmin(filters, limit);
  const entries = data?.entries;
  const totalCount = data?.totalCount ?? 0;
  const { data: stats } = usePromptHistoryStats();
  const { data: brands } = useCreativeStudioBrands();
  const { data: historyUsers } = usePromptHistoryUsers();
  const promoteMutation = usePromoteToTemplate();

  const grouped = useMemo(
    () => groupByDate(entries || []),
    [entries]
  );

  const handleCopy = (entry: PromptHistoryEntry) => {
    navigator.clipboard.writeText(entry.generated_prompt);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Prompt copied');
  };

  const handlePromoteOpen = (entry: PromptHistoryEntry) => {
    setPromoteEntry(entry);
    setPromoteName(entry.description.slice(0, 80));
    setPromoteCategory(entry.category);
  };

  const handlePromoteSubmit = async () => {
    if (!promoteEntry || !promoteName.trim()) return;
    try {
      await promoteMutation.mutateAsync({
        historyId: promoteEntry.id,
        brandId: promoteEntry.brand_id || '',
        name: promoteName.trim(),
        category: promoteCategory,
        promptTemplate: promoteEntry.generated_prompt,
      });
      toast.success('Promoted to template library');
      setPromoteEntry(null);
    } catch (err) {
      toast.error('Failed to promote: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const summaryCards = useMemo(() => [
    { label: 'Total Prompts', value: stats?.total ?? 0, icon: MessageSquare, color: 'text-blue-600' },
    { label: 'Unique Users', value: stats?.unique_users ?? 0, icon: Users, color: 'text-purple-600' },
    { label: 'Favorited', value: stats?.favorited ?? 0, icon: Bookmark, color: 'text-amber-600' },
    { label: 'Promoted', value: stats?.promoted ?? 0, icon: ArrowUpRight, color: 'text-purple-600' },
  ], [stats]);

  return (
    <div className="space-y-6">
      <TabHeroHeader
        gradientLight="from-violet-50 via-purple-50 to-indigo-50"
        gradientDark="dark:from-violet-950/40 dark:via-purple-950/40 dark:to-indigo-950/40"
        badgeIcon={<MessageSquare className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />}
        badgeLabel="Extension Prompts"
        title="Prompt History"
        subtitle="Browse every prompt generated by your team through the Chrome Extension and mobile apps. Identify the most effective creative outputs, promote them into the shared QuickStarters library, and build a crowd-sourced intelligence layer from your team's best work."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-4 w-4 ${card.color}`} />
                  <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
                </div>
                <div className="text-2xl font-semibold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            className="pl-9 h-9"
            value={filters.search || ''}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <Select
          value={filters.brand_id || 'all'}
          onValueChange={(v) => setFilters(f => ({ ...f, brand_id: v }))}
        >
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {brands?.map(b => (
              <SelectItem key={b.id} value={b.id}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.primary_color }} />
                  {b.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.user_id || 'all'}
          onValueChange={(v) => setFilters(f => ({ ...f, user_id: v }))}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {historyUsers?.map(u => (
              <SelectItem key={u.id} value={u.id}>
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  {u.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.category || 'all'}
          onValueChange={(v) => setFilters(f => ({ ...f, category: v }))}
        >
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="image">Visual</SelectItem>
            <SelectItem value="text">Copy</SelectItem>
            <SelectItem value="presentation">Deck</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.date_range || '30d'}
          onValueChange={(v) => setFilters(f => ({ ...f, date_range: v as PromptHistoryFilters['date_range'] }))}
        >
          <SelectTrigger className="w-[110px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={filters.favorited_only ? 'default' : 'outline'}
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => setFilters(f => ({ ...f, favorited_only: !f.favorited_only }))}
        >
          <Bookmark className="h-3.5 w-3.5" />
          Favorited
        </Button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !entries || entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No prompts found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Prompts generated in the Chrome extension will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {totalCount > 0 && (
            <p className="text-xs text-muted-foreground mb-3">
              Showing {entries.length} of {totalCount} prompt{totalCount !== 1 ? 's' : ''}
            </p>
          )}
          {grouped.map((group) => (
            <div key={group.dateLabel}>
              <div className="flex items-center gap-3 mb-2 mt-4 first:mt-0">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted-foreground px-2">
                  {group.dateLabel}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2">
                {group.entries.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  return (
                    <Card key={entry.id} className="border-border/50 overflow-hidden">
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {CATEGORY_LABELS[entry.category] || entry.category}
                            </Badge>
                            {entry.brand_name && (
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: entry.brand_color || '#636466' }}
                                />
                                <span className="text-[10px] text-muted-foreground">{entry.brand_name}</span>
                              </div>
                            )}
                            {entry.is_favorited && (
                              <Bookmark className="h-3 w-3 text-amber-500 fill-amber-500" />
                            )}
                            {entry.is_promoted && (
                              <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-purple-600">
                                Promoted
                              </Badge>
                            )}
                            {entry.is_favorited && !entry.is_promoted && entry.brand_id && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-purple-300 text-purple-600 dark:border-purple-700 dark:text-purple-400">
                                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                                Promotable
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">{entry.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground">
                              {entry.user_name || entry.user_email || 'Anonymous'}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50">
                              {formatRelativeTime(entry.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => { e.stopPropagation(); handleCopy(entry); }}
                          >
                            {copiedId === entry.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                          {!entry.is_promoted && entry.brand_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-950/30"
                              onClick={(e) => { e.stopPropagation(); handlePromoteOpen(entry); }}
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              Promote
                            </Button>
                          )}
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-3 pb-3 border-t border-border/50 bg-muted/20">
                          <pre className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap mt-3 p-3 rounded-lg bg-background border border-border/50 max-h-[300px] overflow-y-auto">
                            {entry.generated_prompt}
                          </pre>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5"
                              onClick={() => handleCopy(entry)}
                            >
                              <Copy className="h-3 w-3" />
                              Copy prompt
                            </Button>
                            {!entry.is_promoted && entry.brand_id && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs gap-1.5"
                                  onClick={() => handlePromoteOpen(entry)}
                                >
                                  <ArrowUpRight className="h-3 w-3" />
                                  Promote to template
                                </Button>
                                <span className="text-[10px] text-muted-foreground">Add to the brand's template library</span>
                              </>
                            )}
                            {entry.platform && (
                              <Badge variant="outline" className="text-[10px]">{entry.platform}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load More */}
          {entries.length < totalCount && (
            <div className="flex items-center justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLimit(prev => prev + 50)}
              >
                Load more ({entries.length} of {totalCount})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Promote dialog */}
      <Dialog open={!!promoteEntry} onOpenChange={(open) => !open && setPromoteEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Promote to Template
            </DialogTitle>
            <DialogDescription>
              Add this prompt to the brand template library. It will be available in the Creative Studio prompt library.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Template name</Label>
              <Input
                value={promoteName}
                onChange={(e) => setPromoteName(e.target.value)}
                placeholder="e.g., Hero image for wellness campaign"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={promoteCategory} onValueChange={setPromoteCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prompt preview</Label>
              <pre className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap p-3 rounded-lg bg-muted/50 border border-border/50 max-h-[200px] overflow-y-auto">
                {promoteEntry?.generated_prompt}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteEntry(null)}>Cancel</Button>
            <Button
              onClick={handlePromoteSubmit}
              disabled={!promoteName.trim() || promoteMutation.isPending}
              className="gap-1.5"
            >
              {promoteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Promote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
