// ABOUTME: Analytics dashboard for Creative Studio admin with server-side aggregation and real-time updates
// ABOUTME: Budget tracking, period comparison, prompt intelligence, CSV export, clickable drill-downs

import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpDown,
  DollarSign,
  Clock,
  CheckCircle,
  Users,
  Film,
  Image,
  Loader2,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  X,
  Download,
  FileText,
  Hash,
  BarChart3,
  AlertTriangle,
  Minus,
  ZoomIn,
} from 'lucide-react';
import { TabHeroHeader } from '@/components/creative-studio/TabHeroHeader';
import { MergeLogo } from '@/components/ai-pulse/vendorLogos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  useGenerationStats,
  useGenerationStatsComparison,
  useCostAnalytics,
  useTopUsers,
  useGenerationsByUser,
  useBudgetStatus,
  usePromptAnalytics,
  useRealtimeGenerations,
} from '@/hooks/useCreativeStudioGenerations';
import { ChartDrillDownDialog, type ChartDrillDown } from '@/components/creative-studio/ChartDrillDownDialog';
import { exportToCSV } from '@/utils/csv-export';
import type { TopUser } from '@/types/creative-studio';

// ── Chart tooltip style ──────────────────────────────────────────────────────

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

const PIE_COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];

type TimeRange = 7 | 30 | 90 | 365;
type MetricDialog = 'generations' | 'cost' | 'time' | 'users' | null;

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'];

function isVideoUrl(url: string): boolean {
  return VIDEO_EXTENSIONS.some(ext => url.toLowerCase().endsWith(ext));
}

type UserSortField = 'type' | 'model' | 'time' | 'cost' | 'created';

// ── Export button ────────────────────────────────────────────────────────────

function ExportButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClick}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Export {label} as CSV</p>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}

// ── Delta badge ──────────────────────────────────────────────────────────────

