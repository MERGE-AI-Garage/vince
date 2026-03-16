// ABOUTME: Reusable hero header for Creative Studio admin tab sections
// ABOUTME: Gradient background, watermark logos, provider badge, frosted glass action buttons

import { cn } from '@/lib/utils';
import { MergeLogo } from '@/components/ai-pulse/vendorLogos';

interface TabHeroHeaderProps {
  /** Tailwind gradient classes for light mode (e.g. "from-[#f1f3f4] via-[#e8eaed] to-[#dadce0]") */
  gradientLight: string;
  /** Tailwind gradient classes for dark mode (e.g. "dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#0f3460]") */
  gradientDark: string;
  /** Always use white text (for dark backgrounds that don't change with theme) */
  forceLightText?: boolean;
  /** Large decorative watermark element (bottom-right, very low opacity) */
  watermark?: React.ReactNode;
  /** Small decorative watermark element (top-right, low opacity) */
  watermarkSmall?: React.ReactNode;
  /** Icon displayed in the provider/context badge */
  badgeIcon?: React.ReactNode;
  /** Label text for the provider/context badge */
  badgeLabel?: string;
  /** Section title */
  title: string;
  /** Subtitle with dot separators */
  subtitle: string;
  /** Action buttons rendered on the right side */
  actions?: React.ReactNode;
}

export function TabHeroHeader({
  gradientLight,
  gradientDark,
  forceLightText,
  watermark,
  watermarkSmall,
  badgeIcon,
  badgeLabel,
  title,
  subtitle,
  actions,
}: TabHeroHeaderProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl bg-gradient-to-br p-6',
      gradientLight,
    )}>
      {/* Large background watermark */}
      {watermark ? (
        <div className={cn(
          'absolute -bottom-4 -right-4 w-32 h-32 transform -rotate-12',
          forceLightText ? 'text-white/[0.08]' : 'text-black/[0.04]',
        )}>
          {watermark}
        </div>
      ) : (
        <MergeLogo className={cn(
          'absolute -bottom-4 -right-4 w-32 h-32 transform -rotate-12',
          forceLightText ? 'text-white/[0.08]' : 'text-black/[0.04]',
        )} />
      )}

      {/* Small background watermark */}
      {watermarkSmall && (
        <div className={cn(
          'absolute top-3 right-3 w-8 h-8',
          forceLightText ? 'text-white/[0.12]' : 'text-black/[0.08]',
        )}>
          {watermarkSmall}
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between">
        <div>
          {badgeIcon && badgeLabel && (
            <div className="flex items-center gap-2 mb-1">
              {badgeIcon}
              <span className={cn(
                'text-[10px] font-semibold uppercase tracking-[0.15em]',
                forceLightText ? 'text-white/50' : 'text-gray-500',
              )}>
                {badgeLabel}
              </span>
            </div>
          )}
          <h2 className={cn(
            'text-xl font-semibold',
            forceLightText ? 'text-white' : 'text-gray-900',
          )}>{title}</h2>
          <p className={cn(
            'text-sm mt-0.5',
            forceLightText ? 'text-white/60' : 'text-gray-600',
          )}>{subtitle}</p>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
