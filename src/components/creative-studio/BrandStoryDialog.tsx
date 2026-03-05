// ABOUTME: Corporate DNA showcase dialog — branded, visual-rich panel for corporate narrative data
// ABOUTME: 8-section bento layout with branded header, snapshot sidebar, matching Brand DNA dialog quality

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Target, History, Leaf, Lightbulb, Heart, Users, Star, Trophy,
  BookOpen, X, Globe, FileText, BarChart3, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { useBrandProfile, useBrandAnalyses } from '@/hooks/useCreativeStudioBrandIntelligence';
import type { BrandVisualProfile, CreativeStudioBrand } from '@/types/creative-studio';
import type { LucideIcon } from 'lucide-react';
import { BrandDialogNav, type BrandDialogView } from './BrandDialogNav';

// ── Helpers ─────────────────────────────────────────────────────────────────

function darkenHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function isLightColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Reusable card components ────────────────────────────────────────────────

function BentoCard({
  title,
  icon: Icon,
  iconColor,
  className = '',
  children,
}: {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl p-3 ${className}`}
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

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">{value}</p>
    </div>
  );
}

function BadgeList({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-[10px]">{item}</Badge>
        ))}
      </div>
    </div>
  );
}

const TIMELINE_COLLAPSED_COUNT = 6;

function Timeline({ label, items }: { label?: string; items?: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!items?.length) return null;

  const hasOverflow = items.length > TIMELINE_COLLAPSED_COUNT;
  const visible = expanded ? items : items.slice(0, TIMELINE_COLLAPSED_COUNT);
  const hiddenCount = items.length - TIMELINE_COLLAPSED_COUNT;

  return (
    <div>
      {label && <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-2">{label}</span>}
      <div className="relative pl-4 space-y-2">
        {/* Vertical line */}
        <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" />
        {visible.map((item, i) => {
          const match = item.match(/^(\d{4})\s*[:\-–—]\s*(.+)$/);
          const year = match?.[1];
          const desc = match?.[2] || item;
          return (
            <div key={i} className="relative flex items-start gap-2">
              {/* Dot on the line */}
              <div className="absolute -left-4 top-[5px] w-[7px] h-[7px] rounded-full bg-amber-500 ring-2 ring-background" />
              <div className="min-w-0">
                {year ? (
                  <>
                    <span className="text-[10px] font-bold text-amber-600 tabular-nums">{year}</span>
                    <p className="text-[11px] text-foreground/75 leading-snug">{desc}</p>
                  </>
                ) : (
                  <p className="text-[11px] text-foreground/75 leading-snug">{item}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {hasOverflow && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3" /> Show less</>
          ) : (
            <><ChevronDown className="w-3 h-3" /> Show {hiddenCount} more</>
          )}
        </button>
      )}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="text-[11px] text-muted-foreground/50 italic">{text}</p>
  );
}

// ── Types ───────────────────────────────────────────────────────────────────

type BrandStory = NonNullable<BrandVisualProfile['brand_story']>;

interface CorporateDNADialogProps {
  brand: CreativeStudioBrand;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (view: BrandDialogView) => void;
}

// Detect pre-expansion flat schema
function isLegacyFlat(data: Record<string, unknown>): boolean {
  return typeof data.heritage === 'string' || typeof data.mission === 'string';
}

function hasSectionData(obj?: Record<string, unknown> | null): boolean {
  if (!obj) return false;
  return Object.values(obj).some(v =>
    v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
  );
}

// ── Main dialog ─────────────────────────────────────────────────────────────

export function CorporateDNADialog({ brand, open, onOpenChange, onNavigate }: CorporateDNADialogProps) {
  const { data: profile, isLoading } = useBrandProfile(brand.id);
  const { data: analyses } = useBrandAnalyses(brand.id);
  const story = profile?.brand_story as BrandStory | null | undefined;
  const headerTextLight = !isLightColor(brand.primary_color);

  // Header image from source_metadata
  const headerImageUrl = (profile?.source_metadata as Record<string, unknown>)?.header_image_url as string | undefined;

  // Count populated sections
  const populatedCount = story && !isLegacyFlat(story as Record<string, unknown>)
    ? [
        story.mission_vision, story.heritage, story.sustainability, story.innovation,
        story.culture, story.community, story.customer_focus, story.competitive_position,
      ].filter(s => hasSectionData(s as Record<string, unknown> | null)).length
    : 0;

  // Document analyses for sidebar
  const documentAnalyses = (analyses || []).filter(a => a.source_type === 'document');

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
        <DialogTitle className="sr-only">{brand.name} Corporate DNA</DialogTitle>
        <DialogDescription className="sr-only">
          Corporate narrative and identity profile for {brand.name}
        </DialogDescription>

        {/* ── Branded Header ── */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${brand.primary_color} 0%, ${darkenHex(brand.primary_color, 0.35)} 100%)`,
            minHeight: '130px',
          }}
        >
          {/* Hero image overlay */}
          {headerImageUrl && (
            <img
              src={headerImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-contain p-4"
              style={{ opacity: 0.10, mixBlendMode: 'luminosity' }}
            />
          )}

          {/* Gradient overlay */}
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
              {/* Logo */}
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
                {/* Tagline */}
                {profile?.brand_identity?.tagline && (
                  <p
                    className="text-sm italic leading-relaxed mt-1.5 truncate"
                    style={{ color: headerTextLight ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.5)' }}
                  >
                    &ldquo;{profile.brand_identity.tagline}&rdquo;
                  </p>
                )}
              </div>

              {/* Right side: Corporate DNA label + section count + nav */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <p
                  className="text-2xl font-bold tracking-tight font-product-sans"
                  style={{ color: headerTextLight ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.75)' }}
                >
                  Corporate DNA
                </p>
                {populatedCount > 0 && (
                  <p
                    className="text-xs font-product-sans"
                    style={{ color: headerTextLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}
                  >
                    {populatedCount} of 8 sections populated
                  </p>
                )}
                {onNavigate && (
                  <BrandDialogNav
                    activeView="corporate-dna"
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
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div
                className="animate-spin rounded-full h-6 w-6 border-b-2"
                style={{ borderColor: brand.primary_color }}
              />
            </div>
          ) : !story ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground px-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'hsl(var(--cs-surface-1))', border: '1px solid hsl(var(--cs-border-subtle))' }}
              >
                <BookOpen className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-foreground">No corporate DNA profile yet</p>
              <p className="text-sm mt-1 text-muted-foreground text-center max-w-md">
                Run website analysis or import corporate documents (CSR reports, annual reports, pitch decks)
                to build the corporate identity profile.
              </p>
            </div>
          ) : (
            <div className="px-6 py-4">
              {/* Two-zone layout: sections + sidebar */}
              <div className="grid grid-cols-[2fr_1fr] gap-3 items-start">
                {/* Left: sections grid */}
                <div className="space-y-3">
                  {/* Narrative summary — featured card */}
                  {story.narrative_summary && (
                    <div
                      className="rounded-xl p-4"
                      style={{
                        backgroundColor: 'hsl(var(--cs-surface-1))',
                        border: '1px solid hsl(var(--cs-border-subtle))',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                        <h3 className="text-sm font-semibold font-product-sans text-muted-foreground uppercase tracking-wider">
                          Narrative Summary
                        </h3>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed italic">
                        {story.narrative_summary}
                      </p>
                    </div>
                  )}

                  {/* 6-section bento grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Sustainability */}
                    <BentoCard icon={Leaf} iconColor="text-green-600" title="Sustainability">
                      {hasSectionData(story.sustainability as Record<string, unknown> | null) ? (
                        <div className="space-y-2">
                          <Field label="Environmental" value={story.sustainability?.environmental} />
                          <Field label="Social" value={story.sustainability?.social} />
                          <Field label="Governance" value={story.sustainability?.governance} />
                          <BadgeList label="Goals" items={story.sustainability?.goals} />
                        </div>
                      ) : (
                        <EmptyHint text="Analyze website or import CSR / sustainability reports to populate." />
                      )}
                    </BentoCard>

                    {/* Innovation */}
                    <BentoCard icon={Lightbulb} iconColor="text-yellow-500" title="Innovation">
                      {hasSectionData(story.innovation as Record<string, unknown> | null) ? (
                        <div className="space-y-2">
                          <Field label="Approach" value={story.innovation?.approach} />
                          <Field label="Technology" value={story.innovation?.technology} />
                          <BadgeList label="Differentiators" items={story.innovation?.differentiators} />
                        </div>
                      ) : (
                        <EmptyHint text="Analyze website or import pitch decks to populate." />
                      )}
                    </BentoCard>

                    {/* Culture */}
                    <BentoCard icon={Heart} iconColor="text-rose-500" title="Culture">
                      {hasSectionData(story.culture as Record<string, unknown> | null) ? (
                        <div className="space-y-2">
                          <Field label="Values in Practice" value={story.culture?.values_in_practice} />
                          <Field label="Employee Experience" value={story.culture?.employee_experience} />
                          <Field label="DEI" value={story.culture?.dei} />
                        </div>
                      ) : (
                        <EmptyHint text="Import DEI reports or corporate brochures to populate." />
                      )}
                    </BentoCard>

                    {/* Community */}
                    <BentoCard icon={Users} iconColor="text-teal-500" title="Community">
                      {hasSectionData(story.community as Record<string, unknown> | null) ? (
                        <div className="space-y-2">
                          <Field label="Programs" value={story.community?.programs} />
                          <Field label="Impact" value={story.community?.impact_metrics} />
                          <BadgeList label="Partnerships" items={story.community?.partnerships} />
                        </div>
                      ) : (
                        <EmptyHint text="Analyze website or import CSR / annual reports to populate." />
                      )}
                    </BentoCard>

                    {/* Customer Focus */}
                    <BentoCard icon={Star} iconColor="text-orange-500" title="Customer Focus">
                      {hasSectionData(story.customer_focus as Record<string, unknown> | null) ? (
                        <div className="space-y-2">
                          <Field label="Promise" value={story.customer_focus?.promise} />
                          <Field label="Experience" value={story.customer_focus?.experience} />
                          <BadgeList label="Themes" items={story.customer_focus?.testimonial_themes} />
                        </div>
                      ) : (
                        <EmptyHint text="Analyze website or import pitch decks to populate." />
                      )}
                    </BentoCard>

                    {/* Competitive Position */}
                    <BentoCard icon={Trophy} iconColor="text-indigo-500" title="Competitive Position">
                      {hasSectionData(story.competitive_position as Record<string, unknown> | null) ? (
                        <div className="space-y-2">
                          <Field label="Market Position" value={story.competitive_position?.market_position} />
                          <BadgeList label="Key Differentiators" items={story.competitive_position?.key_differentiators} />
                          <BadgeList label="Awards" items={story.competitive_position?.awards} />
                        </div>
                      ) : (
                        <EmptyHint text="Analyze website or import investor presentations to populate." />
                      )}
                    </BentoCard>
                  </div>
                </div>

                {/* Right: Identity + Heritage sidebar */}
                <div className="sticky top-0 space-y-3">
                  {/* Mission & Vision */}
                  <BentoCard icon={Target} iconColor="text-blue-500" title="Mission & Vision">
                    {hasSectionData(story.mission_vision as Record<string, unknown> | null) ? (
                      <div className="space-y-2">
                        <Field label="Mission" value={story.mission_vision?.mission} />
                        <Field label="Vision" value={story.mission_vision?.vision} />
                        <Field label="Purpose" value={story.mission_vision?.purpose} />
                      </div>
                    ) : (
                      <EmptyHint text="Analyze website or import corporate documents to populate." />
                    )}
                  </BentoCard>

                  {/* Heritage */}
                  <BentoCard icon={History} iconColor="text-amber-600" title="Heritage">
                    {hasSectionData(story.heritage as Record<string, unknown> | null) ? (
                      <div className="space-y-2">
                        <Field label="Founding Story" value={story.heritage?.founding_story} />
                        <Field label="Legacy" value={story.heritage?.legacy} />
                      </div>
                    ) : (
                      <EmptyHint text="Analyze website or import corporate documents to populate." />
                    )}
                  </BentoCard>

                  {/* Milestones timeline */}
                  {story.heritage?.milestones && story.heritage.milestones.length > 0 && (
                    <BentoCard icon={History} iconColor="text-amber-600" title="Milestones">
                      <Timeline items={story.heritage.milestones} />
                    </BentoCard>
                  )}

                  <CorporateSnapshotCard
                    brand={brand}
                    populatedCount={populatedCount}
                    documentAnalyses={documentAnalyses}
                    profile={profile}
                  />
                </div>
              </div>

              {/* Footer meta */}
              {profile?.updated_at && (
                <div className="mt-4 pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground text-center">
                    Last updated {new Date(profile.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── Corporate Snapshot card ─────────────────────────────────────────────────

function CorporateSnapshotCard({
  brand,
  populatedCount,
  documentAnalyses,
  profile,
}: {
  brand: CreativeStudioBrand;
  populatedCount: number;
  documentAnalyses: { source_image_url?: string | null; analyzed_at?: string | null; tags?: string[] | null }[];
  profile: Record<string, unknown> | undefined;
}) {
  const sourceMeta = profile?.source_metadata as Record<string, unknown> | undefined;
  const lastSynthesized = sourceMeta?.last_synthesized as string | undefined;

  const categoryLabel = brand.brand_category
    ? brand.brand_category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null;

  return (
    <BentoCard title="Corporate Snapshot" icon={BarChart3} iconColor="text-indigo-500">
      <div className="space-y-2.5">
        {/* Category */}
        {categoryLabel && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Industry</span>
            <span className="font-medium text-foreground">{categoryLabel}</span>
          </div>
        )}

        {/* Sections populated */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Sections Populated</span>
          <span className="font-medium text-foreground">{populatedCount} of 8</span>
        </div>

        {/* Source documents — from pipeline analyses or manual sources */}
        {(() => {
          const manualSources = (sourceMeta?.manual_sources as string[] | undefined) || [];
          const hasDocAnalyses = documentAnalyses.length > 0;
          const hasManualSources = manualSources.length > 0;
          if (!hasDocAnalyses && !hasManualSources) return null;
          return (
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <FileText className="w-3 h-3" />
                <span>Sources</span>
              </div>
              <div className="space-y-1.5">
                {documentAnalyses.map((doc, i) => {
                  const docType = doc.tags?.find(t => t !== 'document-analysis')?.replace(/_/g, ' ') || '';
                  return (
                    <div key={`doc-${i}`} className="flex items-start gap-2">
                      <FileText className="w-3 h-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-foreground/70 truncate">
                          {doc.source_image_url || `Document ${i + 1}`}
                        </p>
                        {docType && (
                          <Badge variant="secondary" className="text-[9px] mt-0.5">{docType}</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                {manualSources.map((src, i) => (
                  <div key={`manual-${i}`} className="flex items-start gap-2">
                    <FileText className="w-3 h-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-foreground/70 truncate">{src}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Last synthesized */}
        {lastSynthesized && (
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Last Synthesized</span>
              <span>{new Date(lastSynthesized).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        )}
      </div>
    </BentoCard>
  );
}

// Keep backward-compatible export for existing imports during transition
export { CorporateDNADialog as BrandStoryDialog };
