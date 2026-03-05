// ABOUTME: Audit trail viewer for Creative Studio admin dashboard
// ABOUTME: Displays all generation activity with action/date/user filtering and cost tracking

import { useState } from 'react';
import {
  History,
  Image,
  Video,
  DollarSign,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Shield,
  Sparkles,
  Zap,
  Users,
  Activity,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabHeroHeader } from '@/components/creative-studio/TabHeroHeader';
import { MergeLogo } from '@/components/ai-pulse/vendorLogos';
import {
  useCreativeStudioAuditLog,
  useCreativeStudioAuditStats,
  type AuditFilters,
  type CreativeStudioAuditEntry,
} from '@/hooks/useCreativeStudioAudit';

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  generate: { icon: Image, color: 'text-blue-500 bg-blue-500/10', label: 'Image Generated' },
  generate_video: { icon: Video, color: 'text-purple-500 bg-purple-500/10', label: 'Video Generated' },
  upscale: { icon: Zap, color: 'text-amber-500 bg-amber-500/10', label: 'Image Upscaled' },
  product_recontext: { icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10', label: 'Product Recontextualized' },
  compliance_check: { icon: Shield, color: 'text-red-500 bg-red-500/10', label: 'Compliance Check' },
};

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditTrailTab() {
  const [filters, setFilters] = useState<Partial<AuditFilters>>({
    action: 'all',
    date_range: 'week',
    user_email: '',
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [limit, setLimit] = useState(200);

  const { data: logs, isLoading } = useCreativeStudioAuditLog(filters, limit);
  const { data: stats } = useCreativeStudioAuditStats();

  const handleFilterByUser = (email: string) => {
    setFilters(prev => ({ ...prev, user_email: email }));
  };

  const handleFilterByDateRange = (range: AuditFilters['date_range']) => {
    setFilters(prev => ({ ...prev, date_range: range }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TabHeroHeader
        gradientLight="from-[#e6f5ee] via-[#d4ede3] to-[#c0e4d6]"
        gradientDark="dark:from-[#0a1f17] dark:via-[#0c2720] dark:to-[#0e302a]"
        watermark={<History className="w-full h-full" />}
        watermarkSmall={<MergeLogo className="w-full h-full" />}
        badgeIcon={<History className="w-4 h-4 text-gray-700 dark:text-white/80" />}
        badgeLabel="Activity Log"
        title="Audit Trail"
        subtitle="Generation activity · compliance checks · cost tracking"
      />

      {/* Clickable Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleFilterByDateRange('today')}
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.total_today}</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleFilterByDateRange('week')}
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.total_this_week}</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Clock className="h-4 w-4 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.unique_users_this_week}</p>
                  <p className="text-xs text-muted-foreground">Active Users (7d)</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Users className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {stats.total_cost_this_month > 0 && (
            <Card
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleFilterByDateRange('month')}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">${stats.total_cost_this_month.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Cost (30d)</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filters.action || 'all'}
          onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="generate">Image Generated</SelectItem>
            <SelectItem value="generate_video">Video Generated</SelectItem>
            <SelectItem value="upscale">Upscaled</SelectItem>
            <SelectItem value="product_recontext">Product Recontext</SelectItem>
            <SelectItem value="compliance_check">Compliance Check</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.date_range || 'week'}
          onValueChange={(value) => setFilters(prev => ({
            ...prev,
            date_range: value as AuditFilters['date_range'],
          }))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Filter by email..."
          value={filters.user_email || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, user_email: e.target.value }))}
          className="w-[200px]"
        />

        {filters.user_email && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, user_email: '' }))}
            className="text-xs"
          >
            Clear email filter
          </Button>
        )}
      </div>

      {/* Log Entries */}
      <Card>
        <CardContent className="p-0">
          {!logs || logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mb-4 opacity-50" />
              <p>No audit logs found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[600px]">
                <div className="divide-y">
                  {logs.map((log) => (
                    <AuditLogRow
                      key={log.id}
                      log={log}
                      isExpanded={expandedId === log.id}
                      onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      onFilterByUser={handleFilterByUser}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Load More */}
              {logs.length >= limit && (
                <div className="flex items-center justify-center p-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLimit(prev => prev + 200)}
                  >
                    <Loader2 className="h-3 w-3 mr-2" />
                    Load More ({logs.length} loaded)
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Individual log row ────────────────────────────────────────────────────────

interface AuditLogRowProps {
  log: CreativeStudioAuditEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onFilterByUser: (email: string) => void;
}

function AuditLogRow({ log, isExpanded, onToggle, onFilterByUser }: AuditLogRowProps) {
  const config = ACTION_CONFIG[log.action] || {
    icon: Sparkles,
    color: 'text-gray-500 bg-gray-500/10',
    label: log.action.replace(/_/g, ' '),
  };
  const ActionIcon = config.icon;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
          <div className={`p-2 rounded-lg ${config.color}`}>
            <ActionIcon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{config.label}</span>
              {log.model_used && (
                <Badge variant="outline" className="text-[10px]">
                  {log.model_used}
                </Badge>
              )}
              {log.estimated_cost_usd != null && log.estimated_cost_usd > 0 && (
                <Badge variant="outline" className="text-[10px] text-green-600">
                  <DollarSign className="h-2.5 w-2.5 mr-0.5" />
                  {log.estimated_cost_usd.toFixed(3)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              {(log.user_name || log.user_email) && (
                <span
                  className="flex items-center gap-1 cursor-pointer hover:text-primary hover:underline transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (log.user_email) onFilterByUser(log.user_email);
                  }}
                >
                  <User className="h-3 w-3" />
                  {log.user_name || log.user_email}
                </span>
              )}
              {log.prompt_text && (
                <span className="truncate max-w-[300px]">
                  &quot;{log.prompt_text.substring(0, 60)}{log.prompt_text.length > 60 ? '...' : ''}&quot;
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatRelativeDate(log.created_at)}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-4 pb-4 pl-16 space-y-3">
          {/* Prompt text */}
          {log.prompt_text && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Prompt</span>
              <p className="text-xs bg-muted/50 border rounded-lg p-3 whitespace-pre-wrap">
                {log.prompt_text}
              </p>
            </div>
          )}

          {/* Parameters */}
          {log.parameters && Object.keys(log.parameters).length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Parameters</span>
              <pre className="text-xs font-mono bg-muted/50 border rounded-lg p-3 overflow-auto max-h-[200px]">
                {JSON.stringify(log.parameters, null, 2)}
              </pre>
            </div>
          )}

          {/* Compliance check */}
          {log.compliance_check_result && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Compliance Result</span>
              <pre className="text-xs font-mono bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 overflow-auto max-h-[200px]">
                {JSON.stringify(log.compliance_check_result, null, 2)}
              </pre>
            </div>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t flex-wrap">
            {log.user_email && (
              <span
                className="flex items-center gap-1 cursor-pointer hover:text-primary hover:underline transition-colors"
                onClick={() => onFilterByUser(log.user_email!)}
              >
                <User className="h-3 w-3" />
                {log.user_email}
              </span>
            )}
            {log.brand_id && (
              <span>Brand: {log.brand_id.substring(0, 8)}...</span>
            )}
            {log.generation_id && (
              <span className="font-mono">Gen: {log.generation_id.substring(0, 8)}...</span>
            )}
            {log.ip_address && (
              <span>IP: {log.ip_address}</span>
            )}
            {log.estimated_cost_usd != null && (
              <span>Est: ${log.estimated_cost_usd.toFixed(4)}</span>
            )}
            {log.actual_cost_usd != null && (
              <span>Actual: ${log.actual_cost_usd.toFixed(4)}</span>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
