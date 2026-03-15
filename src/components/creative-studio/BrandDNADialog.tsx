// ABOUTME: Brand DNA showcase dialog with branded header, image lightbox, and visual polish
// ABOUTME: Wide bento-grid layout using Studio Surface system, interactive swatches, image viewer, and brand snapshot

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Palette, Type, Sparkles, MessageSquare, Eye, Globe, ImageIcon,
  Copy, Check, Star, ExternalLink, X, BookOpen,
} from 'lucide-react';
import { useBrandProfile, useBrandStats, useBrandAnalyses } from '@/hooks/useCreativeStudioBrandIntelligence';
import {
  ColorProfileDisplay,
  TypographyDisplay,
  BrandIdentityDisplay,
  ToneOfVoiceDisplay,
  VisualDNADisplay,
} from './BrandProfileVisuals';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { CreativeStudioBrand } from '@/types/creative-studio';
import { CorporateDNADialog } from './BrandStoryDialog';
import { BrandDialogNav, type BrandDialogView } from './BrandDialogNav';

// ── Helpers ─────────────────────────────────────────────────────────────────

function isLightColor(hex: string | null | undefined): boolean {
  if (!hex) return false;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

function hexToRgba(hex: string | null | undefined, alpha: number): string {
  if (!hex) return `rgba(51, 51, 51, ${alpha})`;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darkenHex(hex: string | null | undefined, amount: number): string {
  if (!hex) return `rgb(51, 51, 51)`;
  const clean = hex.replace('#', '');
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

// ── Main dialog ─────────────────────────────────────────────────────────────

interface BrandDNADialogProps {
  brand: CreativeStudioBrand;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (view: BrandDialogView) => void;
}

export function BrandDNADialog({ brand, open, onOpenChange, onNavigate }: BrandDNADialogProps) {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useBrandProfile(brand.id);
  const { data: stats } = useBrandStats(brand.id);
  const { data: analyses } = useBrandAnalyses(brand.id);

  const confidencePct = Math.round((stats?.confidenceScore || 0) * 100);

  // Header image from source_metadata
  const headerImageUrl = (profile?.source_metadata as Record<string, unknown>)?.header_image_url as string | undefined;


  const handleSetHeaderImage = async (url: string | null) => {
    const currentMeta = (profile?.source_metadata as Record<string, unknown>) || {};
    const updatedMeta = { ...currentMeta, header_image_url: url };
    const { error } = await supabase
      .from('creative_studio_brand_profiles')
      .update({ source_metadata: updatedMeta, updated_at: new Date().toISOString() })
      .eq('brand_id', brand.id);
    if (error) {
      toast.error('Failed to update header image');
    } else {
      toast.success(url ? 'Header image set' : 'Header image removed');
      queryClient.invalidateQueries({ queryKey: ['creative-studio-brand-profiles', brand.id] });
    }
  };

  // Detect text color for branded header
  const headerTextLight = !isLightColor(brand.primary_color);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[1400px] max-h-[88vh] p-0 gap-0 rounded-2xl sm:rounded-2xl overflow-hidden font-product-sans [&>button:last-child]:hidden"
        style={{
          backgroundColor: 'hsl(var(--cs-surface-2))',
          borderColor: 'hsl(var(--cs-border-mid))',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.15), 0 10px 30px -10px rgba(0,0,0,0.08)',
        }}
      >
        <DialogTitle className="sr-only">{brand.name} Brand DNA</DialogTitle>
        <DialogDescription className="sr-only">
          Visual brand profile for {brand.name}
        </DialogDescription>

        {/* ── Branded Header ── */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${brand.primary_color} 0%, ${darkenHex(brand.primary_color, 0.35)} 100%)`,
            minHeight: '130px',
          }}
        >
          {/* Hero image overlay (activated by starring a brand image) */}
          {headerImageUrl && (
            <img
              src={headerImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-contain p-4"
              style={{ opacity: 0.10, mixBlendMode: 'luminosity' }}
            />
          )}

          {/* Gradient overlay for depth */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.15) 100%)' }} />

          {/* Close button */}
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
              {/* Logo — prominent, full brand logo */}
              {brand.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="h-16 max-w-[220px] rounded-xl object-contain bg-white/95 backdrop-blur-sm shadow-lg p-2.5 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm shadow-lg shrink-0">
                  <span className="text-white text-2xl font-bold">{brand.name.charAt(0)}</span>
                </div>
              )}

              {/* Brand name + URL */}
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
                {/* Tagline inline */}
                {profile?.brand_identity?.tagline && (
                  <p
                    className="text-sm italic leading-relaxed mt-1.5 truncate"
                    style={{ color: headerTextLight ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.5)' }}
                  >
                    &ldquo;{profile.brand_identity.tagline}&rdquo;
                  </p>
                )}
              </div>

              {/* Right side: Brand DNA label + confidence + nav */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <p
                  className="text-2xl font-bold tracking-tight font-product-sans"
                  style={{ color: headerTextLight ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.75)' }}
                >
                  Brand DNA
                </p>
                {confidencePct > 0 && (
                  <p
                    className="text-xs font-product-sans"
                    style={{ color: headerTextLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}
                  >
                    Profile Confidence: {confidencePct}%
                  </p>
                )}
                {onNavigate && (
                  <BrandDialogNav
                    activeView="brand-dna"
                    onNavigate={onNavigate}
                    headerTextLight={headerTextLight}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Content with brand-tinted background ── */}
        <ScrollArea
          className="max-h-[calc(88vh-160px)]"
          style={{ backgroundColor: hexToRgba(brand.primary_color, 0.04) }}
        >
          <BrandDNAViewContent
            brand={brand}
            profile={profile}
            isLoading={isLoading}
            stats={stats}
            analyses={analyses}
            onSetHeaderImage={handleSetHeaderImage}
            onNavigate={onNavigate}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── Bento card ──────────────────────────────────────────────────────────────

function BentoCard({
  title,
  icon: Icon,
  iconColor,
  className = '',
  children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl p-3 card-elevated ${className}`}
      style={{
        backgroundColor: 'hsl(var(--cs-surface-1))',
        border: '1px solid hsl(var(--cs-border-subtle))',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        <h3 className="text-sm font-semibold font-product-sans text-muted-foreground uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ── Image grid with lightbox + starring ─────────────────────────────────────

function ImageGrid({
  images,
  headerImageUrl,
  onSetHeaderImage,
}: {
  images: string[];
  headerImageUrl?: string;
  onSetHeaderImage: (url: string | null) => void;
}) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopy = (url: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success('Image URL copied');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleStar = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSetHeaderImage(headerImageUrl === url ? null : url);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {images.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxUrl(url)}
            className="relative group cursor-pointer"
            title="Click to view image"
          >
            <img
              src={url}
              alt=""
              className="w-full aspect-[4/3] object-cover rounded-lg border border-border bg-muted/20 group-hover:border-muted-foreground/30 transition-all duration-200"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
              <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* Star indicator for header image */}
            <button
              type="button"
              onClick={(e) => handleStar(url, e)}
              className="absolute top-1 right-1 p-0.5 rounded-full transition-all duration-200"
              style={{
                backgroundColor: headerImageUrl === url ? 'rgba(234, 179, 8, 0.9)' : 'rgba(0,0,0,0.4)',
                opacity: headerImageUrl === url ? 1 : undefined,
              }}
              title={headerImageUrl === url ? 'Remove as header image' : 'Set as header image'}
            >
              <Star
                className={`w-3 h-3 transition-all ${
                  headerImageUrl === url
                    ? 'text-white fill-white'
                    : 'text-white/70 opacity-0 group-hover:opacity-100'
                }`}
              />
            </button>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <ImageLightbox
          url={lightboxUrl}
          isHeaderImage={headerImageUrl === lightboxUrl}
          onClose={() => setLightboxUrl(null)}
          onCopy={() => handleCopy(lightboxUrl)}
          onToggleHeader={() => onSetHeaderImage(headerImageUrl === lightboxUrl ? null : lightboxUrl)}
          copied={copiedUrl === lightboxUrl}
        />
      )}
    </>
  );
}