function DeltaBadge({ delta, label }: { delta: number | null; label: string }) {
  if (delta === null) return null;

  const isPositive = delta > 0;
  const isNeutral = Math.abs(delta) < 0.5;

  return (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              isNeutral
                ? 'bg-gray-500/10 text-gray-500'
                : isPositive
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {isNeutral ? (
              <Minus className="h-2.5 w-2.5" />
            ) : isPositive ? (
              <ChevronUp className="h-2.5 w-2.5" />
            ) : (
              <ChevronDown className="h-2.5 w-2.5" />
            )}
            {Math.abs(delta).toFixed(0)}%
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{label}</p>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function AnalyticsTab() {
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [metricDialog, setMetricDialog] = useState<MetricDialog>(null);
  const [selectedUser, setSelectedUser] = useState<TopUser | null>(null);
  const [chartDrillDown, setChartDrillDown] = useState<ChartDrillDown | null>(null);

  // Real-time subscription — auto-invalidates all analytics queries
  useRealtimeGenerations();

  const { data: stats, isLoading: statsLoading } = useGenerationStats(timeRange);
  const { data: costAnalytics } = useCostAnalytics(timeRange);
  const { data: topUsers } = useTopUsers(timeRange);
  const { data: budgetStatus } = useBudgetStatus();
  const { data: promptAnalytics } = usePromptAnalytics(timeRange);
  const comparison = useGenerationStatsComparison(timeRange);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        No analytics data available
      </p>
    );
  }

  const rangeLabel = timeRange === 365 ? 'all time' : `${timeRange}d`;

  return (
    <div className="space-y-6">
      <TabHeroHeader
        gradientLight="from-[#e7f6f8] via-[#d5eff2] to-[#c1e7ec]"
        gradientDark="dark:from-[#0a1e21] dark:via-[#0c2529] dark:to-[#0e2e33]"
        watermark={<TrendingUp className="w-full h-full" />}
        watermarkSmall={<MergeLogo className="w-full h-full" />}
        badgeIcon={<TrendingUp className="w-4 h-4 text-gray-700 dark:text-white/80" />}
        badgeLabel="Intelligence"
        title="Analytics"
        subtitle="Track generation volume, estimated costs, and model utilization across the platform. Use this dashboard to measure AI adoption, surface usage trends, and build the data story behind your team's creative AI investment."
        actions={
          <div className="flex items-center gap-1.5">
            {([7, 30, 90, 365] as TimeRange[]).map((d) => (
              <Button
                key={d}
                variant={timeRange === d ? 'default' : 'outline'}
                size="sm"
                className={`h-7 text-xs ${timeRange !== d ? 'bg-white/60 dark:bg-white/10 border-gray-300/60 dark:border-white/20' : ''}`}
                onClick={() => setTimeRange(d)}
              >
                {d === 365 ? 'All Time' : `${d}d`}
              </Button>
            ))}
          </div>
        }
      />

      {/* Budget Alert Bar */}
      {budgetStatus && (
        <Card className={`border-2 ${
          budgetStatus.isOverBudget
            ? 'border-red-500/50 bg-red-500/5'
            : budgetStatus.percentUsed > 70
              ? 'border-amber-500/50 bg-amber-500/5'
              : 'border-violet-500/30 bg-violet-500/5'
        }`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {budgetStatus.isOverBudget ? (
                  <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
                ) : (
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  Monthly Budget: ${budgetStatus.currentSpend.toFixed(2)} / ${budgetStatus.threshold.toFixed(2)}
                </span>
              </div>
              <span className={`text-sm font-bold ${
                budgetStatus.isOverBudget
                  ? 'text-red-500'
                  : budgetStatus.percentUsed > 70
                    ? 'text-amber-500'
                    : 'text-violet-500'
              }`}>
                {budgetStatus.percentUsed.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={Math.min(budgetStatus.percentUsed, 100)}
              className={`h-2 ${
                budgetStatus.isOverBudget
                  ? '[&>div]:bg-red-500'
                  : budgetStatus.percentUsed > 70
                    ? '[&>div]:bg-amber-500'
                    : '[&>div]:bg-violet-500'
              }`}
            />
          </CardContent>
        </Card>
      )}

      {/* Clickable Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={`Total Generations (${rangeLabel})`}
          value={stats.total_generations}
          icon={<Activity className="h-6 w-6" />}
          iconBg="bg-blue-500/10 text-blue-500"
          delta={comparison?.deltas.total_generations ?? null}
          deltaLabel={`vs previous ${rangeLabel}`}
          description={
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 text-[10px]">
                {stats.image_generations} images
              </Badge>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 text-[10px]">
                {stats.video_generations} videos
              </Badge>
            </div>
          }
          onClick={() => setMetricDialog('generations')}
        />
        <MetricCard
          title={`Estimated Cost (${rangeLabel})`}
          value={`$${stats.total_estimated_cost.toFixed(2)}`}
          icon={<DollarSign className="h-6 w-6" />}
          iconBg="bg-green-500/10 text-green-500"
          delta={comparison?.deltas.total_estimated_cost ?? null}
          deltaLabel={`vs previous ${rangeLabel}`}
          onClick={() => setMetricDialog('cost')}
        />
        <MetricCard
          title="Avg Generation Time"
          value={`${(stats.average_generation_time_ms / 1000).toFixed(1)}s`}
          icon={<Clock className="h-6 w-6" />}
          iconBg="bg-orange-500/10 text-orange-500"
          onClick={() => setMetricDialog('time')}
        />
        <MetricCard
          title={`Active Users (${rangeLabel})`}
          value={stats.unique_users}
          icon={<CheckCircle className="h-6 w-6" />}
          iconBg="bg-emerald-500/10 text-emerald-500"
          delta={comparison?.deltas.unique_users ?? null}
          deltaLabel={`vs previous ${rangeLabel}`}
          description={
            <span className="text-xs text-muted-foreground mt-1 block">
              {stats.success_rate.toFixed(0)}% success rate
            </span>
          }
          onClick={() => setMetricDialog('users')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Generation Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Generation Trend ({rangeLabel})</CardTitle>
              <CardDescription>Daily generation count</CardDescription>
            </div>
            <ExportButton
              label="generation trend"
              onClick={() => exportToCSV(
                stats.generations_over_time.map(d => ({ date: d.date, count: d.count })),
                'generation-trend',
                [{ key: 'date', label: 'Date' }, { key: 'count', label: 'Count' }]
              )}
            />
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.generations_over_time}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(d) =>
                      new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                  />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(d) =>
                      new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                  <Bar
                    dataKey="count"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data: { date: string }) => {
                      if (!data?.date) return;
                      setChartDrillDown({
                        source: 'trend',
                        filterKey: 'date',
                        filterValue: data.date,
                        label: new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        }),
                      });
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Type Breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Generation Types</CardTitle>
              <CardDescription>Breakdown by generation type</CardDescription>
            </div>
            <ExportButton
              label="generation types"
              onClick={() => exportToCSV(
                stats.generations_by_type.map(d => ({ type: d.type, count: d.count })),
                'generation-types',
                [{ key: 'type', label: 'Type' }, { key: 'count', label: 'Count' }]
              )}
            />
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.generations_by_type}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    cursor="pointer"
                    label={({ type, count }) =>
                      `${(type as string).replace(/_/g, ' ')} (${count})`
                    }
                    onClick={(_, index) => {
                      const entry = stats.generations_by_type[index];
                      if (!entry) return;
                      setChartDrillDown({
                        source: 'type',
                        filterKey: 'type',
                        filterValue: entry.type,
                        label: `${entry.type.replace(/_/g, ' ')} generations`,
                      });
                    }}
                  >
                    {stats.generations_by_type.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Popularity & Cost Trend */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Model Popularity</CardTitle>
              <CardDescription>Generation count by model</CardDescription>
            </div>
            <ExportButton
              label="model popularity"
              onClick={() => exportToCSV(
                stats.generations_by_model.map(d => ({ model: d.model_name, count: d.count })),
                'model-popularity',
                [{ key: 'model', label: 'Model' }, { key: 'count', label: 'Count' }]
              )}
            />
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...stats.generations_by_model].sort((a, b) => b.count - a.count).slice(0, 8)}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="model_name" tick={{ fontSize: 10 }} width={140} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(data: { model_name: string }) => {
                      if (!data?.model_name) return;
                      setChartDrillDown({
                        source: 'model',
                        filterKey: 'model',
                        filterValue: data.model_name,
                        label: `Generations using ${data.model_name}`,
                      });
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Cost Trend</CardTitle>
              <CardDescription>Daily estimated cost ({rangeLabel})</CardDescription>
            </div>
            {costAnalytics && costAnalytics.length > 0 && (
              <ExportButton
                label="cost trend"
                onClick={() => {
                  const grouped = [...costAnalytics]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .reduce((acc, item) => {
                      const dateKey = item.date.split(' ')[0].split('T')[0];
                      const existing = acc.find((a) => a.date === dateKey);
                      if (existing) {
                        existing.cost += Number(item.estimated_cost) || 0;
                      } else {
                        acc.push({ date: dateKey, cost: Number(item.estimated_cost) || 0 });
                      }
                      return acc;
                    }, [] as Array<{ date: string; cost: number }>);
                  exportToCSV(grouped, 'cost-trend', [
                    { key: 'date', label: 'Date' },
                    { key: 'cost', label: 'Cost (USD)' },
                  ]);
                }}
              />
            )}
          </CardHeader>
          <CardContent>
            {costAnalytics && costAnalytics.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[...costAnalytics]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .reduce(
                        (acc, item) => {
                          const dateKey = item.date.split(' ')[0].split('T')[0];
                          const existing = acc.find((a) => a.date === dateKey);
                          if (existing) {
                            existing.cost += Number(item.estimated_cost) || 0;
                          } else {
                            acc.push({ date: dateKey, cost: Number(item.estimated_cost) || 0 });
                          }
                          return acc;
                        },
                        [] as Array<{ date: string; cost: number }>
                      )}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(d) =>
                        new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }
                    />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [`$${value.toFixed(3)}`, 'Cost']}
                      labelFormatter={(d) =>
                        new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{
                        cursor: 'pointer',
                        r: 5,
                        onClick: (_: unknown, payload: { payload: { date: string } }) => {
                          if (!payload?.payload?.date) return;
                          setChartDrillDown({
                            source: 'cost',
                            filterKey: 'date',
                            filterValue: payload.payload.date,
                            label: `Cost for ${new Date(payload.payload.date + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })}`,
                          });
                        },
                      } as any}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No cost data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cost per Model & Brand Usage */}
      <div className="grid lg:grid-cols-2 gap-6">
        {stats.cost_by_model.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Cost per Model</CardTitle>
                <CardDescription>Estimated cost by model ({rangeLabel})</CardDescription>
              </div>
              <ExportButton
                label="cost per model"
                onClick={() => exportToCSV(
                  stats.cost_by_model.map(d => ({ model: d.model_name, cost: d.cost.toFixed(3) })),
                  'cost-per-model',
                  [{ key: 'model', label: 'Model' }, { key: 'cost', label: 'Cost (USD)' }]
                )}
              />
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.cost_by_model.slice(0, 8)}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                    <YAxis type="category" dataKey="model_name" tick={{ fontSize: 10 }} width={140} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [`$${value.toFixed(3)}`, 'Cost']}
                    />
                    <Bar
                      dataKey="cost"
                      fill="#22c55e"
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                      onClick={(data: { model_name: string }) => {
                        if (!data?.model_name) return;
                        setChartDrillDown({
                          source: 'model',
                          filterKey: 'model',
                          filterValue: data.model_name,
                          label: `Generations using ${data.model_name}`,
                        });
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.generations_by_brand.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Brand Usage</CardTitle>
                <CardDescription>Generations by brand ({rangeLabel})</CardDescription>
              </div>
              <ExportButton
                label="brand usage"
                onClick={() => exportToCSV(
                  stats.generations_by_brand.map(d => ({ brand: d.brand_name, count: d.count })),
                  'brand-usage',
                  [{ key: 'brand', label: 'Brand' }, { key: 'count', label: 'Count' }]
                )}
              />
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.generations_by_brand}
                      dataKey="count"
                      nameKey="brand_name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      cursor="pointer"
                      label={({ brand_name, count }: { brand_name: string; count: number }) =>
                        `${brand_name} (${count})`
                      }
                    >
                      {stats.generations_by_brand.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activity by Hour */}
      {stats.generations_by_hour.some(h => h.count > 0) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Activity by Hour</CardTitle>
              <CardDescription>When the studio is most active ({rangeLabel})</CardDescription>
            </div>
            <ExportButton
              label="activity by hour"
              onClick={() => exportToCSV(
                stats.generations_by_hour.map(d => ({
                  hour: `${d.hour === 0 ? 12 : d.hour > 12 ? d.hour - 12 : d.hour}:00 ${d.hour >= 12 ? 'PM' : 'AM'}`,
                  count: d.count,
                })),
                'activity-by-hour',
                [{ key: 'hour', label: 'Hour' }, { key: 'count', label: 'Count' }]
              )}
            />
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.generations_by_hour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(h) => {
                      if (h === 0) return '12a';
                      if (h === 12) return '12p';
                      return h < 12 ? `${h}a` : `${h - 12}p`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(h) => {
                      const hour = Number(h);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                      return `${display}:00 ${ampm}`;
                    }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompt Intelligence */}
      {promptAnalytics && promptAnalytics.total_prompts > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prompt Intelligence
          </h3>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Prompt Length Distribution */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm">Length Distribution</CardTitle>
                  <CardDescription className="text-xs">
                    Avg: {promptAnalytics.avg_length} chars across {promptAnalytics.total_prompts} prompts
                  </CardDescription>
                </div>
                <ExportButton
                  label="prompt lengths"
                  onClick={() => exportToCSV(
                    promptAnalytics.length_distribution.map(d => ({ bucket: d.bucket, count: d.count })),
                    'prompt-length-distribution',
                    [{ key: 'bucket', label: 'Length' }, { key: 'count', label: 'Count' }]
                  )}
                />
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={promptAnalytics.length_distribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="bucket" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Keywords */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm">Top Keywords</CardTitle>
                  <CardDescription className="text-xs">Most frequent prompt words</CardDescription>
                </div>
                <ExportButton
                  label="top keywords"
                  onClick={() => exportToCSV(
                    promptAnalytics.top_keywords.map(d => ({ keyword: d.word, frequency: d.frequency })),
                    'top-keywords',
                    [{ key: 'keyword', label: 'Keyword' }, { key: 'frequency', label: 'Frequency' }]
                  )}
                />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                  {promptAnalytics.top_keywords.slice(0, 25).map((kw) => {
                    const maxFreq = promptAnalytics.top_keywords[0]?.frequency || 1;
                    const intensity = Math.max(0.3, kw.frequency / maxFreq);
                    return (
                      <Badge
                        key={kw.word}
                        variant="outline"
                        className="text-[10px] transition-colors cursor-pointer hover:bg-primary/10 hover:border-primary/50"
                        style={{ opacity: intensity, fontSize: `${10 + intensity * 4}px` }}
                        onClick={() => setChartDrillDown({
                          source: 'keyword',
                          filterKey: 'promptSearch',
                          filterValue: kw.word,
                          label: `Generations containing "${kw.word}"`,
                        })}
                      >
                        <Hash className="h-2.5 w-2.5 mr-0.5" />
                        {kw.word}
                        <span className="ml-1 text-muted-foreground">{kw.frequency}</span>
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Reused Prompts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm">Reused Prompts</CardTitle>
                  <CardDescription className="text-xs">Prompts used more than once</CardDescription>
                </div>
                {promptAnalytics.reused_prompts.length > 0 && (
                  <ExportButton
                    label="reused prompts"
                    onClick={() => exportToCSV(
                      promptAnalytics.reused_prompts.map(d => ({
                        prompt: d.prompt_preview,
                        times_used: d.times_used,
                        unique_users: d.unique_users,
                      })),
                      'reused-prompts',
                      [
                        { key: 'prompt', label: 'Prompt' },
                        { key: 'times_used', label: 'Times Used' },
                        { key: 'unique_users', label: 'Users' },
                      ]
                    )}
                  />
                )}
              </CardHeader>
              <CardContent>
                {promptAnalytics.reused_prompts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No reused prompts detected</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {promptAnalytics.reused_prompts.map((p, i) => (
                      <button
                        key={i}
                        className="flex items-start gap-2 p-2 rounded bg-muted/30 hover:bg-primary/10 hover:ring-1 hover:ring-primary/30 text-xs w-full text-left transition-colors cursor-pointer"
                        onClick={() => setChartDrillDown({
                          source: 'prompt',
                          filterKey: 'promptSearch',
                          filterValue: p.prompt_preview,
                          label: `Reused prompt (${p.times_used}x)`,
                        })}
                      >
                        <BarChart3 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{p.prompt_preview}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-muted-foreground">{p.times_used}x used</span>
                            <span className="text-muted-foreground">{p.unique_users} user{p.unique_users !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Top Users Leaderboard */}
      {topUsers && topUsers.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Users ({rangeLabel})
              </CardTitle>
              <CardDescription>
                Ranked by generation count — click a user to see their activity
              </CardDescription>
            </div>
            <ExportButton
              label="top users"
              onClick={() => exportToCSV(
                topUsers.map(u => ({
                  name: u.full_name,
                  email: u.email || '',
                  generations: u.generation_count,
                  success_rate: `${u.success_rate.toFixed(0)}%`,
                  cost: u.total_cost.toFixed(3),
                  favorite_model: u.favorite_model,
                  favorite_type: u.favorite_type,
                  types_used: u.types_used,
                  last_active: u.last_activity,
                })),
                'top-users',
                [
                  { key: 'name', label: 'Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'generations', label: 'Generations' },
                  { key: 'success_rate', label: 'Success Rate' },
                  { key: 'cost', label: 'Cost (USD)' },
                  { key: 'favorite_model', label: 'Favorite Model' },
                  { key: 'favorite_type', label: 'Favorite Type' },
                  { key: 'types_used', label: 'Types Used' },
                  { key: 'last_active', label: 'Last Active' },
                ]
              )}
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {topUsers.slice(0, 20).map((user, index) => (
                <div
                  key={user.user_id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  {/* Rank badge */}
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 ${
                      index === 0
                        ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                        : index === 1
                          ? 'bg-gray-300/30 text-gray-600 dark:text-gray-400'
                          : index === 2
                            ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                            : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-medium text-sm">
                          {user.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{user.full_name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {(user.favorite_type ?? '').replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {user.types_used} type{user.types_used !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm shrink-0">
                    <div className="text-center">
                      <p className="font-semibold text-primary">{user.generation_count}</p>
                      <p className="text-[10px] text-muted-foreground">Generated</p>
                    </div>
                    <div className="text-center min-w-[70px]">
                      <div className="flex items-center justify-center gap-1">
                        <Progress value={user.success_rate} className="w-12 h-2" />
                        <span className="font-semibold text-xs">{user.success_rate.toFixed(0)}%</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Success</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">${user.total_cost.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">Cost</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric Drill-Down Dialog */}
      <MetricDrillDownDialog
        type={metricDialog}
        onClose={() => setMetricDialog(null)}
        topUsers={topUsers || []}
        stats={stats}
        onSelectUser={setSelectedUser}
      />

      {/* User Activity Dialog */}
      <UserActivityDialog
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />

      {/* Chart Drill-Down Dialog */}
      <ChartDrillDownDialog
        drillDown={chartDrillDown}
        onClose={() => setChartDrillDown(null)}
      />
    </div>
  );
}

// ── Clickable Metric Card ────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  icon,
  iconBg,
  description,
  onClick,
  delta,
  deltaLabel,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  description?: React.ReactNode;
  onClick?: () => void;
  delta?: number | null;
  deltaLabel?: string;
}) {
  return (
    <Card
      className={`relative overflow-hidden ${onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors group' : ''}`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {delta !== undefined && delta !== null && (
                <DeltaBadge delta={delta} label={deltaLabel || 'vs previous period'} />
              )}
            </div>
            {description}
          </div>
          <div className={`p-3 rounded-xl ${iconBg}`}>{icon}</div>
        </div>
        {onClick && (
          <p className="text-[10px] text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Click for details
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Metric Drill-Down Dialog ─────────────────────────────────────────────────

function MetricDrillDownDialog({
  type,
  onClose,
  topUsers,
  stats,
  onSelectUser,
}: {
  type: MetricDialog;
  onClose: () => void;
  topUsers: TopUser[];
  stats: { generations_by_model: Array<{ model_name: string; count: number }> };
  onSelectUser: (user: TopUser) => void;
}) {
  const titles: Record<string, { title: string; description: string }> = {
    generations: { title: 'Generation Breakdown', description: 'Users ranked by generation count' },
    cost: { title: 'Cost Breakdown', description: 'Users and models ranked by cost' },
    time: { title: 'Model Performance', description: 'Average generation time and success rate by model' },
    users: { title: 'Active Users', description: 'All users with generation activity' },
  };

  const info = type ? titles[type] : null;

  return (
    <Dialog open={!!type} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col [&>button.absolute]:hidden">
        {info && (
          <>
            <DialogHeader className="shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle>{info.title}</DialogTitle>
                  <DialogDescription>{info.description}</DialogDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto min-h-0">
              {type === 'cost' ? (
                <div className="space-y-6 pb-2">
                  {/* Cost by model */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Cost by Model</h4>
                    <div className="space-y-2">
                      {topUsers.length > 0 &&
                        (() => {
                          const modelCosts: Record<string, number> = {};
                          for (const u of topUsers) {
                            modelCosts[u.favorite_model] = (modelCosts[u.favorite_model] || 0) + u.total_cost;
                          }
                          return Object.entries(modelCosts)
                            .sort((a, b) => b[1] - a[1])
                            .map(([model, cost]) => (
                              <div key={model} className="flex items-center justify-between p-2 rounded bg-muted/30">
                                <span className="text-sm font-medium">{model}</span>
                                <Badge variant="outline" className="text-green-600">
                                  <DollarSign className="h-3 w-3 mr-0.5" />${cost.toFixed(3)}
                                </Badge>
                              </div>
                            ));
                        })()}
                    </div>
                  </div>
                  {/* Cost by user */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Cost by User</h4>
                    <UserStatsTable users={topUsers} sortByField="cost" onSelectUser={onSelectUser} />
                  </div>
                </div>
              ) : (
                <UserStatsTable
                  users={topUsers}
                  sortByField="count"
                  onSelectUser={onSelectUser}
                />
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── User Stats Table ─────────────────────────────────────────────────────────

function UserStatsTable({
  users,
  sortByField,
  onSelectUser,
}: {
  users: TopUser[];
  sortByField: 'count' | 'cost';
  onSelectUser: (user: TopUser) => void;
}) {
  const sorted = [...users].sort((a, b) =>
    sortByField === 'cost' ? b.total_cost - a.total_cost : b.generation_count - a.generation_count
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">Rank</TableHead>
          <TableHead>User</TableHead>
          <TableHead className="text-center">Generations</TableHead>
          <TableHead className="text-center">Success Rate</TableHead>
          <TableHead className="text-center">Cost</TableHead>
          <TableHead>Favorite Model</TableHead>
          <TableHead>Favorite Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((user, index) => (
          <TableRow
            key={user.user_id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onSelectUser(user)}
          >
            <TableCell>
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${
                  index === 0
                    ? 'bg-yellow-500/20 text-yellow-600'
                    : index === 1
                      ? 'bg-gray-300/30 text-gray-600'
                      : index === 2
                        ? 'bg-orange-500/20 text-orange-600'
                        : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-medium text-xs">
                      {user.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-center font-semibold">{user.generation_count}</TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Progress value={user.success_rate} className="w-16 h-2" />
                <span className="text-xs">{user.success_rate.toFixed(0)}%</span>
              </div>
            </TableCell>
            <TableCell className="text-center">${user.total_cost.toFixed(3)}</TableCell>
            <TableCell>
              <Badge variant="outline" className="text-[10px]">
                {user.favorite_model}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-[10px]">
                {(user.favorite_type ?? '').replace(/_/g, ' ')}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── User Activity Dialog ─────────────────────────────────────────────────────

function UserActivityDialog({
  user,
  onClose,
}: {
  user: TopUser | null;
  onClose: () => void;
}) {
  const [sortField, setSortField] = useState<UserSortField>('created');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxIsVideo, setLightboxIsVideo] = useState(false);
  const [promptPopup, setPromptPopup] = useState<string | null>(null);

  const { data: generations, isLoading } = useGenerationsByUser(user?.user_id || null);

  const sorted = useMemo(() => {
    if (!generations) return [];
    return [...generations].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'type': cmp = a.generation_type.localeCompare(b.generation_type); break;
        case 'model': cmp = a.model_used.localeCompare(b.model_used); break;
        case 'time': cmp = (a.generation_time_ms || 0) - (b.generation_time_ms || 0); break;
        case 'cost': cmp = (Number(a.estimated_cost_usd) || 0) - (Number(b.estimated_cost_usd) || 0); break;
        case 'created': cmp = a.created_at.localeCompare(b.created_at); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [generations, sortField, sortDir]);

  function handleSort(field: UserSortField) {
    if (field === sortField) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function openMedia(url: string) {
    setLightboxIsVideo(isVideoUrl(url));
    setLightboxSrc(url);
  }

  const sortIcon = (field: UserSortField) => {
    if (sortField === field) {
      return sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
    }
    return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  };

  return (
    <>
      <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col [&>button.absolute]:hidden">
          {user && (
            <>
              <DialogHeader className="border-b pb-4 shrink-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary font-bold text-lg">
                        {user.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl">{user.full_name}</DialogTitle>
                    <DialogDescription>{user.email}</DialogDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Stats summary */}
                <div className="flex items-center gap-6 pt-3">
                  <div className="text-center">
                    <p className="text-lg font-bold">{user.generation_count}</p>
                    <p className="text-xs text-muted-foreground">Generations</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{user.success_rate.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Success</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">${user.total_cost.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total Cost</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">{user.favorite_model}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">Top Model</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {(user.favorite_type ?? '').replace(/_/g, ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Top Type</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">{user.types_used}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">Types Used</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto min-h-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : !sorted.length ? (
                  <p className="text-center text-muted-foreground py-12">No generations found</p>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[50px]">Preview</TableHead>
                        <TableHead>
                          <button className="inline-flex items-center gap-1 hover:text-foreground transition-colors text-xs" onClick={() => handleSort('type')}>
                            Type {sortIcon('type')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button className="inline-flex items-center gap-1 hover:text-foreground transition-colors text-xs" onClick={() => handleSort('model')}>
                            Model {sortIcon('model')}
                          </button>
                        </TableHead>
                        <TableHead className="max-w-[200px]">Prompt</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                          <button className="inline-flex items-center gap-1 hover:text-foreground transition-colors text-xs" onClick={() => handleSort('time')}>
                            Time {sortIcon('time')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button className="inline-flex items-center gap-1 hover:text-foreground transition-colors text-xs" onClick={() => handleSort('cost')}>
                            Cost {sortIcon('cost')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button className="inline-flex items-center gap-1 hover:text-foreground transition-colors text-xs" onClick={() => handleSort('created')}>
                            Created {sortIcon('created')}
                          </button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sorted.map((gen) => {
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
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8 cursor-zoom-out"
          onClick={() => setLightboxSrc(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 h-10 w-10 z-10"
            onClick={() => setLightboxSrc(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          {lightboxIsVideo ? (
            <video
              src={lightboxSrc}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightboxSrc}
              alt=""
              className="max-w-full max-h-full rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {/* Full prompt text popup */}
      {promptPopup && (
        <Dialog open onOpenChange={(open) => !open && setPromptPopup(null)}>
          <DialogContent className="max-w-2xl max-h-[60vh]">
            <DialogHeader>
              <DialogTitle>Full Prompt</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[45vh] text-sm whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-lg p-4">
              {promptPopup}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
