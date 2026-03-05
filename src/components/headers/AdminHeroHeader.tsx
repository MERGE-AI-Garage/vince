// ABOUTME: Full-width gradient hero header for admin pages with overlapping stat cards
// ABOUTME: Supports cinematic full-bleed mode with cross-fading image carousel

import React, { memo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, type LucideIcon } from 'lucide-react';

export interface HeroStatCard {
  icon: LucideIcon;
  /** Tailwind color class for the icon bg/text (e.g., "blue", "teal", "green", "amber") */
  color: string;
  value: React.ReactNode;
  label: string;
  /** Optional secondary text below the stat (e.g., "2 active today") */
  detail?: string;
  /** Optional Tailwind class for the detail text color */
  detailClassName?: string;
  onClick?: () => void;
}

export interface AdminHeroHeaderProps {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  backTo?: { path: string; label: string };
  /** Stat cards that overlap the gradient and the content below */
  stats?: HeroStatCard[];
  /** Loading state for the stat cards */
  statsLoading?: boolean;
  /** Right-side actions rendered inside the gradient area */
  actions?: React.ReactNode;
  /** Large rotated icon rendered as a subtle watermark in the banner background */
  watermark?: LucideIcon;
  /** Small caps eyebrow text displayed above the title */
  eyebrow?: string;
  /** Optional Tailwind classes to override the default eyebrow styling */
  eyebrowClassName?: string;
  /** Optional background image URL displayed behind the gradient overlay */
  backgroundImage?: string;
  /** Multiple background images that cross-fade as a carousel (takes precedence over backgroundImage) */
  backgroundImages?: string[];
  /** Full-bleed cinematic layout with aspect-ratio sizing, deeper overlays, and drop-shadow title */
  cinematic?: boolean;
  /** Interval in ms between carousel image transitions (default: 8000) */
  carouselInterval?: number;
}

const COLOR_MAP: Record<string, { bg: string; bgHover: string; text: string }> = {
  blue:   { bg: 'bg-blue-500/10',   bgHover: 'group-hover:bg-blue-500/15',   text: 'text-blue-600 dark:text-blue-400' },
  teal:   { bg: 'bg-teal-500/10',   bgHover: 'group-hover:bg-teal-500/15',   text: 'text-teal-600 dark:text-teal-400' },
  green:  { bg: 'bg-green-500/10',  bgHover: 'group-hover:bg-green-500/15',  text: 'text-green-600 dark:text-green-400' },
  amber:  { bg: 'bg-amber-500/10',  bgHover: 'group-hover:bg-amber-500/15',  text: 'text-amber-600 dark:text-amber-400' },
  purple: { bg: 'bg-purple-500/10', bgHover: 'group-hover:bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400' },
  red:    { bg: 'bg-red-500/10',    bgHover: 'group-hover:bg-red-500/15',    text: 'text-red-600 dark:text-red-400' },
  emerald:{ bg: 'bg-emerald-500/10',bgHover: 'group-hover:bg-emerald-500/15',text: 'text-emerald-600 dark:text-emerald-400' },
};

function getColorClasses(color: string) {
  return COLOR_MAP[color] || COLOR_MAP.blue;
}

const StatCardSkeleton = memo(() => (
  <div className="bg-card rounded-xl shadow-lg border border-border/50 p-6">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="h-9 w-9 rounded-lg bg-muted" />
          <div className="h-6 w-16 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      ))}
    </div>
  </div>
));
StatCardSkeleton.displayName = 'StatCardSkeleton';

