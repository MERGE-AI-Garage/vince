// ABOUTME: Standardized header for admin and control panel pages
// ABOUTME: Supports bar (full-width) and card (Media Library-inspired) layout variants

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { useOptimizedSitePageData } from '@/hooks/useOptimizedSitePageData';
import { useNavigate } from 'react-router-dom';
import { LucideIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AdminHeaderTag {
  label: string;
  icon?: LucideIcon;
  className?: string;
}

export interface AdminHeaderFeature {
  icon: LucideIcon;
  label: string;
  iconClassName?: string;
}

export interface AdminHeaderProps {
  /** CMS page key — when provided, title and description load from CMS with props as fallbacks */
  pageKey?: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Page title */
  title: string;
  /** Brief description shown below the title */
  description: string;
  /** Optional content rendered on the right side (badges, buttons, etc.) */
  actions?: React.ReactNode;
  /** Additional className for the outer wrapper */
  className?: string;
  /** Layout variant: bar (full-width, default) or card (rounded card style) */
  variant?: 'bar' | 'card';
  /** Pill badges displayed inline with the title */
  tags?: AdminHeaderTag[];
  /** Icon+label feature indicators below the description */
  features?: AdminHeaderFeature[];
  /** Back navigation link rendered above the header content */
  backTo?: { path: string; label: string };
}

const TagPill = memo(({ tag }: { tag: AdminHeaderTag }) => {
  const TagIcon = tag.icon;
  return (
    <div className={cn(
      'flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold',
      tag.className || 'bg-primary/10 text-primary border-primary/20'
    )}>
      {TagIcon && <TagIcon className="h-3 w-3" />}
      <span>{tag.label}</span>
    </div>
  );
});
TagPill.displayName = 'TagPill';

const FeatureItem = memo(({ feature }: { feature: AdminHeaderFeature }) => {
  const FeatureIcon = feature.icon;
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <FeatureIcon className={cn('h-4 w-4', feature.iconClassName)} />
      <span>{feature.label}</span>
    </div>
  );
});
FeatureItem.displayName = 'FeatureItem';

const AdminHeader = memo(({
  pageKey,
  icon: Icon,
  title: propTitle,
  description: propDescription,
  actions,
  className,
  variant = 'bar',
  tags,
  features,
  backTo,
}: AdminHeaderProps) => {
  const { data: cmsData } = useOptimizedSitePageData(pageKey || '');
  const navigate = useNavigate();

  const title = (pageKey && cmsData?.page?.title) || propTitle;
  const description = (pageKey && cmsData?.page?.description) || propDescription;

  if (variant === 'card') {
    return (
      <div className={cn(
        'relative overflow-hidden rounded-lg border bg-gradient-to-r from-primary/5 via-primary/3 to-accent/5 p-6',
        className
      )}>
        {backTo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backTo.path)}
            className="mb-3 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backTo.label}
          </Button>
        )}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                <Icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                  {tags?.map((tag, i) => <TagPill key={i} tag={tag} />)}
                </div>
              </div>
            </div>
            <p className="text-muted-foreground max-w-2xl">{description}</p>
            {features && features.length > 0 && (
              <div className="flex items-center gap-4 mt-3 text-sm">
                {features.map((feature, i) => <FeatureItem key={i} feature={feature} />)}
              </div>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0 ml-4">{actions}</div>}
        </div>
      </div>
    );
  }

  // Bar variant (original style)
  return (
    <div className={cn('bg-gradient-to-r from-muted/50 to-muted border-b', className)}>
      <div className="container mx-auto px-6 py-6">
        {backTo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backTo.path)}
            className="mb-3 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backTo.label}
          </Button>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-card rounded-xl shadow-sm border">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
                {tags?.map((tag, i) => <TagPill key={i} tag={tag} />)}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              {features && features.length > 0 && (
                <div className="flex items-center gap-4 mt-2 text-sm">
                  {features.map((feature, i) => <FeatureItem key={i} feature={feature} />)}
                </div>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
});

AdminHeader.displayName = 'AdminHeader';

export default AdminHeader;
