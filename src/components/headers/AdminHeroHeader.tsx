// ABOUTME: Slim functional page header for admin pages with optional inline stat cards
// ABOUTME: Emerald-themed, no hero imagery — clean Intelligence Console aesthetic

import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, type LucideIcon } from 'lucide-react';

export interface HeroStatCard {
  icon: LucideIcon;
  /** Tailwind color class for the icon bg/text (e.g., "blue", "teal", "green", "amber") */
  color: string;
  value: React.ReactNode;
  label: string;
  /** Optional secondary text below the stat */
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
  stats?: HeroStatCard[];
  statsLoading?: boolean;
  actions?: React.ReactNode;
  /** Unused — kept for backward compat */
  watermark?: LucideIcon;
  eyebrow?: string;
  eyebrowClassName?: string;
  /** Unused — kept for backward compat */
  backgroundImage?: string;
  /** Unused — kept for backward compat */
  backgroundImages?: string[];
  /** Unused — kept for backward compat */
  cinematic?: boolean;
  /** Unused — kept for backward compat */
  carouselInterval?: number;
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue:   { bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  teal:   { bg: 'bg-teal-500/15',   text: 'text-teal-400' },
  green:  { bg: 'bg-green-500/15',  text: 'text-green-400' },
  amber:  { bg: 'bg-amber-500/15',  text: 'text-amber-400' },
  purple: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  red:    { bg: 'bg-red-500/15',    text: 'text-red-400' },
};

function getColorClasses(color: string) {
  return COLOR_MAP[color] || COLOR_MAP.blue;
}

const StatCardSkeleton = memo(() => (
  <div className="flex items-center gap-6 flex-wrap">
    {[0, 1, 2, 3].map(i => (
      <div key={i} className="flex items-center gap-2.5 animate-pulse">
        <div className="w-8 h-8 rounded-lg bg-white/[0.06]" />
        <div className="space-y-1.5">
          <div className="h-4 w-10 rounded bg-white/[0.06]" />
          <div className="h-2.5 w-16 rounded bg-white/[0.04]" />
        </div>
      </div>
    ))}
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
  eyebrow,
  eyebrowClassName,
}: AdminHeroHeaderProps) => {
  const navigate = useNavigate();
  const hasStats = stats && stats.length > 0;

  return (
    <div className="bg-[#0D1B16] border-b border-[#00856C]/[0.12] px-6 pt-4 pb-4">
      {/* Back link */}
      {backTo && (
        <button
          onClick={() => navigate(backTo.path)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white/70 transition-colors duration-150 mb-3 font-epilogue"
        >
          <ArrowLeft className="h-3 w-3" />
          {backTo.label}
        </button>
      )}

      {/* Title row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {eyebrow && (
            <p className={eyebrowClassName || 'text-[10px] font-medium uppercase tracking-[0.15em] text-white/40 font-epilogue mb-1'}>
              {eyebrow}
            </p>
          )}
          <div className="w-9 h-9 rounded-xl bg-[#00856C]/15 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-[#1ED75F]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-fraunces text-xl font-semibold text-white tracking-tight leading-tight">
              {title}
            </h1>
            {description && (
              <div className="font-epilogue text-xs text-white/45 mt-0.5 truncate">
                {description}
              </div>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {/* Stats strip */}
      {hasStats && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          {statsLoading ? (
            <StatCardSkeleton />
          ) : (
            <div className="flex items-start gap-2 flex-wrap">
              {stats.map((stat, i) => {
                const colors = getColorClasses(stat.color);
                const StatIcon = stat.icon;

                const content = (
                  <>
                    <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                      <StatIcon className={`h-3.5 w-3.5 ${colors.text}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold tabular-nums leading-none text-white/90">{stat.value}</p>
                      <p className="text-[10px] text-white/40 mt-1 font-epilogue">{stat.label}</p>
                      {stat.detail && (
                        <p className={`text-[10px] mt-0.5 font-epilogue ${stat.detailClassName || 'text-white/30'}`}>
                          {stat.detail}
                        </p>
                      )}
                    </div>
                    {stat.onClick && (
                      <ChevronRight className="h-3 w-3 text-white/20 group-hover:text-white/50 transition-colors ml-auto self-center" />
                    )}
                  </>
                );

                if (stat.onClick) {
                  return (
                    <button
                      key={i}
                      onClick={stat.onClick}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] transition-colors group min-w-[120px]"
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] min-w-[120px]"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

AdminHeroHeader.displayName = 'AdminHeroHeader';

export default AdminHeroHeader;
