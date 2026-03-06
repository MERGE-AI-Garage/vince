// ABOUTME: Displays user's Creative Studio generation quota status.
// ABOUTME: Shows remaining image and video generations with progress bars; clickable to open receipt.

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Image, Video, Sparkles } from 'lucide-react';
import { useCreativeStudioFullQuota } from '@/hooks/useCreativeStudioQuota';
import { QuotaReceiptDialog } from './QuotaReceiptDialog';

interface QuotaDisplayProps {
  compact?: boolean;
  labMode?: boolean;
}

export function QuotaDisplay({ compact = false }: QuotaDisplayProps) {
  const { data: quota, isLoading } = useCreativeStudioFullQuota();
  const [receiptOpen, setReceiptOpen] = useState(false);

  if (isLoading || !quota) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <Clock className="h-3 w-3 mr-1" />
        Loading...
      </Badge>
    );
  }

  if (quota.is_unlimited) {
    return (
      <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
        <Sparkles className="h-3 w-3 mr-1" />
        Unlimited
      </Badge>
    );
  }

  const imagePercent = quota.image.limit_value > 0
    ? ((quota.image.limit_value - quota.image.remaining) / quota.image.limit_value) * 100
    : 0;

  const videoPercent = quota.video.limit_value > 0
    ? ((quota.video.limit_value - quota.video.remaining) / quota.video.limit_value) * 100
    : 0;

  const getColorClass = (remaining: number, limit: number) => {
    const percent = remaining / limit;
    if (percent === 0) return 'text-red-600 border-red-500/30 bg-red-500/10';
    if (percent <= 0.2) return 'text-orange-600 border-orange-500/30 bg-orange-500/10';
    return 'text-green-600 border-green-500/30 bg-green-500/10';
  };

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setReceiptOpen(true)}>
          <Badge variant="outline" className={getColorClass(quota.image.remaining, quota.image.limit_value)}>
            <Image className="h-3 w-3 mr-1" />
            {quota.image.remaining}/{quota.image.limit_value}
          </Badge>
          <Badge variant="outline" className={getColorClass(quota.video.remaining, quota.video.limit_value)}>
            <Video className="h-3 w-3 mr-1" />
            {quota.video.remaining}/{quota.video.limit_value}
          </Badge>
        </div>
        <QuotaReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} />
      </>
    );
  }

  const now = new Date();
  const resetEnd = new Date(quota.period_end);
  const daysUntilReset = Math.max(0, Math.ceil((resetEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return '[&>div]:bg-red-500';
    if (percent >= 80) return '[&>div]:bg-orange-500';
    return '[&>div]:bg-green-500';
  };

  return (
    <>
      <div
        className="space-y-3 p-4 bg-muted/50 rounded-lg border cursor-pointer hover:bg-muted/70 transition-colors"
        onClick={() => setReceiptOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setReceiptOpen(true); }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Weekly Quota</span>
          <span className="text-xs text-muted-foreground">
            Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <Image className="h-4 w-4 text-muted-foreground" />
              Images
            </span>
            <span className="font-medium">
              {quota.image.remaining} / {quota.image.limit_value}
            </span>
          </div>
          <Progress value={imagePercent} className={`h-2 ${getProgressColor(imagePercent)}`} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <Video className="h-4 w-4 text-muted-foreground" />
              Videos
            </span>
            <span className="font-medium">
              {quota.video.remaining} / {quota.video.limit_value}
            </span>
          </div>
          <Progress value={videoPercent} className={`h-2 ${getProgressColor(videoPercent)}`} />
        </div>

        {(quota.image.remaining === 0 || quota.video.remaining === 0) && (
          <p className="text-xs text-muted-foreground">
            Your quota resets every Monday. Contact admin for increased limits.
          </p>
        )}
      </div>
      <QuotaReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} />
    </>
  );
}
