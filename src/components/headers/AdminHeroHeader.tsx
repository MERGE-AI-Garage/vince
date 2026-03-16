// ABOUTME: Slim functional page header for admin pages with optional inline stat strip
// ABOUTME: Self-centering with container mx-auto to align with page content below

import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, type LucideIcon } from 'lucide-react';

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

const StatSkeleton = memo(() => (
  <div className="flex items-center gap-5 mt-2">
    {[0, 1, 2, 3].map(i => (
      <div key={i} className="h-3 w-16 rounded bg-slate-700 animate-pulse" />
    ))}
  </div>
));
StatSkeleton.displayName = 'StatSkeleton';

const AdminHeroHeader = memo(({
  icon: Icon,
  title,
  description,
  backTo,
  stats,
  statsLoading,
  actions,
  eyebrow,
}: AdminHeroHeaderProps) => {
  const navigate = useNavigate();
  const hasStats = stats && stats.length > 0;

  return (
    <div className="bg-slate-900 border-b border-slate-800/60">
      <div className="container mx-auto px-6 py-4">
        {/* Back link */}
        {backTo && (
          <button
            onClick={() => navigate(backTo.path)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors duration-150 mb-3 font-epilogue"
          >
            <ArrowLeft className="h-3 w-3" />
            {backTo.label}
          </button>
        )}

        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500 font-epilogue mb-1">
                {eyebrow}
              </p>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-slate-300" />
              </div>
              <h1 className="font-fraunces text-xl font-semibold text-white tracking-tight leading-tight">
                {title}
              </h1>
            </div>
            {description && (
              <p className="font-epilogue text-xs text-slate-400 mt-1.5 ml-[2.625rem]">
                {description}
              </p>
            )}

            {/* Inline stats — value + label pairs separated by dots */}
            {statsLoading ? (
              <StatSkeleton />
            ) : hasStats ? (
              <div className="flex items-center gap-1 mt-2 ml-[2.625rem]">
                {stats.map((stat, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-slate-600 text-xs">·</span>}
                    {stat.onClick ? (
                      <button
                        onClick={stat.onClick}
                        className="font-epilogue text-xs text-slate-400 hover:text-slate-200 transition-colors tabular-nums"
                      >
                        <span className="text-slate-200 font-semibold">{stat.value}</span>
                        {' '}{stat.label}
                      </button>
                    ) : (
                      <span className="font-epilogue text-xs text-slate-400 tabular-nums">
                        <span className="text-slate-200 font-semibold">{stat.value}</span>
                        {' '}{stat.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : null}
          </div>

          {actions && (
            <div className="flex items-center gap-2 shrink-0 mt-0.5">{actions}</div>
          )}
        </div>
      </div>
    </div>
  );
});

AdminHeroHeader.displayName = 'AdminHeroHeader';

export default AdminHeroHeader;