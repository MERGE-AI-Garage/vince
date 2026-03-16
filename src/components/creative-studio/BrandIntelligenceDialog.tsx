// ABOUTME: Unified brand intelligence dialog — single persistent Dialog with view switching
// ABOUTME: Eliminates nav animation jarring by keeping one Dialog mounted and switching content by activeView

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, X } from 'lucide-react';
import { useBrandProfile, useBrandStats, useBrandAnalyses } from '@/hooks/useCreativeStudioBrandIntelligence';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreativeStudioBrand } from '@/types/creative-studio';
import { BrandDialogNav, type BrandDialogView } from './BrandDialogNav';
import { BrandDNAViewContent } from './BrandDNADialog';
import { CorporateDNAViewContent } from './BrandStoryDialog';
import { ArtDirectionViewContent } from './ArtDirectionDialog';
import { BrandStandardsViewContent } from './BrandStandardsDialog';

// ── Helpers ──────────────────────────────────────────────────────────────────

function isLightColor(hex: string | null | undefined): boolean {
  if (!hex) return false;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

function darkenHex(hex: string | null | undefined, amount: number): string {
  if (!hex) return `rgb(51, 51, 51)`;
  const clean = hex.replace('#', '');
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

// ── View label map ────────────────────────────────────────────────────────────

const VIEW_LABELS: Record<BrandDialogView, string> = {
  'brand-dna': 'Brand DNA',
  'corporate-dna': 'Corporate DNA',
  'art-direction': 'Art Direction',
  'brand-standards': 'Brand Standards',
};

// ── Main dialog ───────────────────────────────────────────────────────────────

interface BrandIntelligenceDialogProps {
  brand: CreativeStudioBrand;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: BrandDialogView;
}

export function BrandIntelligenceDialog({
  brand,
  open,
  onOpenChange,
  initialView = 'brand-dna',
}: BrandIntelligenceDialogProps) {
  const [activeView, setActiveView] = useState<BrandDialogView>(initialView);

  // Sync to initialView whenever the dialog opens to a new view
  useEffect(() => {
    if (open) setActiveView(initialView);
  }, [open, initialView]);

  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useBrandProfile(brand.id);
  const { data: stats } = useBrandStats(brand.id);
  const { data: analyses } = useBrandAnalyses(brand.id);

  // Logo library — used in header (Corporate DNA / Standards use primary + badge)
  const [primaryLogo, setPrimaryLogo] = useState<string | null>(null);
  const [badgeLogo, setBadgeLogo] = useState<string | null>(null);
  useEffect(() => {
    supabase
      .from('creative_studio_brand_logos' as any)
      .select('url, lockup, is_default')
      .eq('brand_id', brand.id)
      .order('is_default', { ascending: false })
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (!data?.length) return;
        const primary = (data as any[]).find((l: any) => l.is_default) ?? data[0];
        setPrimaryLogo((primary as any).url);
        const badge = (data as any[]).find((l: any) => l.lockup === 'mark_only' && l.url !== (primary as any).url);
        if (badge) setBadgeLogo((badge as any).url);
      });
  }, [brand.id]);

  const handleSetHeaderImage = async (url: string | null) => {
    const currentMeta = (profile?.source_metadata as Record<string, unknown>) || {};
    const { error } = await supabase
      .from('creative_studio_brand_profiles')
      .update({ source_metadata: { ...currentMeta, header_image_url: url }, updated_at: new Date().toISOString() })
      .eq('brand_id', brand.id);
    if (error) {
      toast.error('Failed to update header image');
    } else {
      toast.success(url ? 'Header image set' : 'Header image removed');
      queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-profiles', brand.id] });
    }
  };

  const headerTextLight = !isLightColor(brand.primary_color);
  const headerImageUrl = (profile?.source_metadata as Record<string, unknown>)?.header_image_url as string | undefined;
  const logoSrc = primaryLogo ?? brand.logo_url;

  // View-specific header subtitles
  const confidencePct = Math.round((stats?.confidenceScore || 0) * 100);

  const headerSubtitle = (() => {
    switch (activeView) {
      case 'brand-dna': return confidencePct > 0 ? `Profile Confidence: ${confidencePct}%` : null;
      case 'corporate-dna': return 'Mission, heritage, values & brand story';
      case 'art-direction': return 'Photography, composition & product catalog';
      case 'brand-standards': return 'Colors, typography, logo system & voice';
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[1400px] max-h-[88vh] p-0 gap-0 rounded-2xl sm:rounded-2xl overflow-hidden font-product-sans [&>button:last-child]:hidden brand-guidelines-panel"
        style={{
          backgroundColor: 'hsl(var(--cs-surface-2))',
          borderColor: 'hsl(var(--cs-border-mid))',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.15), 0 10px 30px -10px rgba(0,0,0,0.08)',
        }}
      >
        <DialogTitle className="sr-only">{brand.name} {VIEW_LABELS[activeView]}</DialogTitle>
        <DialogDescription className="sr-only">
          Brand intelligence for {brand.name} — {VIEW_LABELS[activeView]}
        </DialogDescription>

        {/* ── Branded Header ── */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${brand.primary_color} 0%, ${darkenHex(brand.primary_color, 0.35)} 100%)`,
            minHeight: '130px',
          }}
        >
          {headerImageUrl && (
            <img
              src={headerImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-contain p-4"
              style={{ opacity: 0.10, mixBlendMode: 'luminosity' }}
            />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.15) 100%)' }} />

          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-20 p-1.5 rounded-full transition-colors hover:bg-white/20"
            style={{
              backgroundColor: headerTextLight ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
              color: headerTextLight ? 'white' : '#1a1a1a',
            }}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10 px-6 pt-6 pb-5 flex flex-col justify-center" style={{ minHeight: '130px' }}>
            <div className="flex items-center gap-5">
              {/* Logo — from library when available, fallback to brand record */}
              {logoSrc ? (
                <div className="flex items-center gap-2 shrink-0">
                  <img
                    src={logoSrc}
                    alt={brand.name}
                    className="h-16 max-w-[220px] rounded-xl object-contain bg-white/95 backdrop-blur-sm shadow-lg p-2.5"
                  />
                  {badgeLogo && (
                    <img
                      src={badgeLogo}
                      alt={`${brand.name} mark`}
                      className="h-10 w-10 rounded-lg object-contain bg-white/95 backdrop-blur-sm shadow-md p-1.5"
                    />
                  )}
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm shadow-lg shrink-0">
                  <span className="text-white text-2xl font-bold">{brand.name.charAt(0)}</span>
                </div>
              )}

              {/* Brand name + URL + tagline */}
              <div className="flex-1 min-w-0">
                <h2
                  className="text-2xl font-bold truncate font-product-sans"
                  style={{ color: headerTextLight ? 'white' : '#1a1a1a' }}
                >
                  {brand.name}
                </h2>
                {brand.website_url && (
                  <a
                    href={brand.website_url.startsWith('http') ? brand.website_url : `https://${brand.website_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs transition-colors mt-1"
                    style={{ color: headerTextLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="underline underline-offset-2">{brand.website_url}</span>
                  </a>
                )}
                {profile?.brand_identity?.tagline && (
                  <p
                    className="text-sm italic leading-relaxed mt-1.5 truncate"
                    style={{ color: headerTextLight ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.5)' }}
                  >
                    &ldquo;{profile.brand_identity.tagline}&rdquo;
                  </p>
                )}
              </div>

              {/* Right: view label + subtitle + nav */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <p
                  className="text-2xl font-bold tracking-tight font-product-sans"
                  style={{ color: headerTextLight ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.75)' }}
                >
                  {VIEW_LABELS[activeView]}
                </p>
                {headerSubtitle && (
                  <p
                    className="text-xs font-product-sans"
                    style={{ color: headerTextLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}
                  >
                    {headerSubtitle}
                  </p>
                )}
                <BrandDialogNav
                  activeView={activeView}
                  onNavigate={setActiveView}
                  headerTextLight={headerTextLight}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Content — key resets scroll position on view change ── */}
        <ScrollArea
          key={activeView}
          className="h-[calc(88vh-130px)]"
          style={{ backgroundColor: 'hsl(0 0% 96%)' }}
        >
          {activeView === 'brand-dna' && (
            <BrandDNAViewContent
              brand={brand}
              profile={profile}
              isLoading={isLoading}
              stats={stats}
              analyses={analyses as { source_type: string; analysis_data: unknown }[] | undefined}
              onSetHeaderImage={handleSetHeaderImage}
              onNavigate={setActiveView}
            />
          )}
          {activeView === 'corporate-dna' && (
            <CorporateDNAViewContent
              brand={brand}
              profile={profile}
              isLoading={isLoading}
              analyses={analyses as { source_type: string; source_image_url?: string | null; analyzed_at?: string | null; tags?: string[] | null }[] | undefined}
              onNavigate={setActiveView}
            />
          )}
          {activeView === 'art-direction' && (
            <ArtDirectionViewContent brand={brand} profile={profile} isLoading={isLoading} />
          )}
          {activeView === 'brand-standards' && (
            <BrandStandardsViewContent brand={brand} profile={profile} isLoading={isLoading} />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