// ── Image lightbox ──────────────────────────────────────────────────────────

function ImageLightbox({
  url,
  isHeaderImage,
  onClose,
  onCopy,
  onToggleHeader,
  copied,
}: {
  url: string;
  isHeaderImage: boolean;
  onClose: () => void;
  onCopy: () => void;
  onToggleHeader: () => void;
  copied: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-[80vw] max-h-[80vh] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt=""
          className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors backdrop-blur-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy URL'}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors backdrop-blur-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Tab
          </a>
          <button
            onClick={onToggleHeader}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors backdrop-blur-sm ${
              isHeaderImage
                ? 'bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-200'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isHeaderImage ? 'fill-yellow-300' : ''}`} />
            {isHeaderImage ? 'Header Image' : 'Set as Header'}
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Brand DNA view content (used by unified BrandIntelligenceDialog) ─────────

export function BrandDNAViewContent({
  brand,
  profile,
  isLoading,
  stats,
  analyses,
  onSetHeaderImage,
  onNavigate,
}: {
  brand: CreativeStudioBrand;
  profile: import('@/types/creative-studio').BrandVisualProfile | null | undefined;
  isLoading: boolean;
  stats: { promptCount: number; directiveCount: number; imagesAnalyzed: number; confidenceScore: number } | undefined;
  analyses: { source_type: string; analysis_data: unknown }[] | undefined;
  onSetHeaderImage: (url: string | null) => void;
  onNavigate?: (view: BrandDialogView) => void;
}) {
  const headerImageUrl = (profile?.source_metadata as Record<string, unknown>)?.header_image_url as string | undefined;

  const brandImages = (analyses || [])
    .filter(a => a.source_type === 'website')
    .flatMap(a => {
      const extraction = (a.analysis_data as Record<string, unknown>)?._extraction as Record<string, unknown> | undefined;
      return (extraction?.image_urls as string[]) || [];
    })
    .filter((url, i, arr) => arr.indexOf(url) === i)
    .slice(0, 12);
  const hasImages = brandImages.length > 0;

  const sections = profile ? (
    <>
      {profile.color_profile && Object.keys(profile.color_profile).length > 0 && (
        <BentoCard title="Colors" icon={Palette} iconColor="text-pink-500">
          <ColorProfileDisplay data={profile.color_profile} />
        </BentoCard>
      )}
      {profile.typography && Object.keys(profile.typography).length > 0 && (
        <BentoCard title="Typography" icon={Type} iconColor="text-cyan-600">
          <TypographyDisplay data={profile.typography} />
        </BentoCard>
      )}
      {profile.brand_identity && Object.keys(profile.brand_identity).length > 0 && (
        <BentoCard title="Brand Identity" icon={Sparkles} iconColor="text-amber-500">
          <BrandIdentityDisplay data={profile.brand_identity} hideTagline />
        </BentoCard>
      )}
      {profile.tone_of_voice && Object.keys(profile.tone_of_voice).length > 0 && (
        <BentoCard title="Tone of Voice" icon={MessageSquare} iconColor="text-orange-500">
          <ToneOfVoiceDisplay data={profile.tone_of_voice} />
        </BentoCard>
      )}
      {profile.visual_dna && Object.keys(profile.visual_dna).length > 0 && (
        <BentoCard title="Visual DNA" icon={Eye} iconColor="text-purple-500">
          <VisualDNADisplay data={profile.visual_dna} />
        </BentoCard>
      )}
    </>
  ) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: brand.primary_color }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground px-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'hsl(var(--cs-surface-1))', border: '1px solid hsl(var(--cs-border-subtle))' }}
        >
          <Sparkles className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="font-medium text-foreground">No brand profile yet</p>
        <p className="text-sm mt-1 text-muted-foreground">
          Build a brand profile from Brand Intelligence in the admin.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      {hasImages ? (
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <div className="grid grid-cols-2 gap-3 auto-rows-min content-start">
            {sections}
          </div>
          <div className="space-y-3">
            <BentoCard title="Brand Imagery" icon={ImageIcon} iconColor="text-purple-500">
              <ImageGrid
                images={brandImages}
                headerImageUrl={headerImageUrl}
                onSetHeaderImage={onSetHeaderImage}
              />
            </BentoCard>
            <CorporateDNAPreviewCard
              brand={brand}
              profile={profile as unknown as Record<string, unknown>}
              stats={stats}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 auto-rows-min">
          {sections}
          <CorporateDNAPreviewCard
            brand={brand}
            profile={profile as unknown as Record<string, unknown>}
            stats={stats}
            onNavigate={onNavigate}
          />
        </div>
      )}
      {profile.updated_at && (
        <div className="mt-4 pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            Last updated {new Date(profile.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Corporate DNA teaser (inside Brand Snapshot) ─────────────────────────────

// ── Corporate DNA Preview card ──────────────────────────────────────────────

function CorporateDNAPreviewCard({
  brand,
  profile,
  stats,
  onNavigate,
}: {
  brand: CreativeStudioBrand;
  profile: Record<string, unknown> | undefined;
  stats: { promptCount: number; directiveCount: number; imagesAnalyzed: number; confidenceScore: number } | undefined;
  onNavigate?: (view: BrandDialogView) => void;
}) {
  const [corporateDnaOpen, setCorporateDnaOpen] = useState(false);
  const brandStory = profile?.brand_story as Record<string, unknown> | undefined;
  const narrativeSummary = brandStory?.narrative_summary as string | undefined;
  const missionVision = brandStory?.mission_vision as { mission?: string; vision?: string } | undefined;
  const brandIdentity = profile?.brand_identity as { tagline?: string } | undefined;

  return (
    <BentoCard title="Corporate DNA" icon={BookOpen} iconColor="text-indigo-500">
      <div className="space-y-2.5">
        {/* Tagline */}
        {brandIdentity?.tagline && (
          <p className="text-sm font-semibold text-foreground/90 italic">
            &ldquo;{brandIdentity.tagline}&rdquo;
          </p>
        )}

        {/* Narrative summary */}
        {narrativeSummary && (
          <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-4">
            {narrativeSummary}
          </p>
        )}

        {/* Mission */}
        {missionVision?.mission && (
          <div>
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">Mission</span>
            <p className="text-[10px] text-foreground/70 leading-relaxed mt-0.5 line-clamp-2">
              {missionVision.mission}
            </p>
          </div>
        )}

        {/* Quick stats */}
        <div className="flex gap-3 pt-1 border-t border-border text-[10px] text-muted-foreground">
          {stats?.directiveCount ? <span>{stats.directiveCount} directives</span> : null}
          {stats?.promptCount ? <span>{stats.promptCount} templates</span> : null}
          {stats?.confidenceScore ? <span>{Math.round(stats.confidenceScore * 100)}% confidence</span> : null}
        </div>

        {/* CTA button */}
        {narrativeSummary ? (
          <button
            type="button"
            onClick={() => onNavigate ? onNavigate('corporate-dna') : setCorporateDnaOpen(true)}
            className="w-full text-[10px] font-medium text-indigo-500 hover:text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg py-2 transition-colors"
          >
            View Full Corporate DNA
          </button>
        ) : (
          <p className="text-[10px] text-muted-foreground/40 italic text-center py-2">
            Import corporate documents to build profile
          </p>
        )}
      </div>
      <CorporateDNADialog
        brand={brand}
        open={corporateDnaOpen}
        onOpenChange={setCorporateDnaOpen}
      />
    </BentoCard>
  );
}