const AdminHeroHeader = memo(({
  icon: Icon,
  title,
  description,
  backTo,
  stats,
  statsLoading,
  actions,
  watermark: Watermark,
  eyebrow,
  eyebrowClassName,
  backgroundImage,
  backgroundImages,
  cinematic,
  carouselInterval = 8000,
}: AdminHeroHeaderProps) => {
  const navigate = useNavigate();
  const hasStats = stats && stats.length > 0;

  // Resolve image list: backgroundImages takes precedence over backgroundImage
  const bgImages = backgroundImages || (backgroundImage ? [backgroundImage] : []);
  const hasImages = bgImages.length > 0;
  const isCinematic = !!cinematic;

  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (bgImages.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % bgImages.length);
    }, carouselInterval);
    return () => clearInterval(intervalRef.current);
  }, [bgImages.length, carouselInterval]);

  // Stat card grid (shared between cinematic and default layouts)
  const statCards = hasStats && (
    statsLoading ? (
      <StatCardSkeleton />
    ) : (
      <div className={`bg-card rounded-xl shadow-lg border border-border/50 grid grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/50 ${stats.length === 5 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
        {stats.map((stat, i) => {
          const colors = getColorClasses(stat.color);
          const StatIcon = stat.icon;
          const isFirst = i === 0;
          const isLast = i === stats.length - 1;

          const content = (
            <>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center shrink-0 ${colors.bgHover} transition-colors`}>
                  <StatIcon className={`h-4 w-4 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold tabular-nums leading-none">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
                {stat.onClick && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all duration-150 shrink-0 hidden sm:block" />
                )}
              </div>
              {stat.detail && (
                <p className={`text-[11px] mt-2 ml-12 ${stat.detailClassName || 'text-muted-foreground/70'}`}>
                  {stat.detail}
                </p>
              )}
            </>
          );

          if (stat.onClick) {
            return (
              <button
                key={i}
                onClick={stat.onClick}
                className={`px-5 py-4 text-left group hover:bg-muted/30 transition-colors duration-150 ${isFirst ? 'rounded-l-xl' : ''} ${isLast ? 'rounded-r-xl' : ''}`}
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={i}
              className={`px-5 py-4 ${isFirst ? 'rounded-l-xl' : ''} ${isLast ? 'rounded-r-xl' : ''}`}
            >
              {content}
            </div>
          );
        })}
      </div>
    )
  );

  // ── Cinematic full-bleed layout ──────────────────────────────
  if (isCinematic) {
    return (
      <>
        {/* Full-bleed banner */}
        <div
          className="relative overflow-hidden rounded-2xl group aspect-[3.5/1] sm:aspect-[5/1]"
          style={{ background: 'var(--gradient-bold)' }}
        >
          {/* Cross-fading image carousel with hover zoom */}
          {hasImages && (
            <div className="absolute inset-0 group-hover:scale-[1.02] transition-transform duration-700">
              {bgImages.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out ${
                    i === activeIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Emerald gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B16]/85 via-[#0D1B16]/40 to-[#0A3028]/15" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D1B16]/50 via-transparent to-[#0D1B16]/20" />

          {/* Watermark icon */}
          {Watermark && (
            <Watermark className="absolute -bottom-6 -right-4 w-56 h-56 text-white/[0.04] transform -rotate-12 pointer-events-none select-none" />
          )}

          {/* Content anchored to bottom, centered like podcast hero */}
          <div className="absolute inset-0 flex flex-col justify-end max-w-7xl mx-auto px-6 pb-6 sm:pb-10">
            {/* Eyebrow */}
            {eyebrow && (
              <p className={eyebrowClassName || "text-[10px] font-medium uppercase tracking-[0.15em] text-white/50 mb-3"}>
                {eyebrow}
              </p>
            )}

            {/* Back link */}
            {backTo && (
              <button
                onClick={() => navigate(backTo.path)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white/80 transition-colors duration-150 mb-5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {backTo.label}
              </button>
            )}

            {/* Title row */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 ring-1 ring-white/10">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-fraunces font-semibold text-white tracking-tight drop-shadow-lg">
                    {title}
                  </h1>
                  <div className="text-sm text-white/50 mt-0.5 drop-shadow-md">
                    {description}
                  </div>
                </div>
              </div>
              {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>
          </div>
        </div>

        {/* Overlapping stat cards — centered within max-w container */}
        {hasStats && (
          <div className="relative -mt-14 max-w-7xl mx-auto px-6 mb-6">
            {statCards}
          </div>
        )}
      </>
    );
  }

  // ── Default contained layout ─────────────────────────────────
  return (
    <>
      {/* Gradient banner */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ background: 'var(--gradient-bold)' }}
      >
        {/* Optional background image */}
        {hasImages && (
          <>
            <img
              src={bgImages[0]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#133B34]/95 via-[#133B34]/70 to-[#133B34]/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#133B34]/80 via-transparent to-[#133B34]/30" />
          </>
        )}
        {!hasImages && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(255,255,255,0.06),transparent_60%)]" />
        )}

        {/* Watermark icon */}
        {Watermark && (
          <Watermark className="absolute -bottom-6 -right-4 w-56 h-56 text-white/[0.04] transform -rotate-12 pointer-events-none select-none" />
        )}

        <div className={`relative px-6 pt-5 ${hasStats ? 'pb-20' : 'pb-6'}`}>
          {/* Eyebrow */}
          {eyebrow && (
            <p className={eyebrowClassName || "text-[10px] font-medium uppercase tracking-[0.15em] text-white/50 mb-3"}>
              {eyebrow}
            </p>
          )}

          {/* Back link */}
          {backTo && (
            <button
              onClick={() => navigate(backTo.path)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white/80 transition-colors duration-150 mb-5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {backTo.label}
            </button>
          )}

          {/* Title row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 ring-1 ring-white/10">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-fraunces font-semibold text-white tracking-tight">
                  {title}
                </h1>
                <div className={`text-sm text-white/50 mt-0.5 ${actions ? 'max-w-lg' : ''}`}>
                  {description}
                </div>
              </div>
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </div>
      </div>

      {/* Overlapping stat cards */}
      {hasStats && (
        <div className="relative -mt-14 mx-4 mb-6">
          {statCards}
        </div>
      )}
    </>
  );
});

AdminHeroHeader.displayName = 'AdminHeroHeader';

export default AdminHeroHeader;
